import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TemplateSchema, TemplateElementSchema } from '../schemas.js';

const router = Router();

export function createTemplateRoutes(prisma: PrismaClient) {
  // GET /api/templates - List all templates
  router.get('/', async (req, res) => {
    try {
      const templates = await prisma.template.findMany({
        include: { elements: true },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // GET /api/templates/:id - Get single template
  router.get('/:id', async (req, res) => {
    try {
      const template = await prisma.template.findUnique({
        where: { id: req.params.id },
        include: { elements: true },
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  // POST /api/templates - Create template
  router.post('/', async (req, res) => {
    try {
      const validated = TemplateSchema.parse(req.body);
      const elements = req.body.elements || [];
      
      // Validate elements
      const validatedElements = elements.map((el: any) => TemplateElementSchema.parse(el));
      
      const template = await prisma.template.create({
        data: {
          ...validated,
          elements: {
            create: validatedElements,
          },
        },
        include: { elements: true },
      });
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error });
      }
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // PUT /api/templates/:id - Update template
  router.put('/:id', async (req, res) => {
    try {
      const validated = TemplateSchema.parse(req.body);
      const elements = req.body.elements || [];
      
      // Validate elements
      const validatedElements = elements.map((el: any) => TemplateElementSchema.parse(el));
      
      // Use transaction to update template and elements
      const template = await prisma.$transaction(async (tx) => {
        // Delete existing elements
        await tx.templateElement.deleteMany({
          where: { templateId: req.params.id },
        });
        
        // Update template with new elements
        return tx.template.update({
          where: { id: req.params.id },
          data: {
            ...validated,
            elements: {
              create: validatedElements,
            },
          },
          include: { elements: true },
        });
      });
      
      res.json(template);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error });
      }
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // DELETE /api/templates/:id - Delete template
  router.delete('/:id', async (req, res) => {
    try {
      await prisma.template.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // POST /api/templates/:id/duplicate - Duplicate template
  router.post('/:id/duplicate', async (req, res) => {
    try {
      const original = await prisma.template.findUnique({
        where: { id: req.params.id },
        include: { elements: true },
      });
      
      if (!original) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const { id, createdAt, updatedAt, ...templateData } = original;
      
      const duplicate = await prisma.template.create({
        data: {
          ...templateData,
          name: `${original.name} (copie)`,
          elements: {
            create: original.elements.map(({ id, templateId, ...el }) => el),
          },
        },
        include: { elements: true },
      });
      
      res.status(201).json(duplicate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to duplicate template' });
    }
  });

  return router;
}
