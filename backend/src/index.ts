import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createTemplateRoutes } from './routes/templates.js';
import { createMappingRoutes } from './routes/mappings.js';
import { createGenerateRoutes } from './routes/generate.js';
import { createLayoutPresetRoutes } from './routes/layoutPresets.js';
import { createSessionDataRoutes } from './routes/sessionData.js';
import { errorHandler } from './middleware/validation.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/templates', createTemplateRoutes(prisma));
app.use('/api/mappings', createMappingRoutes(prisma));
app.use('/api/layout-presets', createLayoutPresetRoutes(prisma));
app.use('/api/session-data', createSessionDataRoutes(prisma));
app.use('/api/generate', createGenerateRoutes(prisma));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BoldLabels API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
