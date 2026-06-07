import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { info } from './constants';

const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  site: isVercel ? info.siteUrl : info.localSiteUrl,
  integrations: [tailwind()],
  output: 'server',
  adapter: isVercel
    ? vercel()
    : node({ mode: 'middleware' }),
  vite: {
    ssr: {
      external: ['bcrypt']
    }
  }
});
