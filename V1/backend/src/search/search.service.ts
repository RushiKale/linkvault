import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    userId: string,
    query: string,
    filters?: {
      collectionId?: string;
      tag?: string;
      favorites?: boolean;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: any = { userId };

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { url: { contains: query } },
        { description: { contains: query } },
        { notes: { contains: query } },
        {
          collection: {
            name: { contains: query },
          },
        },
        {
          tags: {
            some: { tag: { name: { contains: query } } },
          },
        },
      ];
    }

    if (filters?.collectionId) where.collectionId = filters.collectionId;
    if (filters?.tag) {
      where.tags = { some: { tag: { name: filters.tag } } };
    }
    if (filters?.favorites) {
      where.favorites = { some: { userId } };
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const links = await this.prisma.link.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        collection: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        favorites: { where: { userId }, take: 1 },
      },
    });

    return links.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description,
      faviconUrl: link.faviconUrl,
      imageUrl: link.imageUrl,
      notes: link.notes,
      openCount: link.openCount,
      lastOpenedAt: link.lastOpenedAt,
      createdAt: link.createdAt,
      collection: link.collection,
      tags: link.tags.map((lt) => lt.tag.name),
      isFavorite: link.favorites.length > 0,
    }));
  }
}
