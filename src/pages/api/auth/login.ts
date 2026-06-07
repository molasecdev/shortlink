import type { APIRoute } from "astro";
import { getUserByUsername, verifyPassword } from "../../../lib/auth";
import { createSession, setSessionCookie } from "../../../lib/session";

interface LoginRequest {
	username: string;
	password: string;
}

export const POST: APIRoute = async ({ request }) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		const { username, password } = (await request.json()) as LoginRequest;

		if (!username || !password) {
			return new Response(
				JSON.stringify({ error: "Username and password required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const user = await getUserByUsername(username);
		if (!user) {
			return new Response(JSON.stringify({ error: "Invalid credentials" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const validPassword = await verifyPassword(password, user.passwordHash);
		if (!validPassword) {
			return new Response(JSON.stringify({ error: "Invalid credentials" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const sessionId = await createSession(user.id);
		const response = new Response(
			JSON.stringify({ redirectUrl: "/dashboard" }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);

		setSessionCookie(response.headers, sessionId);
		return response;
	} catch (error) {
		console.error("Login error:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
