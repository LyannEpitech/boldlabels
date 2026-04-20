import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateBody, validateParams } from '../middleware/validation.js';
import {
  TemplateSchema,
  TemplateUpdateSchema,
  TemplateElementSchema,
  ElementPatchSchema,
  TemplateParamsSchema,
  ElementParamsSchema,
} from '../schemas/index.js';

export function createTemplateRoutes(prisma: PrismaClient) {
  const router = Router();

  // GET /api/templates - List all templates
  router.get('/', async (req, res, next) => {
    try {
      const templates = await prisma.template.findMany({
        include: { elements: true },
        orderBy: { updatedAt: 'desc' },
      });

      // Parse properties for all templates
      const parsedTemplates = templates.map((template) => ({
        ...template,
        elements: template.elements.map((el) => ({
          ...el,
          properties: typeof el.properties === 'string'
            ? JSON.parse(el.properties)
            : el.properties,
        })),
      }));

      res.json(parsedTemplates);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/templates/:id - Get single template
  router.get('/:id', validateParams(TemplateParamsSchema), async (req, res, next) => {
    try {
      const template = await prisma.template.findUnique({
        where: { id: req.params.id },
        include: { elements: true },
      });

      if (!template) {
        return res.status(404).json({
          error: 'Not found',
          message: `Template with ID ${req.params.id} not found`,
        });
      }

      // Parse properties
      const parsedTemplate = {
        ...template,
        elements: template.elements.map((el) => ({
          ...el,
          properties: typeof el.properties === 'string'
            ? JSON.parse(el.properties)
            : el.properties,
        })),
      };

      res.json(parsedTemplate);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/templates - Create template
  router.post('/', validateBody(TemplateSchema), async (req, res, next) => {
    try {
      const validated = req.body;

      const template = await prisma.template.create({
        data: {
          ...validated,
          elements: {
            create: [],
          },
        },
        include: { elements: true },
      });

      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/templates/:id - Full update with elements
  router.put(
    '/:id',
    validateParams(TemplateParamsSchema),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const { elements, ...templateData } = req.body;

        // Validate template data if provided
        if (Object.keys(templateData).length > 0) {
          const templateResult = TemplateUpdateSchema.safeParse(templateData);
          if (!templateResult.success) {
            return res.status(400).json({
              error: 'Validation failed',
              message: 'Invalid template data',
              details: templateResult.error.issues,
            });
          }
        }

        // Validate elements if provided
        let validatedElements: any[] = [];
        if (elements && Array.isArray(elements)) {
          for (let i = 0; i < elements.length; i++) {
            const elementResult = TemplateElementSchema.safeParse(elements[i]);
            if (!elementResult.success) {
              return res.status(400).json({
                error: 'Validation failed',
                message: `Invalid element at index ${i}`,
                details: elementResult.error.issues,
                element: elements[i],
              });
            }
            validatedElements.push(elementResult.data);
          }
        }

        // Check if template exists
        const existingTemplate = await prisma.template.findUnique({
          where: { id },
          include: { elements: true },
        });

        if (!existingTemplate) {
          return res.status(404).json({
            error: 'Not found',
            message: `Template with ID ${id} not found`,
          });
        }

        // Update template and elements in transaction
        const template = await prisma.$transaction(async (tx) => {
          // Get existing element IDs
          const existingIds = existingTemplate.elements.map((e) => e.id);
          const newIds = validatedElements
            .map((e: any) => e.id)
            .filter(Boolean) as string[];

          // Delete elements that are no longer in the list
          const idsToDelete = existingIds.filter((id) => !newIds.includes(id));
          if (idsToDelete.length > 0) {
            await tx.templateElement.deleteMany({
              where: { id: { in: idsToDelete } },
            });
          }

          // Upsert elements
          for (const element of validatedElements) {
            const propertiesStr =
              typeof element.properties === 'string'
                ? element.properties
                : JSON.stringify(element.properties);

            if (element.id && existingIds.includes(element.id)) {
              // Update existing
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
                  properties: propertiesStr,
                  zIndex: element.zIndex,
                  groupId: element.groupId,
                },
              });
            } else {
              // Create new
              await tx.templateElement.create({
                data: {
                  type: element.type,
                  variableName: element.variableName,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  rotation: element.rotation,
                  properties: propertiesStr,
                  zIndex: element.zIndex,
                  groupId: element.groupId,
                  templateId: id,
                },
              });
            }
          }

          // Update template fields
          return tx.template.update({
            where: { id },
            data: templateData,
            include: { elements: true },
          });
        });

        // Parse properties in response
        const parsedTemplate = {
          ...template,
          elements: template.elements.map((el: any) => ({
            ...el,
            properties:
              typeof el.properties === 'string'
                ? JSON.parse(el.properties)
                : el.properties,
          })),
        };

        res.json(parsedTemplate);
      } catch (error) {
        next(error);
      }
    }
  );

  // PATCH /api/templates/:id - Partial update
  router.patch(
    '/:id',
    validateParams(TemplateParamsSchema),
    validateBody(TemplateUpdateSchema),
    async (req, res, next) => {
      try {
        const template = await prisma.template.update({
          where: { id: req.params.id },
          data: req.body,
          include: { elements: true },
        });

        const parsedTemplate = {
          ...template,
          elements: template.elements.map((el) => ({
            ...el,
            properties:
              typeof el.properties === 'string'
                ? JSON.parse(el.properties)
                : el.properties,
          })),
        };

        res.json(parsedTemplate);
      } catch (error) {
        next(error);
      }
    }
  );

  // PATCH /api/templates/:id/elements/:elementId - Update single element
  router.patch(
    '/:id/elements/:elementId',
    validateParams(ElementParamsSchema),
    validateBody(ElementPatchSchema),
    async (req, res, next) => {
      try {
        const { id, elementId } = req.params;
        const updates = req.body;

        // Check if element exists and belongs to template
        const element = await prisma.templateElement.findFirst({
          where: { id: elementId, templateId: id },
        });

        if (!element) {
          return res.status(404).json({
            error: 'Not found',
            message: `Element with ID ${elementId} not found in template ${id}`,
          });
        }

        // Convert properties to string if provided
        const data: any = { ...updates };
        if (updates.properties !== undefined) {
          data.properties =
            typeof updates.properties === 'string'
              ? updates.properties
              : JSON.stringify(updates.properties);
        }

        // Update element
        await prisma.templateElement.update({
          where: { id: elementId },
          data,
        });

        // Return full template
        const template = await prisma.template.findUnique({
          where: { id },
          include: { elements: true },
        });

        const parsedTemplate = {
          ...template,
          elements: template!.elements.map((el) => ({
            ...el,
            properties:
              typeof el.properties === 'string'
                ? JSON.parse(el.properties)
                : el.properties,
          })),
        };

        res.json(parsedTemplate);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/templates/:id - Delete template
  router.delete('/:id', validateParams(TemplateParamsSchema), async (req, res, next) => {
    try {
      await prisma.template.delete({
        where: { id: req.params.id },
      });

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/templates/:id/duplicate - Duplicate template
  router.post(
    '/:id/duplicate',
    validateParams(TemplateParamsSchema),
    async (req, res, next) => {
      try {
        const original = await prisma.template.findUnique({
          where: { id: req.params.id },
          include: { elements: true },
        });

        if (!original) {
          return res.status(404).json({
            error: 'Not found',
            message: `Template with ID ${req.params.id} not found`,
          });
        }

        const { id, createdAt, updatedAt, ...templateData } = original;

        const duplicate = await prisma.template.create({
          data: {
            ...templateData,
            name: `${original.name} (copie)`,
            elements: {
              create: original.elements.map((el) => ({
                type: el.type,
                variableName: el.variableName,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                rotation: el.rotation,
                properties: el.properties,
                zIndex: el.zIndex,
                groupId: el.groupId,
              })),
            },
          },
          include: { elements: true },
        });

        const parsedDuplicate = {
          ...duplicate,
          elements: duplicate.elements.map((el) => ({
            ...el,
            properties:
              typeof el.properties === 'string'
                ? JSON.parse(el.properties)
                : el.properties,
          })),
        };

        res.status(201).json(parsedDuplicate);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
