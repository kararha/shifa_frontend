import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        alias: {
            '$lib': './src/lib',
            '$components': './src/lib/components'
        }
    },
    preprocess: vitePreprocess(),
    compilerOptions: {
        // Ensure Svelte 4 compatibility
        hydratable: true
    }
};

export default config;
