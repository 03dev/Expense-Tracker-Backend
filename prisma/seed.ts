import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const systemCategories = [
  { name: 'Food & Dining', icon: '🍔' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health & Medical', icon: '🏥' },
  { name: 'Housing & Rent', icon: '🏠' },
  { name: 'Utilities', icon: '💡' },
  { name: 'Education', icon: '📚' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Salary', icon: '💰' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Investment', icon: '📈' },
  { name: 'Subscriptions', icon: '🔄' },
  { name: 'Uncategorized', icon: '📦' },
];

async function main() {
  console.log('Seeding system categories...');

  for (const category of systemCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: { name: category.name, icon: category.icon, userId: null },
      });
    }
  }

  console.log('Done! System categories seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
