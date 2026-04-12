import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateLabelPDF } from '../services/pdf.service.js';

const router = Router();

export function createGenerateRoutes(prisma: PrismaClient) {
  // POST /api/generate/preview - Preview label data
  router.post('/preview', async (req, res) => {
    try {
      const { templateId, mappingId, csvRow } = req.body;
      
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        include: { elements: true },
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const mapping = await prisma.mapping.findUnique({
        where: { id: mappingId },
        include: { columnMappings: true },
      });
      
      if (!mapping) {
        return res.status(404).json({ error: 'Mapping not found' });
      }
      
      // Map CSV row to label data
      const labelData: Record<string, string> = {};
      mapping.columnMappings.forEach((cm) => {
        labelData[cm.variableName] = csvRow[cm.columnIndex] || '';
      });
      
      res.json({
        template,
        labelData,
        preview: true,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });

  // POST /api/generate/pdf - Generate PDF
  router.post('/pdf', async (req, res) => {
    try {
      const { templateId, mappingId, csvData, pdfOptions, labelLayout } = req.body;
      
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        include: { elements: true },
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const mapping = await prisma.mapping.findUnique({
        where: { id: mappingId },
        include: { columnMappings: true },
      });
      
      if (!mapping) {
        return res.status(404).json({ error: 'Mapping not found' });
      });
      
      // Convert column mappings to record
      const mappingRecord: Record<string, number> = {};
      mapping.columnMappings.forEach((cm) => {
        mappingRecord[cm.variableName] = cm.columnIndex;
      });
      
      // Generate PDF
      const pdfBuffer = await generateLabelPDF({
        template,
        csvData,
        csvHeaders: mapping.columnMappings.map((cm) => cm.columnName),
        mapping: mappingRecord,
        pdfOptions,
        labelLayout,
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name}_labels.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  return router;
}
