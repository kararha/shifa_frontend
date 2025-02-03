import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8888',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        },
        fs: {
            allow: ['static']
        },
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: '@use "src/variables.scss" as *;'
            }
        }
    },
    resolve: {
        alias: {
            $lib: path.resolve('./src/lib'),
            $components: path.resolve('./src/lib/components')
        }
    }
});