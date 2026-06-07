import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { info } from './constants';

const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  site: isDevelopment ? info.localSiteUrl : info.siteUrl,
  security: {
    checkOrigin: false,
  },
  integrations: [tailwind()],
  output: 'server',
  adapter: isDevelopment
    ? node({ mode: 'middleware' })
    : vercel(),
  vite: {
    ssr: {
      external: ['bcrypt']
    }
  }
});
