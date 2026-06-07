import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
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
