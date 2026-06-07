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
		const contentType = request.headers.get("content-type") || "";
		let username = "";
		let password = "";

		if (contentType.includes("application/json")) {
			const body = await request.json();
			username = String(body.username || "");
			password = String(body.password || "");
		} else {
			const form = await request.formData();
			username = String(form.get("username") || "");
			password = String(form.get("password") || "");
		}

		if (!username || !password) {
			// redirect back to login with error
			return new Response(null, {
				status: 302,
				headers: { Location: "/login?error=missing" },
			});
		}

		const user = await getUserByUsername(username);
		if (!user) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/login?error=invalid" },
			});
		}

		const validPassword = await verifyPassword(password, user.passwordHash);
		if (!validPassword) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/login?error=invalid" },
			});
		}

		const sessionId = await createSession(user.id);
		const headers = new Headers();
		setSessionCookie(headers, sessionId);
		headers.set("Location", "/dashboard");
		return new Response(null, { status: 302, headers });
	} catch (error) {
		console.error("Login error:", error);
		return new Response(null, { status: 500 });
	}
};
