import { defaultConfig, info } from "@/constants";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_DEV = {
	allowRegistration: true,
	siteUrl: info.localSiteUrl,
};

export interface StorageFile {
	users: string;
	links: string;
	sessions: string;
	config: string;
}

export const FILES: StorageFile = {
	users: path.join(DATA_DIR, "users.json"),
	links: path.join(DATA_DIR, "links.json"),
	sessions: path.join(DATA_DIR, "sessions.json"),
	config: `${
		process.env.NODE_ENV === "development"
			? CONFIG_DEV
			: path.join(DATA_DIR, "config.json")
	}`,
};

async function ensureDir(dir: string) {
	try {
		await fs.access(dir);
	} catch {
		await fs.mkdir(dir, { recursive: true });
	}
}

async function ensureFile(file: string, defaultData: unknown) {
	try {
		await fs.access(file);
	} catch {
		await ensureDir(path.dirname(file));
		await fs.writeFile(file, JSON.stringify(defaultData, null, 2));
	}
}

export async function readJson<T>(file: string): Promise<T> {
	try {
		const data = await fs.readFile(file, "utf-8");
		return JSON.parse(data) as T;
	} catch {
		// If file doesn't exist yet, create it with a sensible default
		const name = path.basename(file);
		if (name === path.basename(FILES.config)) {
			await ensureDir(path.dirname(file));
			await fs.writeFile(file, JSON.stringify(defaultConfig, null, 2));
			return defaultConfig as unknown as T;
		}

		// For other storage files default to an empty array
		const defaultData: unknown = [];
		await ensureDir(path.dirname(file));
		await fs.writeFile(file, JSON.stringify(defaultData, null, 2));
		return defaultData as unknown as T;
	}
}

export async function writeJson(file: string, data: unknown): Promise<void> {
	try {
		await ensureDir(path.dirname(file));
		const tempFile = `${file}.tmp`;

		// Write to temporary file
		await fs.writeFile(tempFile, JSON.stringify(data, null, 2));

		// Validate JSON
		await fs.readFile(tempFile, "utf-8");

		// Atomic rename
		await fs.rename(tempFile, file);
	} catch (error) {
		throw new Error(`Failed to write JSON: ${error}`);
	}
}

export async function initializeStorage(): Promise<void> {
	await ensureFile(FILES.users, []);
	await ensureFile(FILES.links, []);
	await ensureFile(FILES.sessions, []);
	await ensureFile(FILES.config, defaultConfig);
}
