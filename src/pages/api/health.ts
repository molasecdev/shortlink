import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
	try {
		console.log("Health GET ping", {
			host: request.headers.get("host"),
			origin: request.headers.get("origin"),
			referer: request.headers.get("referer"),
			"x-forwarded-for":
				request.headers.get("x-forwarded-for") ||
				request.headers.get("x-real-ip"),
		});
		return new Response("OK", { status: 200 });
	} catch (e) {
		console.error("Health GET error", e);
		return new Response("Error", { status: 500 });
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		console.log("Health POST ping", {
			host: request.headers.get("host"),
			origin: request.headers.get("origin"),
			referer: request.headers.get("referer"),
			"x-forwarded-for":
				request.headers.get("x-forwarded-for") ||
				request.headers.get("x-real-ip"),
		});
		return new Response("OK", { status: 200 });
	} catch (e) {
		console.error("Health POST error", e);
		return new Response("Error", { status: 500 });
	}
};
