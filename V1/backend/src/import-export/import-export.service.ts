import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  async exportData(userId: string) {
    const links = await this.prisma.link.findMany({
      where: {
        userId,
        collection: { name: { not: 'Private' } },
      },
      include: {
        collection: { select: { name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      links: links.map((link) => ({
        url: link.url,
        title: link.title,
        description: link.description,
        notes: link.notes,
        collection: link.collection.name,
        tags: link.tags.map((lt) => lt.tag.name),
        createdAt: link.createdAt,
      })),
    };
  }

  async importData(userId: string, data: { links: any[] }) {
    if (!data.links || !Array.isArray(data.links)) {
      throw new BadRequestException('Invalid import format');
    }

    const results = { imported: 0, skipped: 0, errors: 0 };

    for (const item of data.links) {
      try {
        if (!item.url) {
          results.errors++;
          continue;
        }

        const existing = await this.prisma.link.findFirst({
          where: { userId, url: item.url },
        });
        if (existing) {
          results.skipped++;
          continue;
        }

        let collectionId: string;
        if (item.collection) {
          const collection = await this.prisma.collection.upsert({
            where: { userId_name: { userId, name: item.collection } },
            create: { userId, name: item.collection },
            update: {},
          });
          collectionId = collection.id;
        } else {
          const defaultCollection = await this.prisma.collection.findFirst({
            where: { userId, name: 'Learning' },
          });
          collectionId = defaultCollection!.id;
        }

        await this.prisma.link.create({
          data: {
            userId,
            collectionId,
            url: item.url,
            title: item.title || item.url,
            description: item.description,
            notes: item.notes,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            tags: item.tags?.length
              ? {
                  create: await Promise.all(
                    item.tags.map(async (name: string) => {
                      const tag = await this.prisma.tag.upsert({
                        where: { name: name.toLowerCase() },
                        create: { name: name.toLowerCase() },
                        update: {},
                      });
                      return { tagId: tag.id };
                    }),
                  ),
                }
              : undefined,
          },
        });

        results.imported++;
      } catch {
        results.errors++;
      }
    }

    return results;
  }
}
