import 'dotenv/config';
import { PrismaClient, CampeonatoStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.campeonato.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    console.log(`Campeonato já existe: ${existing.nome} (${existing.id})`);
    return;
  }

  const campeonato = await prisma.campeonato.create({
    data: {
      nome: 'Precompeonato #1',
      status: CampeonatoStatus.INSCRICOES_ABERTAS,
    },
  });

  console.log(`Seed: campeonato criado — ${campeonato.nome} (${campeonato.id})`);
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
