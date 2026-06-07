const primarySite = "wildanmaulana.my.id";
const localSite = "http://localhost:4321";

const subdomain = "https://shorturl";

export const info = {
	siteUrl: `${subdomain}.${primarySite}`,
	localSiteUrl: localSite,
};

export const defaultConfig = {
	allowRegistration: true,
	siteUrl: info.siteUrl,
};

export const cekEnv = (slug: string) => {
	return process.env.NODE_ENV === "development"
		? `${info.localSiteUrl}/${slug}`
		: `${info.siteUrl}/${slug}`;
};
