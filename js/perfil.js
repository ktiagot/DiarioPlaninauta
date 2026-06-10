const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// ── Auth ────────────────────────────────────────────────────
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) { return false; }

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) localStorage.clear();
            return false;
        }

        const user = await res.json();
        const emailEl = document.getElementById('userEmail');
        if (emailEl) emailEl.textContent = user.email;

        if (user.is_admin) {
            document.getElementById('adminBadge')?.style && (document.getElementById('adminBadge').style.display = 'block');
            document.getElementById('adminArea')?.style  && (document.getElementById('adminArea').style.display  = 'block');
            const ms = document.getElementById('minhasMesasSection');
            if (ms) ms.style.display = 'none';
        }

        return user;
    } catch (e) {
        console.error('checkAuth error:', e);
        return false;
    }
}

// ── Logout ──────────────────────────────────────────────────
function logout() {
    const token = localStorage.getItem('auth_token');
    fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).finally(() => { localStorage.clear(); window.location.href = 'login.html'; });
}

// ── Helpers ─────────────────────────────────────────────────
function setText(id, value, fallback = '') {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
}

function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

// ── Carregar perfil completo ─────────────────────────────────
async function carregarPerfil(email) {
    try {
        // 1. Dados do perfil + stats + campeonatos + decks
        const [perfilRes, apoiaRes] = await Promise.all([
            fetch(`${API_URL}/perfil/${encodeURIComponent(email)}`),
            fetch(`${API_URL}/apoia/meu-status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            })
        ]);

        const perfilData = perfilRes.ok ? await perfilRes.json() : null;
        const apoiaData  = apoiaRes.ok  ? await apoiaRes.json()  : null;

        // ── Nome (da inscrição mais recente, ou do perfil, ou do email) ──
        const nomeInscricao = perfilData?.campeonatos?.[0]
            ? await buscarNomeInscricao(email)
            : null;

        const nomePerfil = perfilData?.perfil?.nickname || perfilData?.perfil?.nome;
        const nomeDisplay = nomePerfil || nomeInscricao || email.split('@')[0];
        setText('nomeJogador', nomeDisplay);

        // ── Campos da tabela membros (se existirem) ──
        const perfil = perfilData?.perfil || {};
        setText('pronomesJogador',  perfil.pronomes    || '');
        setText('nomeRealJogador',  perfil.nome_real   || '');
        setText('telefoneJogador',  perfil.whatsapp || perfil.telefone || '');
        setText('cidadeJogador',    perfil.cidade      || '—');
        setText('formatoFavJogador', perfil.formato_favorito || '—');
        setText('diasJogador',      perfil.dias_disponiveis  || '—');
        setText('horarioJogador',   perfil.horario     || '—');

        // ── Avatar (Scryfall art_crop) ──
        const avatarEl = document.getElementById('avatarLg');
        if (avatarEl && perfil.avatar_url) {
            avatarEl.innerHTML = `<img src="${perfil.avatar_url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        }

        // ── Formatos (array salvo no perfil, ou fallback vazio) ──
        const formatos = perfil.formatos
            ? (typeof perfil.formatos === 'string' ? JSON.parse(perfil.formatos) : perfil.formatos)
            : [];
        const formatosEl = document.getElementById('formatosList');
        if (formatosEl) {
            if (formatos.length > 0) {
                formatosEl.innerHTML = formatos
                    .map(f => `<span class="formato-tag">${f}</span>`)
                    .join('');
            } else {
                formatosEl.innerHTML = '<span style="color:var(--text-tertiary);font-size:0.8rem;">Não informado</span>';
            }
        }

        // ── Badge meses apoiando ──
        const badge = document.getElementById('badgeApoiador');
        if (badge) {
            if (apoiaData?.meses_apoiando) {
                badge.textContent = `Apoiando há ${apoiaData.meses_apoiando} ${apoiaData.meses_apoiando === 1 ? 'mês' : 'meses'}`;
                badge.style.display = 'inline-block';
            } else if (apoiaData?.apoiador) {
                badge.textContent = 'Apoiador ativo';
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }

        // ── Stats gerais ──
        const stats = perfilData?.stats || {};
        setText('totalPartidasPerfil', stats.total_partidas   || '0');
        setText('totalVitoriasPerfil', stats.vitorias         || '0');
        setText('winRatePerfil',       (stats.winrate || 0) + '%');
        setText('totalPontosPerfil',   stats.pontos_totais    || '0');

        // ── Melhores resultados (top 3 posições) ──
        const campeonatos = perfilData?.campeonatos || [];
        const resultadosEl = document.getElementById('melhoresResultados');
        if (resultadosEl) {
            if (campeonatos.length > 0) {
                // Ordenar por posição e pegar os melhores
                const melhores = [...campeonatos]
                    .sort((a, b) => a.posicao - b.posicao)
                    .slice(0, 3);
                resultadosEl.innerHTML = melhores.map(c => {
                    const icon = c.posicao === 1 ? '🥇' : c.posicao <= 4 ? '🏅' : '📋';
                    return `<div class="result-item">${icon} ${c.posicao === 1 ? '1º Lugar' : c.posicao <= 4 ? `Top ${c.posicao}` : `${c.posicao}º`} — ${c.nome}</div>`;
                }).join('');
            } else {
                resultadosEl.innerHTML = '<div style="color:var(--text-tertiary);font-size:0.85rem;">Nenhum resultado ainda</div>';
            }
        }

        // ── Lista de precompeonatos ──
        const precompeonatosEl = document.getElementById('precompeonatosLista');
        if (precompeonatosEl) {
            if (campeonatos.length > 0) {
                precompeonatosEl.textContent = campeonatos.map(c => c.nome).join(' • ');
            } else {
                precompeonatosEl.innerHTML = '<span style="color:var(--text-tertiary);font-size:0.85rem;">Nenhum ainda</span>';
            }
        }

        // ── Decks mais usados ──
        const decks = perfilData?.decks_favoritos || [];
        const decksEl = document.getElementById('decksLista');
        if (decksEl) {
            if (decks.length > 0) {
                decksEl.innerHTML = decks.map(d => `
                    <span style="font-size:0.875rem;color:var(--text-secondary);">
                        🃏 ${d.deck_nome}
                        <span style="color:var(--text-tertiary);font-size:0.8rem;">
                            (${d.partidas} partida${d.partidas !== 1 ? 's' : ''} · ${d.winrate}% WR)
                        </span>
                    </span>
                `).join('');
            } else {
                decksEl.innerHTML = '<span style="color:var(--text-tertiary);font-size:0.85rem;">Nenhum deck registrado ainda</span>';
            }
        }

    } catch (e) {
        console.error('Erro ao carregar perfil:', e);
    }
}

// Busca o nome usado na inscrição mais recente
async function buscarNomeInscricao(email) {
    try {
        const res = await fetch(`${API_URL}/inscricoes?email=${encodeURIComponent(email)}`);
        if (!res.ok) return null;
        const inscricoes = await res.json();
        // Pegar o nome da inscrição mais recente ativa
        const ativa = inscricoes.find(i => i.email === email && i.ativo);
        return ativa?.nome || null;
    } catch {
        return null;
    }
}

// ── Minhas mesas ─────────────────────────────────────────────
async function carregarMinhasMesas(userEmail) {
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_URL}/minhas-mesas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao carregar mesas');

        const mesas = await res.json();
        const container   = document.getElementById('minhasMesas');
        const nenhumaMesa = document.getElementById('nenhumaMesa');

        if (mesas.length === 0) {
            if (container)   container.style.display = 'none';
            if (nenhumaMesa) nenhumaMesa.style.display = 'block';
            return;
        }

        if (container) {
            container.innerHTML = mesas.map(mesa => {
                const dataFormatada = mesa.data_rodada
                    ? new Date(mesa.data_rodada + 'T00:00:00').toLocaleDateString('pt-BR')
                    : 'Data não definida';

                const statusClass = mesa.finalizada ? 'success' : 'warning';
                const statusText  = mesa.finalizada ? 'Finalizada' : 'Pendente';

                return `
                    <div style="background:var(--card-bg);backdrop-filter:blur(12px);border:1px solid var(--card-border);border-radius:16px;padding:1.25rem;margin-bottom:1rem;">
                        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;flex-wrap:wrap;gap:0.75rem;">
                            <div>
                                <h4 style="color:var(--text);margin:0 0 0.25rem 0;font-size:0.9375rem;">Rodada ${mesa.rodada_numero} — Mesa ${mesa.numero_mesa}</h4>
                                <p style="color:var(--text-secondary);font-size:0.8125rem;margin:0;">${dataFormatada}</p>
                            </div>
                            <span class="badge badge-${statusClass}">${statusText}</span>
                        </div>

                        <div style="display:flex;flex-direction:column;gap:0.5rem;">
                            ${mesa.jogadores.map(j => {
                                const isMe      = j.email === userEmail;
                                const isVencedor = mesa.vencedor_id === j.inscricao_id;
                                return `
                                    <div style="padding:0.75rem;background:${isMe ? 'rgba(245,130,32,0.15)' : 'rgba(255,255,255,0.04)'};border:1px solid ${isMe ? 'rgba(245,130,32,0.3)' : 'rgba(255,255,255,0.07)'};border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                                        <div>
                                            <strong style="color:${isMe ? 'var(--orange)' : 'var(--text)'};">${j.nome}${isMe ? ' (Você)' : ''}</strong>
                                            <span style="color:var(--text-secondary);font-size:0.875rem;"> — ${j.deck_nome || 'Deck não definido'}</span>
                                        </div>
                                        ${mesa.finalizada && j.posicao_final ? `
                                            <span style="font-weight:600;color:${isMe ? 'var(--orange)' : 'var(--text-secondary)'};">
                                                ${isVencedor ? '🏆 ' : ''}${j.posicao_final}º lugar
                                            </span>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        ${mesa.finalizada && mesa.vencedor_nome ? `
                            <div style="margin-top:1rem;padding:0.75rem;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);border-radius:8px;text-align:center;">
                                <strong style="color:var(--success);">🏆 Vencedor: ${mesa.vencedor_nome}</strong>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.error('Erro ao carregar mesas:', e);
        const container = document.getElementById('minhasMesas');
        if (container) {
            container.innerHTML = `
                <div style="padding:1rem;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);border-radius:10px;color:var(--danger);">
                    Erro ao carregar suas mesas. Tente novamente mais tarde.
                </div>
            `;
        }
    }
}

// ── Init ─────────────────────────────────────────────────────
checkAuth().then(user => {
    if (!user) return;
    carregarPerfil(user.email);
    if (!user.is_admin) carregarMinhasMesas(user.email);
});

// ── Editar Perfil (modal) ────────────────────────────────────
function abrirEditarPerfil() {
    const modal = document.getElementById('modalEditarPerfil');
    if (modal) modal.style.display = 'flex';

    // Pré-preencher com dados atuais
    const fields = {
        editNickname: document.getElementById('nomeJogador')?.textContent,
        editPronomes: document.getElementById('pronomesJogador')?.textContent,
        editNomeReal: document.getElementById('nomeRealJogador')?.textContent,
        editWhatsapp: document.getElementById('telefoneJogador')?.textContent,
        editCidade: document.getElementById('cidadeJogador')?.textContent,
        editFormatoFav: document.getElementById('formatoFavJogador')?.textContent,
        editDias: document.getElementById('diasJogador')?.textContent,
        editHorario: document.getElementById('horarioJogador')?.textContent,
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el && value && value !== '—' && value !== '…') {
            el.value = value;
        }
    }

    // Formatos
    const formatosEl = document.getElementById('formatosList');
    if (formatosEl) {
        const tags = formatosEl.querySelectorAll('.formato-tag');
        if (tags.length > 0) {
            const editFormatos = document.getElementById('editFormatos');
            if (editFormatos) editFormatos.value = Array.from(tags).map(t => t.textContent).join(', ');
        }
    }
}

function fecharEditarPerfil() {
    const modal = document.getElementById('modalEditarPerfil');
    if (modal) modal.style.display = 'none';
}

// ── Avatar Scryfall Search ───────────────────────────────────
let avatarDebounce;
document.addEventListener('DOMContentLoaded', () => {
    const buscaInput = document.getElementById('editAvatarBusca');
    if (buscaInput) {
        buscaInput.addEventListener('input', () => {
            clearTimeout(avatarDebounce);
            avatarDebounce = setTimeout(() => buscarAvatarScryfall(buscaInput.value.trim()), 500);
        });
    }
});

async function buscarAvatarScryfall(termo) {
    const container = document.getElementById('avatarResults');
    if (!container) return;
    if (!termo || termo.length < 2) { container.innerHTML = ''; return; }

    try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(termo)}+type:legendary+type:creature&unique=art`);
        if (!res.ok) { container.innerHTML = '<span style="color:var(--text-tertiary);font-size:0.8rem;">Nenhum resultado</span>'; return; }
        const data = await res.json();

        const cards = (data.data || []).slice(0, 8);
        container.innerHTML = cards.map(card => {
            const imgUrl = card.image_uris?.art_crop || (card.card_faces?.[0]?.image_uris?.art_crop) || '';
            if (!imgUrl) return '';
            return `
                <img src="${imgUrl}" alt="${card.name}" title="${card.name}"
                     style="width:64px;height:64px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid transparent;transition:border-color 0.2s;"
                     onclick="selecionarAvatar('${imgUrl.replace(/'/g, "\\'")}')"
                     onmouseover="this.style.borderColor='var(--orange)'" onmouseout="this.style.borderColor='transparent'">
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = '<span style="color:var(--text-tertiary);font-size:0.8rem;">Erro na busca</span>';
    }
}

function selecionarAvatar(url) {
    const hidden = document.getElementById('editAvatarUrl');
    const preview = document.getElementById('avatarPreview');
    if (hidden) hidden.value = url;
    if (preview) {
        preview.innerHTML = `<img src="${url}" alt="Avatar selecionado" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid var(--orange);">`;
    }
    // Highlight na seleção
    document.querySelectorAll('#avatarResults img').forEach(img => {
        img.style.borderColor = img.src === url ? 'var(--orange)' : 'transparent';
    });
}

// Submeter formulário de edição
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formEditarPerfil');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const formatosRaw = document.getElementById('editFormatos')?.value || '';
            const formatos = formatosRaw.split(',').map(f => f.trim()).filter(Boolean);

            const body = {
                nickname: document.getElementById('editNickname')?.value || null,
                nome_real: document.getElementById('editNomeReal')?.value || null,
                pronomes: document.getElementById('editPronomes')?.value || null,
                cidade: document.getElementById('editCidade')?.value || null,
                estado: document.getElementById('editEstado')?.value || null,
                whatsapp: document.getElementById('editWhatsapp')?.value || null,
                discord: document.getElementById('editDiscord')?.value || null,
                formato_favorito: document.getElementById('editFormatoFav')?.value || null,
                formatos: formatos.length > 0 ? formatos : null,
                dias_disponiveis: document.getElementById('editDias')?.value || null,
                horario: document.getElementById('editHorario')?.value || null,
                bio: document.getElementById('editBio')?.value || null,
                avatar_url: document.getElementById('editAvatarUrl')?.value || null,
            };

            try {
                const res = await fetch(`${API_URL}/perfil`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (res.ok) {
                    alert('Perfil atualizado!');
                    fecharEditarPerfil();
                    // Recarregar dados
                    const email = localStorage.getItem('user_email');
                    if (email) carregarPerfil(email);
                } else {
                    const data = await res.json();
                    alert(data.error || 'Erro ao salvar');
                }
            } catch (err) {
                alert('Erro de conexão');
            }
        });
    }
});
