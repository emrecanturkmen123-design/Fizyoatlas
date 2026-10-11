import {defineConfig} from 'vite';
export default defineConfig({publicDir:false,ssr:{noExternal:['jose']},build:{ssr:'server/worker.ts',outDir:'dist/server',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'index.js'}}}});
