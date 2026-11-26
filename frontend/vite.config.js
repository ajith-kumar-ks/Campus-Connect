import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The FastAPI CORS list only allows http://localhost:5173 and http://127.0.0.1:5173,
// so strictPort makes Vite fail loudly instead of silently hopping to another port.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
