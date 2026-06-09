import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, q?: string) {
    const where: any = {
      links: {
        some: {
          link: {
            OR: [
              { userId },
              { collection: { name: 'Public' } },
            ],
          },
        },
      },
    };

    if (q) {
      where.name = { contains: q };
    }

    const tags = await this.prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
    });

    return tags.map((t) => t.name);
  }
}
