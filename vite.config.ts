import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Serves the live-quote endpoints under `npm run dev`.
 *
 * In production they are Vercel functions in api/. Vite has no function
 * runtime, so without this the app in development would always fall back to
 * its bundled prices and the live path would only ever run once deployed.
 * Both call the same handlers in api/_lib/quotes.ts.
 */
function devApi(): Plugin {
  return {
    name: 'filterer-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname !== '/api/quotes' && url.pathname !== '/api/market_indices') return next();
        try {
          const lib = await server.ssrLoadModule('/api/_lib/quotes.ts');
          const result =
            url.pathname === '/api/quotes' ? await lib.handleQuotes(url.searchParams) : await lib.handleIndices();
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json');
          for (const [key, value] of Object.entries(result.headers as Record<string, string>)) {
            res.setHeader(key, value);
          }
          res.end(JSON.stringify(result.body));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react', '@phosphor-icons/react'],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
