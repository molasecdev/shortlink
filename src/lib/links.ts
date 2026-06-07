import { v4 as uuidv4 } from "uuid";
import { readJson, writeJson, FILES } from "./storage";

export interface ShortLink {
	id: string;
	slug: string;
	targetUrl: string;
	clicks: number;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export async function validateSlug(slug: string): Promise<boolean> {
	if (!slug || slug.length < 3 || slug.length > 50) return false;
	return /^[a-zA-Z0-9_-]+$/.test(slug);
}

export async function validateUrl(url: string): Promise<boolean> {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export async function slugExists(
	slug: string,
	excludeId?: string,
): Promise<boolean> {
	const links = await readJson<ShortLink[]>(FILES.links);
	return links.some((l) => l.slug === slug && l.id !== excludeId);
}

export async function createLink(
	slug: string,
	targetUrl: string,
	createdBy: string,
): Promise<ShortLink> {
	if (!(await validateSlug(slug))) {
		throw new Error("Invalid slug format");
	}
	if (!(await validateUrl(targetUrl))) {
		throw new Error("Invalid URL");
	}
	if (await slugExists(slug)) {
		throw new Error("Slug already exists");
	}

	const links = await readJson<ShortLink[]>(FILES.links);
	const newLink: ShortLink = {
		id: uuidv4(),
		slug,
		targetUrl,
		clicks: 0,
		createdBy,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	links.push(newLink);
	await writeJson(FILES.links, links);

	return newLink;
}

export async function getLinkBySlug(slug: string): Promise<ShortLink | null> {
	const links = await readJson<ShortLink[]>(FILES.links);
	return links.find((l) => l.slug === slug) || null;
}

export async function getLinkById(id: string): Promise<ShortLink | null> {
	const links = await readJson<ShortLink[]>(FILES.links);
	return links.find((l) => l.id === id) || null;
}

export async function incrementClicks(slug: string): Promise<void> {
	const links: any[] = await readJson<ShortLink[]>(FILES.links);
	const linkIndex = links.findIndex((l) => l.slug === slug);

	if (linkIndex !== -1) {
		links[linkIndex].clicks++;
		await writeJson(FILES.links, links);
	}
}

export async function updateLink(
	id: string,
	updates: Partial<ShortLink>,
): Promise<ShortLink> {
	const links: any[] = await readJson<ShortLink[]>(FILES.links);
	const linkIndex = links.findIndex((l) => l.id === id);

	if (linkIndex === -1) {
		throw new Error("Link not found");
	}

	if (updates.slug && updates.slug !== links[linkIndex].slug) {
		if (await slugExists(updates.slug)) {
			throw new Error("Slug already exists");
		}
	}

	if (updates.targetUrl && !(await validateUrl(updates.targetUrl))) {
		throw new Error("Invalid URL");
	}

	links[linkIndex] = {
		...links[linkIndex],
		...updates,
		updatedAt: new Date().toISOString(),
	};

	await writeJson(FILES.links, links);
	return links[linkIndex];
}

export async function deleteLink(id: string): Promise<void> {
	const links = await readJson<ShortLink[]>(FILES.links);
	const filtered = links.filter((l) => l.id !== id);
	await writeJson(FILES.links, filtered);
}

export async function deleteLinksByUser(userId: string): Promise<void> {
  const links = await readJson<ShortLink[]>(FILES.links);
  const filtered = links.filter((l) => l.createdBy !== userId);
  await writeJson(FILES.links, filtered);
}

export async function getLinksByUser(userId: string): Promise<ShortLink[]> {
	const links = await readJson<ShortLink[]>(FILES.links);
	return links.filter((l) => l.createdBy === userId);
}

export async function getAllLinks(): Promise<ShortLink[]> {
	return readJson<ShortLink[]>(FILES.links);
}
