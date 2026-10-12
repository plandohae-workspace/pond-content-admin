import {defineConfig} from 'vite';
export default defineConfig({base:'/pond-content-admin/',build:{rollupOptions:{output:{manualChunks:{excel:['exceljs']}}}}});
