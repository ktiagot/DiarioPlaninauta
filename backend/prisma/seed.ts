import 'dotenv/config';
import { PrismaClient, CampeonatoStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PRECONS_SEED = [
  {
    id: 'p0000001-0000-4000-8000-000000000001',
    nome: 'Counter Intelligence',
    setNome: 'Tarkir: Dragonstorm',
    cores: 'WU',
    ano: 2025,
    comandantes: [
      { id: 'c0000001-0000-4000-8000-000000000001', comandante: 'Phelia, Exuberant Shepherd', ordem: 1 },
      { id: 'c0000001-0000-4000-8000-000000000002', comandante: 'Aminatou, the Fateshifter', ordem: 2 },
    ],
  },
  {
    id: 'p0000001-0000-4000-8000-000000000002',
    nome: 'Living Energy',
    setNome: 'Tarkir: Dragonstorm',
    cores: 'GU',
    ano: 2025,
    comandantes: [
      { id: 'c0000001-0000-4000-8000-000000000003', comandante: 'Zimone, Paradox Mage', ordem: 1 },
      { id: 'c0000001-0000-4000-8000-000000000004', comandante: 'Jyoti, Moag Ancient', ordem: 2 },
    ],
  },
  {
    id: 'p0000001-0000-4000-8000-000000000003',
    nome: 'Eternal Might',
    setNome: 'Tarkir: Dragonstorm',
    cores: 'RG',
    ano: 2025,
    comandantes: [
      { id: 'c0000001-0000-4000-8000-000000000005', comandante: 'Teval, the Balanced Scale', ordem: 1 },
      { id: 'c0000001-0000-4000-8000-000000000006', comandante: 'Kotis, the Fangkeeper', ordem: 2 },
    ],
  },
  {
    id: 'p0000001-0000-4000-8000-000000000004',
    nome: 'World Shaper',
    setNome: 'Tarkir: Dragonstorm',
    cores: 'BG',
    ano: 2025,
    comandantes: [
      { id: 'c0000001-0000-4000-8000-000000000007', comandante: 'Henzie "Toolbox" Torre', ordem: 1 },
      { id: 'c0000001-0000-4000-8000-000000000008', comandante: 'Gonti, Night Minister', ordem: 2 },
    ],
  },
  {
    id: 'p0000001-0000-4000-8000-000000000005',
    nome: 'Grave Danger',
    setNome: 'Tarkir: Dragonstorm',
    cores: 'UB',
    ano: 2025,
    comandantes: [
      { id: 'c0000001-0000-4000-8000-000000000009', comandante: 'Sidisi, Brood Tyrant', ordem: 1 },
      { id: 'c0000001-0000-4000-8000-00000000000a', comandante: 'The Scarab God', ordem: 2 },
    ],
  },
] as const;

async function seedPrecons() {
  const count = await prisma.precon.count();
  if (count > 0) {
    console.log(`Precons já existem (${count} registros).`);
    return;
  }

  for (const precon of PRECONS_SEED) {
    await prisma.precon.create({
      data: {
        id: precon.id,
        nome: precon.nome,
        setNome: precon.setNome,
        cores: precon.cores,
        ano: precon.ano,
        comandantes: {
          create: precon.comandantes.map((c) => ({
            id: c.id,
            comandante: c.comandante,
            ordem: c.ordem,
          })),
        },
      },
    });
  }

  console.log(`Seed: ${PRECONS_SEED.length} precons criados.`);
}

async function seedCampeonato() {
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
      edicao: '#1',
      dataInicio: new Date('2026-01-01T00:00:00.000Z'),
      status: CampeonatoStatus.INSCRICOES_ABERTAS,
    },
  });

  console.log(`Seed: campeonato criado — ${campeonato.nome} (${campeonato.id})`);
}

async function main() {
  await seedPrecons();
  await seedCampeonato();
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
