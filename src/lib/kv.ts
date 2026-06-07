/**
 * Storage adapter: pakai Upstash Redis di production (Vercel),
 * fallback ke file JSON di lokal.
 *
 * Cara kerja:
 * - Kalau env KV_REST_API_URL ada → pakai @vercel/kv (Upstash)
 * - Kalau tidak ada → pakai readJson/writeJson dari storage.ts (file lokal)
 */

import { readJson, writeJson, FILES } from "./storage";

// Lazy-load @vercel/kv hanya kalau env tersedia, agar tidak crash di lokal
const USE_KV = Boolean(process.env.KV_REST_API_URL);

async function getKv() {
	if (!USE_KV) return null;
	const { kv } = await import("@vercel/kv");
	return kv;
}

// ─── Generic helpers ──────────────────────────────────────

async function kvGet<T>(key: string): Promise<T | null> {
	const kv = await getKv();
	if (!kv) return null;
	return kv.get<T>(key);
}

async function kvSet(key: string, value: unknown): Promise<void> {
	const kv = await getKv();
	if (!kv) return;
	await kv.set(key, value);
}

// ─── Users ────────────────────────────────────────────────

export async function storageGetUsers<T>(): Promise<T[]> {
	if (USE_KV) {
		return (await kvGet<T[]>("users")) ?? [];
	}
	return readJson<T[]>(FILES.users);
}

export async function storageSetUsers<T>(data: T[]): Promise<void> {
	if (USE_KV) {
		await kvSet("users", data);
		return;
	}
	await writeJson(FILES.users, data);
}

// ─── Links ────────────────────────────────────────────────

export async function storageGetLinks<T>(): Promise<T[]> {
	if (USE_KV) {
		return (await kvGet<T[]>("links")) ?? [];
	}
	return readJson<T[]>(FILES.links);
}

export async function storageSetLinks<T>(data: T[]): Promise<void> {
	if (USE_KV) {
		await kvSet("links", data);
		return;
	}
	await writeJson(FILES.links, data);
}

// ─── Config ───────────────────────────────────────────────

export async function storageGetConfig<T>(): Promise<T | null> {
	if (USE_KV) {
		return kvGet<T>("config");
	}
	return readJson<T>(FILES.config);
}

export async function storageSetConfig<T>(data: T): Promise<void> {
	if (USE_KV) {
		await kvSet("config", data);
		return;
	}
	await writeJson(FILES.config, data);
}
