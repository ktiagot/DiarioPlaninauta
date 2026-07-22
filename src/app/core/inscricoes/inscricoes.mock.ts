import { JogadorInscrito } from './inscricoes.models';

type MockEntry = {
  id: number;
  nome: string;
  nickname?: string;
  comandante: string;
  deckNome: string;
  deckUrl?: string;
  rodada?: number;
  mesa?: number;
};

const MOCK_ENTRIES: MockEntry[] = [
  { id: 1, nome: 'Alan', comandante: 'Willowdusk', deckNome: 'Witherbloom Witchcraft', rodada: 1, mesa: 3 },
  { id: 2, nome: 'Augusto', nickname: 'Barros', comandante: 'Nalia', deckNome: 'Party Time', rodada: 1, mesa: 5 },
  { id: 3, nome: 'Augusto', nickname: 'Ks Noctis', comandante: 'Felothar', deckNome: 'Abzan Armor', rodada: 1, mesa: 8 },
  { id: 4, nome: 'Bells', nickname: 'Bellsvill#2025', comandante: 'Valgavoth', deckNome: 'Endless Punishment', rodada: 1, mesa: 4 },
  { id: 5, nome: 'BrunoEduardo86', comandante: 'Leonardo / April', deckNome: 'Turtle Power' },
  { id: 6, nome: 'Caio', nickname: 'Tesshou', comandante: 'Leonardo / April', deckNome: 'Turtle Power', rodada: 1, mesa: 6 },
  { id: 7, nome: 'Carlindo', nickname: 'Carbeauty', comandante: 'Hearthhull', deckNome: 'World Shaper', rodada: 1, mesa: 7 },
  { id: 8, nome: 'CarlosMvk1', comandante: 'Ellivere', deckNome: 'Virtue and Valor', rodada: 1, mesa: 9 },
  { id: 9, nome: 'Claudiojr', comandante: 'Burakos / Folk Hero', deckNome: 'Party time', rodada: 1, mesa: 11 },
  { id: 10, nome: 'Douglas', nickname: 'doogdouglas', comandante: 'Teval', deckNome: 'Sultai Arisen', rodada: 1, mesa: 6 },
  { id: 11, nome: 'Elder', nickname: 'APOPHIS', comandante: 'Teval', deckNome: 'Sultai Arisen', rodada: 1, mesa: 2 },
  { id: 12, nome: 'Enzo', nickname: 'tsfortrees', comandante: 'Omo', deckNome: 'Tricky Terrain' },
  { id: 13, nome: 'FabioJDF', comandante: 'Shiko & Narset', deckNome: 'Jeskai Striker', rodada: 1, mesa: 9 },
  { id: 14, nome: 'Felipe', nickname: 'FeGruul', comandante: 'Half Shell', deckNome: 'Turtle Power', rodada: 1, mesa: 3 },
  { id: 15, nome: 'Fernandinho Rei Delas', comandante: 'Chatterfang', deckNome: 'Squirreled Away', rodada: 1, mesa: 4 },
  { id: 16, nome: 'Gabriel', nickname: 'GJORD', comandante: 'Zurgo', deckNome: 'Mardu Surge', rodada: 1, mesa: 3 },
  { id: 17, nome: 'Gabriel', nickname: 'Kimuralha', comandante: 'Omo', deckNome: 'Tricky Terrain', rodada: 1, mesa: 8 },
  { id: 18, nome: 'Guilherme', nickname: 'Floxi', comandante: 'Bello', deckNome: 'Animated Army', rodada: 1, mesa: 10 },
  { id: 19, nome: 'Guinjo', comandante: 'Vrondiss', deckNome: 'Draconic Rage', rodada: 1, mesa: 2 },
  { id: 20, nome: 'Jean', nickname: 'jeanfb', comandante: 'Tidus', deckNome: 'Counter Blitz', rodada: 1, mesa: 2 },
  { id: 21, nome: 'João', nickname: 'joaohenriquefilizzola', comandante: 'Hearthhull', deckNome: 'World Shaper', rodada: 1, mesa: 11 },
  { id: 22, nome: 'Joaquim Franco', comandante: 'Hearthhull', deckNome: 'World Shaper', rodada: 1, mesa: 6 },
  { id: 23, nome: 'Jonas', nickname: 'Kuwabara55', comandante: 'Terra', deckNome: 'Revival Trance', rodada: 1, mesa: 7 },
  { id: 24, nome: 'Jonatha', nickname: 'Professor Rakdos', comandante: 'Tidus', deckNome: 'Counter Blitz', rodada: 1, mesa: 10 },
  { id: 25, nome: 'Juliano', nickname: 'Kinabo', comandante: 'Frodo / Sam', deckNome: 'Food and Fellowship', rodada: 1, mesa: 7 },
  { id: 26, nome: 'Leonardo', nickname: 'calixteira', comandante: 'Caesar', deckNome: 'Hail, Caesar' },
  { id: 27, nome: 'Lucas', nickname: 'lukasazura', comandante: 'Tidus', deckNome: 'Counter Blitz', rodada: 1, mesa: 12 },
  { id: 28, nome: 'Luiz', nickname: 'lhermanos', comandante: 'Leonardo / April', deckNome: 'Turtle Power', rodada: 1, mesa: 10 },
  { id: 29, nome: 'Luiz', nickname: 'Luizyyt', comandante: 'Stella Lee', deckNome: 'Quick Draw', rodada: 1, mesa: 2 },
  { id: 30, nome: 'Marcos', nickname: 'Minorucomp', comandante: 'Satya', deckNome: 'Creative Energy', rodada: 1, mesa: 4 },
  { id: 31, nome: 'Mateus', nickname: 'Dymas', comandante: 'Leonardo / April', deckNome: 'Turtle Power', rodada: 1, mesa: 4 },
  { id: 32, nome: 'Mateus', nickname: 'Mats', comandante: 'Leonardo / April', deckNome: 'Turtle Power', rodada: 1, mesa: 7 },
  { id: 33, nome: 'Matheus', nickname: 'Bife', comandante: 'Valgavoth', deckNome: 'Endless Punishment' },
  { id: 34, nome: 'Moizés Tavares', comandante: 'Tidus', deckNome: 'Counter Blitz', rodada: 1, mesa: 5 },
  { id: 35, nome: 'Murillo', nickname: 'Sherykan', comandante: 'Leonardo / April', deckNome: 'Turtle Power', rodada: 1, mesa: 9 },
  { id: 36, nome: 'Priscila', nickname: 'PrihSlayer', comandante: 'Mirko', deckNome: 'Revenant Recon', rodada: 1, mesa: 1 },
  { id: 37, nome: 'Rafael', nickname: 'Gungans', comandante: 'Mothman', deckNome: 'Mutant Menace', rodada: 1, mesa: 11 },
  { id: 38, nome: 'Raul', nickname: 'Kostor', comandante: 'Kitt Kanto', deckNome: 'Cabaretti Cacophony', rodada: 1, mesa: 1 },
  { id: 39, nome: 'Raul', nickname: 'raullima1', comandante: 'Zinnia', deckNome: 'Family Matters', rodada: 1, mesa: 5 },
  { id: 40, nome: 'Renato', nickname: 'Yggdriel', comandante: 'Hakbal', deckNome: 'Explorers of the Deep', rodada: 1, mesa: 10 },
  { id: 41, nome: 'Reva', comandante: 'Anhelo', deckNome: 'Maestros Massacre', rodada: 1, mesa: 5 },
  { id: 42, nome: 'Rodrigo', nickname: 'Rodrigo0800', comandante: 'Hakbal', deckNome: 'Explorers of the Deep', rodada: 1, mesa: 12 },
  { id: 43, nome: 'Sebastião', nickname: 'frost075172718', comandante: 'Leonardo / April', deckNome: 'Turtle Power', rodada: 1, mesa: 11 },
  { id: 44, nome: 'Thiago', nickname: 'Borini', comandante: 'Bello', deckNome: 'Animated Army', rodada: 1, mesa: 8 },
  { id: 45, nome: 'Thiago', nickname: 'Crothen', comandante: 'Sliver Hivelord', deckNome: 'Sliver Swarm', rodada: 1, mesa: 1 },
  { id: 46, nome: 'Thiago Medeiros', comandante: 'Admiral Brass', deckNome: 'Ahoy Mateys', rodada: 1, mesa: 12 },
  { id: 47, nome: 'Victor', nickname: 'Victorajax', comandante: 'Frodo / Sam', deckNome: 'Food and Fellowship', rodada: 1, mesa: 8 },
  { id: 48, nome: 'Vini', nickname: 'Martins', comandante: 'Zurgo', deckNome: 'Mardu Surge', rodada: 1, mesa: 6 },
  { id: 49, nome: 'Vinicius', nickname: 'MrPHead', comandante: 'Galadriel', deckNome: 'Elven Council', rodada: 1, mesa: 1 },
  { id: 50, nome: 'Vinicius', nickname: 'VNBuzzetti27', comandante: 'Auntie Ool', deckNome: 'Blight Curse', rodada: 1, mesa: 3 },
  { id: 51, nome: 'Wandson', nickname: 'Wan', comandante: 'Terra', deckNome: 'Revival Trance', rodada: 1, mesa: 9 },
  { id: 52, nome: 'Yuri', nickname: 'yuri_09987', comandante: 'Eshki', deckNome: 'Eshki', rodada: 1, mesa: 12 },
];

function buildMock(): JogadorInscrito[] {
  const deckCounts = new Map<string, number>();
  for (const e of MOCK_ENTRIES) {
    const key = e.deckNome.toLowerCase();
    deckCounts.set(key, (deckCounts.get(key) ?? 0) + 1);
  }

  return MOCK_ENTRIES.map((e, index) => ({
    id: e.id,
    ranking: index + 1,
    nome: e.nome,
    nickname: e.nickname,
    comandante: e.comandante,
    deckNome: e.deckNome,
    deckUrl: e.deckUrl,
    meta: deckCounts.get(e.deckNome.toLowerCase()) ?? 1,
    pontos: Math.max(0, 40 - index * 2 + (index % 3)),
    eliminacoes: index % 4,
    rodada: e.rodada,
    mesa: e.mesa,
  }));
}

export const INSCRICOES_MOCK: JogadorInscrito[] = buildMock();
