import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MappingSchema, ColumnMappingSchema } from '../schemas.js';

const router = Router();

export function createMappingRoutes(prisma: PrismaClient) {
  // GET /api/mappings - List all mappings
  router.get('/', async (req, res) => {
    try {
      const mappings = await prisma.mapping.findMany({
        include: { columnMappings: true },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mappings' });
    }
  });

  // GET /api/mappings/:id - Get single mapping
  router.get('/:id', async (req, res) => {
    try {
      const mapping = await prisma.mapping.findUnique({
        where: { id: req.params.id },
        include: { columnMappings: true },
      });
      
      if (!mapping) {
        return res.status(404).json({ error: 'Mapping not found' });
      }
      
      res.json(mapping);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mapping' });
    }
  });

  // GET /api/mappings/template/:templateId - Get mappings for template
  router.get('/template/:templateId', async (req, res) => {
    try {
      const mappings = await prisma.mapping.findMany({
        where: { templateId: req.params.templateId },
        include: { columnMappings: true },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mappings' });
    }
  });

  // POST /api/mappings - Create mapping
  router.post('/', async (req, res) => {
    try {
      const validated = MappingSchema.parse(req.body);
      const columnMappings = req.body.columnMappings || [];
      
      // Validate column mappings
      const validatedMappings = columnMappings.map((cm: any) => ColumnMappingSchema.parse(cm));
      
      const mapping = await prisma.mapping.create({
        data: {
          name: validated.name,
          templateId: validated.templateId,
          csvSample: validated.csvSample || [],
          columnMappings: {
            create: validatedMappings,
          },
        },
        include: { columnMappings: true },
      });
      
      res.status(201).json(mapping);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error });
      }
      res.status(500).json({ error: 'Failed to create mapping' });
    }
  });

  // PUT /api/mappings/:id - Update mapping
  router.put('/:id', async (req, res) => {
    try {
      const validated = MappingSchema.parse(req.body);
      const columnMappings = req.body.columnMappings || [];
      
      // Validate column mappings
      const validatedMappings = columnMappings.map((cm: any) => ColumnMappingSchema.parse(cm));
      
      const mapping = await prisma.$transaction(async (tx) => {
        // Delete existing column mappings
        await tx.columnMapping.deleteMany({
          where: { mappingId: req.params.id },
        });
        
        // Update mapping with new column mappings
        return tx.mapping.update({
          where: { id: req.params.id },
          data: {
            name: validated.name,
            csvSample: validated.csvSample || [],
            columnMappings: {
              create: validatedMappings,
            },
          },
          include: { columnMappings: true },
        });
      });
      
      res.json(mapping);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error });
      }
      res.status(500).json({ error: 'Failed to update mapping' });
    }
  });

  // DELETE /api/mappings/:id - Delete mapping
  router.delete('/:id', async (req, res) => {
    try {
      await prisma.mapping.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete mapping' });
    }
  });

  return router;
}
