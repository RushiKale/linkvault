import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCollectionDto) {
    const existing = await this.prisma.collection.findFirst({
      where: { userId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Collection with this name already exists');
    }

    const maxOrder = await this.prisma.collection.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.collection.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color || '#6366f1',
        order: (maxOrder?.order ?? -1) + 1,
        locked: false,
      },
    });
  }

  async findAll(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { links: true } },
      },
    });

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      order: c.order,
      locked: c.locked,
      count: c._count.links,
      createdAt: c.createdAt,
    }));
  }

  async update(userId: string, id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.locked) throw new ConflictException('Cannot modify a locked collection');

    if (dto.name) {
      const existing = await this.prisma.collection.findFirst({
        where: { userId, name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Collection with this name already exists');
      }
    }

    return this.prisma.collection.update({
      where: { id },
      data: {
        name: dto.name,
        color: dto.color,
        order: dto.order,
      },
    });
  }

  async delete(userId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.locked) throw new ConflictException('Cannot delete a locked collection');

    const defaultCollection = await this.prisma.collection.findFirst({
      where: { userId, name: 'Learning' },
    });

    await this.prisma.link.updateMany({
      where: { collectionId: id },
      data: { collectionId: defaultCollection!.id },
    });

    await this.prisma.collection.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(userId: string, ids: string[]) {
    const locked = await this.prisma.collection.findMany({
      where: { userId, locked: true },
      select: { id: true },
    });
    const lockedIds = new Set(locked.map((c) => c.id));
    const filtered = ids.filter((id) => !lockedIds.has(id));

    for (let i = 0; i < filtered.length; i++) {
      await this.prisma.collection.updateMany({
        where: { id: filtered[i], userId },
        data: { order: i },
      });
    }
    return { reordered: true };
  }
}
