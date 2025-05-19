import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to your API Gateway at localhost:4000
      '/query-flight': 'http://localhost:3000',
      '/check-in': 'http://localhost:3000',
      '/buy-ticket': 'http://localhost:3000',
      '/ai-agent': 'http://localhost:3000',
    },
  },
});
