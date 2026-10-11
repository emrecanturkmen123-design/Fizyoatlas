import {defineConfig} from 'vite';
export default defineConfig({publicDir:false,build:{ssr:'server/worker.ts',outDir:'dist/server',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'index.js'}}}});
