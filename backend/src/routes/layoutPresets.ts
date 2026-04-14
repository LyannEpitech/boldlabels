import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

export function createLayoutPresetRoutes(prisma: PrismaClient) {
  // GET /api/layout-presets - List all presets for a template
  router.get('/', async (req, res) => {
    try {
      const { templateId } = req.query;
      
      const presets = await prisma.layoutPreset.findMany({
        where: templateId ? { templateId: templateId as string } : undefined,
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });
      
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch layout presets' });
    }
  });

  // GET /api/layout-presets/:id - Get single preset
  router.get('/:id', async (req, res) => {
    try {
      const preset = await prisma.layoutPreset.findUnique({
        where: { id: req.params.id },
      });
      
      if (!preset) {
        return res.status(404).json({ error: 'Layout preset not found' });
      }
      
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch layout preset' });
    }
  });

  // POST /api/layout-presets - Create preset
  router.post('/', async (req, res) => {
    try {
      const {
        name,
        templateId,
        pageSize,
        orientation,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        labelsPerRow,
        labelsPerColumn,
        horizontalSpacing,
        verticalSpacing,
        isDefault,
      } = req.body;

      // If setting as default, unset other defaults for this template
      if (isDefault) {
        await prisma.layoutPreset.updateMany({
          where: { templateId },
          data: { isDefault: false },
        });
      }

      const preset = await prisma.layoutPreset.create({
        data: {
          name,
          templateId,
          pageSize: pageSize || 'A4',
          orientation: orientation || 'portrait',
          marginTop: marginTop ?? 10,
          marginRight: marginRight ?? 10,
          marginBottom: marginBottom ?? 10,
          marginLeft: marginLeft ?? 10,
          labelsPerRow: labelsPerRow ?? 3,
          labelsPerColumn: labelsPerColumn ?? 8,
          horizontalSpacing: horizontalSpacing ?? 2,
          verticalSpacing: verticalSpacing ?? 0,
          isDefault: isDefault || false,
        },
      });
      
      res.status(201).json(preset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create layout preset' });
    }
  });

  // PUT /api/layout-presets/:id - Update preset
  router.put('/:id', async (req, res) => {
    try {
      const {
        name,
        pageSize,
        orientation,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        labelsPerRow,
        labelsPerColumn,
        horizontalSpacing,
        verticalSpacing,
        isDefault,
      } = req.body;

      const existing = await prisma.layoutPreset.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Layout preset not found' });
      }

      // If setting as default, unset other defaults for this template
      if (isDefault) {
        await prisma.layoutPreset.updateMany({
          where: { templateId: existing.templateId },
          data: { isDefault: false },
        });
      }

      const preset = await prisma.layoutPreset.update({
        where: { id: req.params.id },
        data: {
          name,
          pageSize,
          orientation,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          labelsPerRow,
          labelsPerColumn,
          horizontalSpacing,
          verticalSpacing,
          isDefault,
        },
      });
      
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update layout preset' });
    }
  });

  // DELETE /api/layout-presets/:id - Delete preset
  router.delete('/:id', async (req, res) => {
    try {
      await prisma.layoutPreset.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete layout preset' });
    }
  });

  return router;
}
