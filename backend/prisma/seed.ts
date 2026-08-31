import 'dotenv/config';

/**
 * Seed intencionalmente vazio.
 *
 * O catálogo de precons é populado pela ação de admin "Sincronizar precons
 * oficiais" (POST /api/precons/sync), que traz os dados completos do Moxfield
 * (comandantes elegíveis, partners, color identity e link do deck).
 *
 * O campeonato é criado pelo admin na aba "Campeonatos" do painel.
 *
 * Portanto não há nada para semear automaticamente. Este arquivo existe só
 * para manter o comando `prisma db seed` funcional sem inserir dados.
 */
async function main() {
  console.log(
    'Seed vazio: popule os precons pelo admin (Sincronizar precons oficiais) e crie o campeonato pela UI.',
  );
}

main();
