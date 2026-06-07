import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { readJson, writeJson, FILES } from "./storage";
import { deleteLinksByUser } from "./links";
import { deleteSessionsByUser } from "./session";

export interface User {
	id: string;
	username: string;
	passwordHash: string;
	role: "admin" | "user";
	createdAt: string;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function getUserByUsername(
	username: string,
): Promise<User | null> {
	const users = await readJson<User[]>(FILES.users);
	return users.find((u) => u.username === username) || null;
}

export async function getUserById(id: string): Promise<User | null> {
	const users = await readJson<User[]>(FILES.users);
	return users.find((u) => u.id === id) || null;
}

export async function createUser(
	username: string,
	password: string,
	role: "admin" | "user" = "user",
): Promise<User> {
	const users = await readJson<User[]>(FILES.users);

	if (users.some((u) => u.username === username)) {
		throw new Error("Username already exists");
	}

	const passwordHash = await hashPassword(password);
	const newUser: User = {
		id: uuidv4(),
		username,
		passwordHash,
		role,
		createdAt: new Date().toISOString(),
	};

	users.push(newUser);
	await writeJson(FILES.users, users);

	return newUser;
}

export async function updateUser(
	id: string,
	updates: Partial<User>,
): Promise<User> {
	const users: any[] = await readJson<User[]>(FILES.users);
	const userIndex = users.findIndex((u: any) => u.id === id);

	if (userIndex === -1) {
		throw new Error("User not found");
	}

	users[userIndex] = { ...users[userIndex], ...updates };
	await writeJson(FILES.users, users);

	return users[userIndex];
}

export async function deleteUser(id: string): Promise<void> {
	// remove sessions, then links created by this user, then remove user
	await deleteSessionsByUser(id);
	await deleteLinksByUser(id);
	const users = await readJson<User[]>(FILES.users);
	const filtered = users.filter((u) => u.id !== id);
	await writeJson(FILES.users, filtered);
}

export async function getAllUsers(): Promise<User[]> {
	return readJson<User[]>(FILES.users);
}
