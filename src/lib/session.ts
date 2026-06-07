import { v4 as uuidv4 } from "uuid";
import { readJson, writeJson, FILES } from "./storage";
import crypto from "crypto";

export interface Session {
	sessionId: string;
	userId: string;
	expiresAt: string;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// If SESSION_SECRET is provided, use HMAC-signed stateless sessions.
// Otherwise fall back to file-backed sessions (development).
let SESSION_SECRET = process.env.SESSION_SECRET || "";
const IS_PROD = process.env.NODE_ENV === 'production';

// Auto-generate a local SESSION_SECRET and persist it to data/session-secret.txt
// when running in development and SESSION_SECRET is not provided. This enables
// HMAC locally without manual env setup.
if (!SESSION_SECRET && !IS_PROD) {
	try {
		// prefer the project's data directory
		const fs = await import('fs/promises');
		const path = await import('path');
		const dataDir = path.join(process.cwd(), 'data');
		const secretFile = path.join(dataDir, 'session-secret.txt');
		try {
			const existing = await fs.readFile(secretFile, 'utf-8');
			SESSION_SECRET = existing.trim();
		} catch {
			// generate and persist
			await fs.mkdir(dataDir, { recursive: true });
			const secret = crypto.randomBytes(32).toString('hex');
			await fs.writeFile(secretFile, secret, { encoding: 'utf-8', flag: 'w' });
			SESSION_SECRET = secret;
		}
	} catch (err) {
		// ignore and keep SESSION_SECRET empty (will use file-backed sessions)
		console.warn('Could not auto-generate SESSION_SECRET:', String(err));
	}
}

const USE_HMAC = Boolean(SESSION_SECRET);

function base64urlEncode(input: Buffer | string) {
	if (typeof input === "string") input = Buffer.from(input, "utf-8");
	return input.toString("base64url");
}

function base64urlDecode(input: string) {
	return Buffer.from(input, "base64url").toString("utf-8");
}

function signPayload(payloadB64: string) {
	const h = crypto.createHmac("sha256", SESSION_SECRET);
	h.update(payloadB64);
	return base64urlEncode(h.digest());
}

export async function createSession(userId: string): Promise<string> {
	if (USE_HMAC) {
		const exp = Date.now() + SESSION_DURATION;
		const payload = JSON.stringify({ userId, exp });
		const payloadB64 = base64urlEncode(payload);
		const sig = signPayload(payloadB64);
		return `${payloadB64}.${sig}`;
	}

	// fallback to file-backed sessions
	const sessions = await readJson<Session[]>(FILES.sessions);
	const sessionId = uuidv4();

	const newSession: Session = {
		sessionId,
		userId,
		expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
	};

	sessions.push(newSession);
	await writeJson(FILES.sessions, sessions);

	return sessionId;
}

export async function validateSession(
	sessionId: string,
): Promise<string | null> {
	if (USE_HMAC && sessionId && sessionId.includes(".")) {
		try {
			const [payloadB64, sig] = sessionId.split(".");
			if (!payloadB64 || !sig) return null;
			const expected = signPayload(payloadB64);
			// constant-time compare
			const a = Buffer.from(expected);
			const b = Buffer.from(sig);
			if (a.length !== b.length) return null;
			if (!crypto.timingSafeEqual(a, b)) return null;

			const payloadJson = base64urlDecode(payloadB64);
			const parsed = JSON.parse(payloadJson) as { userId: string; exp: number };
			if (!parsed.userId || !parsed.exp) return null;
			if (Date.now() > parsed.exp) return null;
			return parsed.userId;
		} catch (err) {
			return null;
		}
	}

	// fallback: file-backed sessions
	const sessions = await readJson<Session[]>(FILES.sessions);
	const session = sessions.find((s) => s.sessionId === sessionId);

	if (!session) return null;
	if (new Date(session.expiresAt) < new Date()) return null;

	return session.userId;
}

export async function deleteSession(sessionId: string): Promise<void> {
	if (USE_HMAC) {
		// stateless sessions cannot be deleted server-side without revocation store
		return;
	}

	const sessions = await readJson<Session[]>(FILES.sessions);
	const filtered = sessions.filter((s) => s.sessionId !== sessionId);
	await writeJson(FILES.sessions, filtered);
}

export async function deleteSessionsByUser(userId: string): Promise<void> {
	if (USE_HMAC) return;
	const sessions = await readJson<Session[]>(FILES.sessions);
	const filtered = sessions.filter((s) => s.userId !== userId);
	await writeJson(FILES.sessions, filtered);
}

export async function cleanupExpiredSessions(): Promise<void> {
	if (USE_HMAC) return;
	const sessions = await readJson<Session[]>(FILES.sessions);
	const now = new Date();
	const active = sessions.filter((s) => new Date(s.expiresAt) > now);
	await writeJson(FILES.sessions, active);
}

export function setSessionCookie(headers: Headers, sessionId: string): void {
	const isProd = process.env.NODE_ENV === "production";
	const secureFlag = isProd ? "Secure; " : "";
	headers.set(
		"Set-Cookie",
		`session=${sessionId}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}`,
	);
}

export function clearSessionCookie(headers: Headers): void {
	const isProd = process.env.NODE_ENV === "production";
	const secureFlag = isProd ? "Secure; " : "";
	headers.set(
		"Set-Cookie",
		`session=; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=0`,
	);
}
