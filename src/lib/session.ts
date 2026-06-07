import { v4 as uuidv4 } from "uuid";
import { readJson, writeJson, FILES } from "./storage";

export interface Session {
	sessionId: string;
	userId: string;
	expiresAt: string;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(userId: string): Promise<string> {
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
	const sessions = await readJson<Session[]>(FILES.sessions);
	const session = sessions.find((s) => s.sessionId === sessionId);

	if (!session) return null;
	if (new Date(session.expiresAt) < new Date()) return null;

	return session.userId;
}

export async function deleteSession(sessionId: string): Promise<void> {
	const sessions = await readJson<Session[]>(FILES.sessions);
	const filtered = sessions.filter((s) => s.sessionId !== sessionId);
	await writeJson(FILES.sessions, filtered);
}

export async function deleteSessionsByUser(userId: string): Promise<void> {
  const sessions = await readJson<Session[]>(FILES.sessions);
  const filtered = sessions.filter((s) => s.userId !== userId);
  await writeJson(FILES.sessions, filtered);
}

export async function cleanupExpiredSessions(): Promise<void> {
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
