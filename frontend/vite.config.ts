// Configura o servidor de desenvolvimento e o processamento do CSS com Tailwind.
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: { port: 5173 },
});
