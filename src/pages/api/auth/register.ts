import type { APIRoute } from "astro";
import { createUser, getUserByUsername } from "../../../lib/auth";

interface RegisterRequest {
	username: string;
	password: string;
}

export const POST: APIRoute = async ({ request }) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		const { username, password } = (await request.json()) as RegisterRequest;

		if (!username || !password) {
			return new Response(
				JSON.stringify({ error: "Username and password required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (username.length < 4 || username.length > 30) {
			return new Response(
				JSON.stringify({ error: "Username must be 4-30 characters" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (password.length < 8) {
			return new Response(
				JSON.stringify({ error: "Password must be at least 8 characters" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const existing = await getUserByUsername(username);
		if (existing) {
			return new Response(
				JSON.stringify({ error: "Username already exists" }),
				{
					status: 409,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		await createUser(username, password, "user");

		return new Response(JSON.stringify({ success: true }), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Register error:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
