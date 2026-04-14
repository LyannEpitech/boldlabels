import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

export function createSessionDataRoutes(prisma: PrismaClient) {
  // GET /api/session-data/:templateId - Get session data for a template
  router.get('/:templateId', async (req, res) => {
    try {
      const sessionData = await prisma.sessionData.findUnique({
        where: { templateId: req.params.templateId },
      });
      
      if (!sessionData) {
        return res.json(null);
      }
      
      // Parse JSON fields
      res.json({
        ...sessionData,
        csvHeaders: sessionData.csvHeaders ? JSON.parse(sessionData.csvHeaders) : null,
        csvRows: sessionData.csvRows ? JSON.parse(sessionData.csvRows) : null,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch session data' });
    }
  });

  // PUT /api/session-data/:templateId - Create or update session data
  router.put('/:templateId', async (req, res) => {
    try {
      const {
        csvHeaders,
        csvRows,
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
        selectedMappingId,
      } = req.body;

      const sessionData = await prisma.sessionData.upsert({
        where: { templateId: req.params.templateId },
        create: {
          templateId: req.params.templateId,
          csvHeaders: csvHeaders ? JSON.stringify(csvHeaders) : null,
          csvRows: csvRows ? JSON.stringify(csvRows) : null,
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
          selectedMappingId: selectedMappingId || null,
        },
        update: {
          ...(csvHeaders !== undefined && { csvHeaders: JSON.stringify(csvHeaders) }),
          ...(csvRows !== undefined && { csvRows: JSON.stringify(csvRows) }),
          ...(pageSize !== undefined && { pageSize }),
          ...(orientation !== undefined && { orientation }),
          ...(marginTop !== undefined && { marginTop }),
          ...(marginRight !== undefined && { marginRight }),
          ...(marginBottom !== undefined && { marginBottom }),
          ...(marginLeft !== undefined && { marginLeft }),
          ...(labelsPerRow !== undefined && { labelsPerRow }),
          ...(labelsPerColumn !== undefined && { labelsPerColumn }),
          ...(horizontalSpacing !== undefined && { horizontalSpacing }),
          ...(verticalSpacing !== undefined && { verticalSpacing }),
          ...(selectedMappingId !== undefined && { selectedMappingId }),
        },
      });
      
      res.json({
        ...sessionData,
        csvHeaders: sessionData.csvHeaders ? JSON.parse(sessionData.csvHeaders) : null,
        csvRows: sessionData.csvRows ? JSON.parse(sessionData.csvRows) : null,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save session data' });
    }
  });

  // DELETE /api/session-data/:templateId - Delete session data
  router.delete('/:templateId', async (req, res) => {
    try {
      await prisma.sessionData.delete({
        where: { templateId: req.params.templateId },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete session data' });
    }
  });

  return router;
}
