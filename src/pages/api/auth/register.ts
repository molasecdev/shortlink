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
		const contentType = request.headers.get("content-type") || "";
		let username = "";
		let password = "";
		let confirmPassword = "";

		if (contentType.includes("application/json")) {
			const body = await request.json();
			username = String(body.username || "");
			password = String(body.password || "");
			confirmPassword = String(body.confirmPassword || "");
		} else {
			const form = await request.formData();
			username = String(form.get("username") || "");
			password = String(form.get("password") || "");
			confirmPassword = String(form.get("confirmPassword") || "");
		}

		if (!username || !password || !confirmPassword) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/register?error=missing" },
			});
		}

		if (username.length < 4 || username.length > 30) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/register?error=username" },
			});
		}

		if (password.length < 8) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/register?error=password" },
			});
		}

		if (password !== confirmPassword) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/register?error=match" },
			});
		}

		const existing = await getUserByUsername(username);
		if (existing) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/register?error=exists" },
			});
		}

		await createUser(username, password, "user");
		return new Response(null, {
			status: 302,
			headers: { Location: "/login?registered=1" },
		});
	} catch (error) {
		console.error("Register API error:", error);
		return new Response(null, { status: 500 });
	}
};
