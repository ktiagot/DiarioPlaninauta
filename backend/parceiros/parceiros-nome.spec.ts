import { SEM_NOME, nomeParaExibir } from './parceiros.service';

describe('nomeParaExibir', () => {
  const base = { nome: '', descricao: null as string | null, url: 'https://www.ligamagic.com.br/loja' };

  it('usa o nome quando existe (sem espaços nas pontas)', () => {
    expect(nomeParaExibir({ ...base, nome: '  Liga Magic ' })).toBe('Liga Magic');
  });

  it('sem nome, usa a descrição', () => {
    expect(nomeParaExibir({ ...base, descricao: 'Loja parceira' })).toBe('Loja parceira');
  });

  it('sem nome nem descrição, usa o domínio da URL (sem www)', () => {
    expect(nomeParaExibir({ ...base, nome: '   ' })).toBe('ligamagic.com.br');
  });

  it('sem nada utilizável, devolve o marcador SEM_NOME', () => {
    expect(nomeParaExibir({ ...base, url: 'isso-nao-e-url' })).toBe(SEM_NOME);
  });
});