/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@angular/build/vite';

export default defineConfig({
    plugins: [angular()],
    server: {
        allowedHosts: true, // Allow all hosts for tunnel access
    },
});
