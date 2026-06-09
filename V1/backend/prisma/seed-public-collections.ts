import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    const existing = await prisma.collection.findFirst({
      where: { userId: user.id, name: 'Private' },
    });
    if (!existing) {
      const maxOrder = await prisma.collection.findFirst({
        where: { userId: user.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      await prisma.collection.create({
        data: {
          userId: user.id,
          name: 'Private',
          color: '#6366f1',
          order: (maxOrder?.order ?? 0) + 1,
          locked: true,
        },
      });
      console.log(`  Created Private for ${user.id}`);
    }
  }

  for (const user of users) {
    const existing = await prisma.collection.findFirst({
      where: { userId: user.id, name: 'Public' },
    });
    if (!existing) {
      const maxOrder = await prisma.collection.findFirst({
        where: { userId: user.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      await prisma.collection.create({
        data: {
          userId: user.id,
          name: 'Public',
          color: '#10b981',
          order: (maxOrder?.order ?? 0) + 1,
          locked: true,
        },
      });
      console.log(`  Created Public for ${user.id}`);
    }
  }

  console.log('Done');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
