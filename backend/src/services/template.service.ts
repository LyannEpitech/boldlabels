import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TemplateService {
  async findAll() {
    return prisma.template.findMany({
      include: { elements: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.template.findUnique({
      where: { id },
      include: { elements: true },
    });
  }

  async create(data: any) {
    return prisma.template.create({
      data: {
        ...data,
        elements: {
          create: data.elements || [],
        },
      },
      include: { elements: true },
    });
  }

  async update(id: string, data: any) {
    return prisma.$transaction(async (tx) => {
      await tx.templateElement.deleteMany({
        where: { templateId: id },
      });

      return tx.template.update({
        where: { id },
        data: {
          ...data,
          elements: {
            create: data.elements || [],
          },
        },
        include: { elements: true },
      });
    });
  }

  async delete(id: string) {
    return prisma.template.delete({
      where: { id },
    });
  }

  async duplicate(id: string) {
    const original = await this.findById(id);
    if (!original) return null;

    const { id: _, createdAt, updatedAt, ...data } = original;

    return prisma.template.create({
      data: {
        ...data,
        name: `${original.name} (copie)`,
        elements: {
          create: original.elements.map(({ id, templateId, ...el }) => ({
            ...el,
            properties: typeof el.properties === 'string' ? el.properties : JSON.stringify(el.properties),
          })),
        },
      },
      include: { elements: true },
    });
  }
}

export const templateService = new TemplateService();
