import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLinkDto, UpdateLinkDto, QueryLinksDto } from './links.dto';

@Injectable()
export class LinksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateLinkDto) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: dto.collectionId },
    });
    if (!collection || (collection.userId !== userId && collection.name !== 'Public')) {
      throw new NotFoundException('Collection not found');
    }

    const existing = await this.prisma.link.findFirst({
      where: { userId, url: dto.url },
    });

    if (existing && !dto.forceSave) {
      throw new ConflictException({
        message: 'URL already exists',
        linkId: existing.id,
      });
    }

    const link = await this.prisma.link.create({
      data: {
        userId,
        collectionId: dto.collectionId,
        title: dto.title || dto.url,
        url: dto.url,
        description: dto.description,
        faviconUrl: dto.faviconUrl,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
        tags: dto.tags?.length
          ? {
              create: await Promise.all(
                dto.tags.map(async (name) => {
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
      include: {
        collection: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'create',
        entityType: 'link',
        entityId: link.id,
        metadata: { title: link.title, url: link.url },
      },
    });

    return this.formatLink(link);
  }

  async findAll(userId: string, query: QueryLinksDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const scope = query.scope || 'mine';

    const where: any = {};
    if (scope === 'mine') {
      where.userId = userId;
    } else if (scope === 'public') {
      where.collection = { name: 'Public' };
    } else if (scope === 'all') {
      where.OR = [
        { userId },
        { collection: { name: 'Public' } },
      ];
    }

    if (query.collectionId) where.collectionId = query.collectionId;
    if (query.search) {
      const searchWhere: any[] = [
        { title: { contains: query.search } },
        { url: { contains: query.search } },
        { description: { contains: query.search } },
        { notes: { contains: query.search } },
      ];
      if (where.OR) {
        const existingOr = where.OR;
        delete where.OR;
        where.AND = existingOr.map((clause: any) => ({ ...clause, OR: searchWhere }));
      } else {
        where.OR = searchWhere;
      }
    }
    if (query.tag) {
      where.tags = { some: { tag: { name: query.tag } } };
    }
    if (query.favorites) {
      where.favorites = { some: { userId } };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (query.sort === 'alphabetical') orderBy = { title: 'asc' };
    if (query.sort === 'most_opened') orderBy = { openCount: 'desc' };
    if (query.sort === 'recently_opened') orderBy = { lastOpenedAt: 'desc' };

    const [links, total] = await Promise.all([
      this.prisma.link.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          collection: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: true } },
          favorites: { where: { userId }, take: 1 },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.link.count({ where }),
    ]);

    return {
      links: links.map((l) => this.formatLink(l)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const link = await this.prisma.link.findFirst({
      where: { id },
      include: {
        collection: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        favorites: { where: { userId }, take: 1 },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!link) throw new NotFoundException('Link not found');
    if (link.collection.name !== 'Public' && link.userId !== userId) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.link.update({
      where: { id },
      data: { openCount: { increment: 1 }, lastOpenedAt: new Date() },
    });

    return this.formatLink(link);
  }

  async update(userId: string, id: string, dto: UpdateLinkDto) {
    const link = await this.prisma.link.findFirst({
      where: { id },
      include: { collection: { select: { name: true } } },
    });
    if (!link) throw new NotFoundException('Link not found');
    if (link.collection.name !== 'Public' && link.userId !== userId) {
      throw new NotFoundException('Link not found');
    }

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        title: dto.title,
        url: dto.url,
        description: dto.description,
        notes: dto.notes,
        collectionId: dto.collectionId,
        faviconUrl: dto.faviconUrl,
        imageUrl: dto.imageUrl,
        tags: dto.tags
          ? {
              deleteMany: {},
              create: await Promise.all(
                dto.tags.map(async (name) => {
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
      include: {
        collection: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        favorites: { where: { userId }, take: 1 },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return this.formatLink(updated);
  }

  async delete(userId: string, id: string) {
    const link = await this.prisma.link.findFirst({
      where: { id },
      include: { collection: { select: { name: true } } },
    });
    if (!link) throw new NotFoundException('Link not found');
    if (link.collection.name !== 'Public' && link.userId !== userId) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.link.delete({ where: { id } });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'delete',
        entityType: 'link',
        entityId: id,
      },
    });

    return { deleted: true };
  }

  async bulkDelete(userId: string, ids: string[]) {
    await this.prisma.link.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return { deleted: ids.length };
  }

  async bulkMove(userId: string, ids: string[], collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');

    await this.prisma.link.updateMany({
      where: { id: { in: ids }, userId },
      data: { collectionId },
    });
    return { moved: ids.length };
  }

  private formatLink(link: any) {
    let addedBy: string | null = null;
    if (link.user) {
      const u = link.user;
      if (u.firstName && u.lastName) {
        addedBy = `${u.firstName} ${u.lastName}`;
      } else if (u.firstName) {
        addedBy = u.firstName;
      } else {
        addedBy = u.email?.split('@')[0] || null;
      }
    }

    return {
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
      updatedAt: link.updatedAt,
      collection: link.collection,
      tags: link.tags?.map((lt: any) => lt.tag.name) || [],
      isFavorite: link.favorites?.length > 0,
      addedBy: link.user ? addedBy : null,
    };
  }
}
