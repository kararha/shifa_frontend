import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8888',
                changeOrigin: true,
                rewrite: (path) => {
                    // Remove the /api prefix but maintain the rest of the path
                    const newPath = path.replace(/^\/api/, '');
                    console.log(`Rewriting path: ${path} -> ${newPath}`);
                    return newPath;
                }
            }
        }
    }
});
