import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createTemplateRoutes } from './routes/templates.js';
import { createMappingRoutes } from './routes/mappings.js';
import { createGenerateRoutes } from './routes/generate.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/templates', createTemplateRoutes(prisma));
app.use('/api/mappings', createMappingRoutes(prisma));
app.use('/api/generate', createGenerateRoutes(prisma));

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BoldLabels API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
