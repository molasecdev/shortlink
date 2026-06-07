import type { APIRoute } from "astro";
import { validateSession } from "../../../lib/session";
import { getUserById, createUser } from "../../../lib/auth";

interface CreateUserRequest {
	username: string;
	password: string;
	role: "admin" | "user";
}

export const POST: APIRoute = async ({ request }) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		// Check authentication
		const cookieHeader = request.headers.get("cookie");
		const sessionId = cookieHeader
			?.split("; ")
			.find((c) => c.startsWith("session="))
			?.split("=")[1];

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const userId = await validateSession(sessionId);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const user = await getUserById(userId);
		if (!user || user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Forbidden" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		const contentType = request.headers.get("content-type") || "";
		let username = "";
		let password = "";
		let role: "admin" | "user" = "user";

		if (contentType.includes("application/json")) {
			const body = (await request.json()) as CreateUserRequest;
			username = body.username;
			password = body.password;
			role = body.role || "user";
		} else {
			const form = await request.formData();
			username = String(form.get("username") || "");
			password = String(form.get("password") || "");
			role = String(form.get("role") || "user") as "admin" | "user";
		}

		if (!username || !password) {
			if (!contentType.includes("application/json")) {
				return new Response(null, {
					status: 302,
					headers: { Location: "/users/create?error=missing" },
				});
			}
			return new Response(
				JSON.stringify({ error: "Username and password are required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (username.length < 4 || username.length > 30) {
			if (!contentType.includes("application/json")) {
				return new Response(null, {
					status: 302,
					headers: { Location: "/users/create?error=username" },
				});
			}
			return new Response(
				JSON.stringify({ error: "Username must be 4-30 characters" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (password.length < 8) {
			if (!contentType.includes("application/json")) {
				return new Response(null, {
					status: 302,
					headers: { Location: "/users/create?error=password" },
				});
			}
			return new Response(
				JSON.stringify({ error: "Password must be at least 8 characters" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const newUser = await createUser(username, password, role || "user");

		if (contentType.includes("application/json")) {
			return new Response(JSON.stringify(newUser), {
				status: 201,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(null, { status: 302, headers: { Location: "/users" } });
	} catch (error) {
		console.error("Create user error:", error);
		const message =
			error instanceof Error ? error.message : "Internal server error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
