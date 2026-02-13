import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { warehouseRouter } from './routes/warehouses.js';
import { productRouter } from './routes/products.js';
import { navigationRouter } from './routes/navigation.js';
import { spatialRouter } from './routes/spatial.js';
import { subscriptionRouter } from './routes/subscription.js';
import { uploadRouter } from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/warehouses', warehouseRouter);
app.use('/api/products', productRouter);
app.use('/api/navigation', navigationRouter);
app.use('/api/spatial', spatialRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve client in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`AR01 Warehouse AR Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;
