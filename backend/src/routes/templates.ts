import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TemplateSchema, TemplateUpdateSchema, TemplateElementSchema } from '../schemas.js';

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
      
      // Validate elements and convert properties to string
      const validatedElements = elements.map((el: any) => {
        const validated = TemplateElementSchema.parse(el);
        return {
          ...validated,
          properties: JSON.stringify(validated.properties),
        };
      });
      
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

  // PATCH /api/templates/:id - Partial update template (properties only)
  router.patch('/:id', async (req, res) => {
    try {
      const validated = TemplateUpdateSchema.parse(req.body);
      
      // Simple update without touching elements
      const template = await prisma.template.update({
        where: { id: req.params.id },
        data: validated,
        include: { elements: true },
      });
      
      res.json(template);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error });
      }
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // PUT /api/templates/:id - Full update template (with elements)
  router.put('/:id', async (req, res) => {
    try {
      // Use partial schema for updates - only validate fields that are provided
      const validated = TemplateUpdateSchema.parse(req.body);
      const elements = req.body.elements || [];
      
      // Validate elements and convert properties to string
      const validatedElements = elements.map((el: any) => {
        const validated = TemplateElementSchema.parse(el);
        return {
          ...validated,
          properties: typeof validated.properties === 'string' 
            ? validated.properties 
            : JSON.stringify(validated.properties),
        };
      });
      
      // Use transaction to update template and elements
      const template = await prisma.$transaction(async (tx) => {
        // Get existing element IDs
        const existingElements = await tx.templateElement.findMany({
          where: { templateId: req.params.id },
          select: { id: true },
        });
        const existingIds = existingElements.map(e => e.id);
        const newIds = validatedElements.map((e: any) => e.id).filter(Boolean);
        
        // Delete elements that are no longer in the list
        const idsToDelete = existingIds.filter(id => !newIds.includes(id));
        if (idsToDelete.length > 0) {
          await tx.templateElement.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
        
        // Upsert elements (update if exists, create if new)
        for (const element of validatedElements) {
          if (existingIds.includes(element.id)) {
            // Update existing element
            await tx.templateElement.update({
              where: { id: element.id },
              data: {
                type: element.type,
                variableName: element.variableName,
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                rotation: element.rotation,
                properties: element.properties,
                zIndex: element.zIndex,
                groupId: element.groupId,
              },
            });
          } else {
            // Create new element
            await tx.templateElement.create({
              data: {
                ...element,
                templateId: req.params.id,
              },
            });
          }
        }
        
        // Update template fields
        return tx.template.update({
          where: { id: req.params.id },
          data: validated,
          include: { elements: true },
        });
      });
      
      res.json(template);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        console.error('Zod validation error:', JSON.stringify(error, null, 2));
        return res.status(400).json({ error: 'Validation failed', details: (error as any).issues });
      }
      console.error('Update template error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // PATCH /api/templates/:id/elements/:elementId - Update a single element
  router.patch('/:id/elements/:elementId', async (req, res) => {
    try {
      const { id, elementId } = req.params;
      const updates = req.body;
      
      // Convert properties to string if provided
      const data: any = { ...updates };
      if (updates.properties !== undefined) {
        data.properties = typeof updates.properties === 'string' 
          ? updates.properties 
          : JSON.stringify(updates.properties);
      }
      
      // Update the element
      await prisma.templateElement.update({
        where: { id: elementId },
        data,
      });
      
      // Return the full template
      const template = await prisma.template.findUnique({
        where: { id },
        include: { elements: true },
      });
      
      res.json(template);
    } catch (error) {
      console.error('Update element error:', error);
      res.status(500).json({ error: 'Failed to update element' });
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
            create: original.elements.map(({ id, templateId, ...el }) => ({
              ...el,
              properties: el.properties as any,
            })),
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
