import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MappingService {
  async findAll() {
    return prisma.mapping.findMany({
      include: { columnMappings: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.mapping.findUnique({
      where: { id },
      include: { columnMappings: true },
    });
  }

  async findByTemplate(templateId: string) {
    return prisma.mapping.findMany({
      where: { templateId },
      include: { columnMappings: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: any) {
    return prisma.mapping.create({
      data: {
        name: data.name,
        templateId: data.templateId,
        csvSample: data.csvSample || [],
        columnMappings: {
          create: data.columnMappings || [],
        },
      },
      include: { columnMappings: true },
    });
  }

  async update(id: string, data: any) {
    return prisma.$transaction(async (tx) => {
      await tx.columnMapping.deleteMany({
        where: { mappingId: id },
      });

      return tx.mapping.update({
        where: { id },
        data: {
          name: data.name,
          csvSample: data.csvSample || [],
          columnMappings: {
            create: data.columnMappings || [],
          },
        },
        include: { columnMappings: true },
      });
    });
  }

  async delete(id: string) {
    return prisma.mapping.delete({
      where: { id },
    });
  }
}

export const mappingService = new MappingService();
