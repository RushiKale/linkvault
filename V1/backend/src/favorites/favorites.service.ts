import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, linkId: string) {
    const link = await this.prisma.link.findFirst({
      where: { id: linkId, userId },
    });
    if (!link) throw new NotFoundException('Link not found');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_linkId: { userId, linkId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: { userId, linkId },
    });
    return { favorited: true };
  }

  async findAll(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        link: {
          include: {
            collection: { select: { id: true, name: true, color: true } },
            tags: { include: { tag: true } },
          },
        },
      },
    });

    return favorites.map((f) => ({
      id: f.link.id,
      title: f.link.title,
      url: f.link.url,
      description: f.link.description,
      faviconUrl: f.link.faviconUrl,
      imageUrl: f.link.imageUrl,
      notes: f.link.notes,
      openCount: f.link.openCount,
      lastOpenedAt: f.link.lastOpenedAt,
      createdAt: f.link.createdAt,
      collection: f.link.collection,
      tags: f.link.tags.map((lt) => lt.tag.name),
      isFavorite: true,
      favoritedAt: f.createdAt,
    }));
  }

  async remove(userId: string, linkId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_linkId: { userId, linkId } },
    });
    if (!existing) throw new NotFoundException('Favorite not found');

    await this.prisma.favorite.delete({ where: { id: existing.id } });
    return { deleted: true };
  }
}
