/**
 * comunidade.js — Diário Planinauta
 * Página "Conhecer jogadores" — busca dados da API /api/jogadores
 */

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

let jogadores = [];
let favoritados = new Set();
let buscaTimeout;

// ── Carregar jogadores da API ────────────────────────────────
async function carregarJogadores(busca = '', cidade = '', formato = '', disponibilidade = '') {
    try {
        let url = `${API_URL}/jogadores?limit=50`;
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;
        if (cidade) url += `&cidade=${encodeURIComponent(cidade)}`;
        if (formato) url += `&formato=${encodeURIComponent(formato)}`;
        if (disponibilidade) url += `&disponibilidade=${encodeURIComponent(disponibilidade)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar jogadores');

        jogadores = await res.json();
        renderList(jogadores);
        popularFiltros(jogadores);
    } catch (e) {
        console.error('Erro ao carregar jogadores:', e);
        document.getElementById('playersList').innerHTML = `
            <div class="empty-state">
                <h3>Erro ao carregar jogadores</h3>
                <p>Tente novamente em alguns instantes.</p>
            </div>
        `;
    }
}

// ── Popular selects de filtro com valores únicos ─────────────
function popularFiltros(lista) {
    // Cidades
    const cidades = [...new Set(lista.map(j => j.cidade).filter(Boolean))].sort();
    const selectCidade = document.querySelector('select[onchange*="filtrarPorCidade"]');
    if (selectCidade) {
        const valorAtual = selectCidade.value;
        selectCidade.innerHTML = '<option value="">📍 Localidade</option>' +
            cidades.map(c => `<option value="${c}" ${c === valorAtual ? 'selected' : ''}>${c}</option>`).join('');
    }

    // Formatos
    const formatosSet = new Set();
    lista.forEach(j => {
        if (j.formatos) {
            try {
                const arr = typeof j.formatos === 'string' ? JSON.parse(j.formatos) : j.formatos;
                arr.forEach(f => formatosSet.add(f));
            } catch (e) {}
        }
        if (j.formato_favorito) formatosSet.add(j.formato_favorito);
    });
    const formatos = [...formatosSet].sort();
    const selectFormato = document.querySelector('select[onchange*="filtrarPorFormato"]');
    if (selectFormato) {
        const valorAtual = selectFormato.value;
        selectFormato.innerHTML = '<option value="">🃏 Formato</option>' +
            formatos.map(f => `<option value="${f}" ${f === valorAtual ? 'selected' : ''}>${f}</option>`).join('');
    }

    // Disponibilidade (dias)
    const diasSet = new Set();
    lista.forEach(j => {
        if (j.dias_disponiveis) {
            j.dias_disponiveis.split(/[,\/]/).map(d => d.trim()).filter(Boolean).forEach(d => diasSet.add(d));
        }
    });
    const dias = [...diasSet].sort();
    const selectDisp = document.querySelector('select[onchange*="filtrarPorDisponibilidade"]');
    if (selectDisp) {
        const valorAtual = selectDisp.value;
        selectDisp.innerHTML = '<option value="">📅 Disponibilidade</option>' +
            dias.map(d => `<option value="${d}" ${d === valorAtual ? 'selected' : ''}>${d}</option>`).join('');
    }
}

// ── Funções de filtro ────────────────────────────────────────
function filtrarPorCidade(valor) {
    const busca = document.getElementById('searchInput')?.value?.trim() || '';
    const formato = document.querySelector('select[onchange*="filtrarPorFormato"]')?.value || '';
    const disponibilidade = document.querySelector('select[onchange*="filtrarPorDisponibilidade"]')?.value || '';
    carregarJogadores(busca, valor, formato, disponibilidade);
}

function filtrarPorFormato(valor) {
    const busca = document.getElementById('searchInput')?.value?.trim() || '';
    const cidade = document.querySelector('select[onchange*="filtrarPorCidade"]')?.value || '';
    const disponibilidade = document.querySelector('select[onchange*="filtrarPorDisponibilidade"]')?.value || '';
    carregarJogadores(busca, cidade, valor, disponibilidade);
}

function filtrarPorDisponibilidade(valor) {
    const busca = document.getElementById('searchInput')?.value?.trim() || '';
    const cidade = document.querySelector('select[onchange*="filtrarPorCidade"]')?.value || '';
    const formato = document.querySelector('select[onchange*="filtrarPorFormato"]')?.value || '';
    carregarJogadores(busca, cidade, formato, valor);
}

// ── Carregar favoritos do usuário logado ─────────────────────
async function carregarFavoritos() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/favoritos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const favs = await res.json();
        favoritados = new Set(favs.map(f => f.email));
    } catch (e) {
        // Silencioso — favoritos são opcionais
    }
}

// ── Toggle favorito ──────────────────────────────────────────
async function toggleFav(email) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('Faça login para favoritar jogadores.');
        return;
    }

    const isFav = favoritados.has(email);

    try {
        const res = await fetch(`${API_URL}/favoritos/${encodeURIComponent(email)}`, {
            method: isFav ? 'DELETE' : 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            if (isFav) {
                favoritados.delete(email);
            } else {
                favoritados.add(email);
            }
            // Re-render o card específico
            const el = document.getElementById(`player-${email.replace(/[^a-z0-9]/gi, '_')}`);
            if (el) {
                const jogador = jogadores.find(j => j.email === email);
                if (jogador) {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = renderPlayerCard(jogador);
                    el.replaceWith(tmp.firstElementChild);
                }
            }
        }
    } catch (e) {
        console.error('Erro ao favoritar:', e);
    }
}

// ── Verificar contato (favorito mútuo) ───────────────────────
async function verContato(email, btnEl) {
    const token = localStorage.getItem('auth_token');
    if (!token) { alert('Faça login para ver contatos.'); return; }

    try {
        btnEl.disabled = true;
        btnEl.textContent = '...';
        const res = await fetch(`${API_URL}/jogadores/${encodeURIComponent(email)}/contato`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.mutuo === false) {
            btnEl.textContent = '🔒 Favoritem-se mutuamente';
            btnEl.disabled = true;
            return;
        }

        // Mostrar contato
        let contatoHtml = '';
        if (data.whatsapp) contatoHtml += `<span>📱 ${data.whatsapp}</span> `;
        if (data.discord) contatoHtml += `<span>💬 ${data.discord}</span>`;
        if (!contatoHtml) contatoHtml = '<span style="color:var(--text-tertiary);">Sem contato cadastrado</span>';

        btnEl.outerHTML = `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;">${contatoHtml}</div>`;
    } catch (e) {
        btnEl.textContent = 'Erro';
        btnEl.disabled = true;
    }
}

// ── Render card de jogador ───────────────────────────────────
function renderPlayerCard(j) {
    const nome = j.nickname || j.email.split('@')[0];
    const initials = nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const safeId = j.email.replace(/[^a-z0-9]/gi, '_');
    const isFav = favoritados.has(j.email);

    // Formatos
    let formatos = [];
    if (j.formatos) {
        try {
            formatos = typeof j.formatos === 'string' ? JSON.parse(j.formatos) : j.formatos;
        } catch (e) { formatos = []; }
    }

    const formatosTags = formatos.map(f =>
        `<span style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:0.2rem 0.5rem;font-size:0.75rem;color:var(--text-secondary);">${f}</span>`
    ).join('');

    // Botão "Ver contato" só aparece se favoritamos o jogador
    const btnContato = isFav
        ? `<button class="btn-secondary btn-sm" style="font-size:0.75rem;padding:0.25rem 0.6rem;margin-top:0.5rem;" onclick="verContato('${j.email}', this)">👁️ Ver contato</button>`
        : '';

    return `
        <div class="player-card" id="player-${safeId}">
            <div class="avatar-wrap">
                <div class="avatar" style="width:72px;height:72px;font-size:1.5rem;background:rgba(245,130,32,0.12);border-color:rgba(245,130,32,0.25);">
                    ${j.avatar_url ? `<img src="${j.avatar_url}" alt="${nome}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials}
                </div>
                <div style="font-size:1.1rem;padding:0.3rem 0.6rem;background:rgba(255,255,255,0.07);border-radius:6px;">🃏</div>
            </div>

            <div class="player-info">
                <div style="display:flex;align-items:baseline;gap:0.5rem;flex-wrap:wrap;">
                    <span class="player-name">${nome}</span>
                    ${j.pronomes ? `<span class="player-pronouns">${j.pronomes}</span>` : ''}
                </div>

                <div class="player-details" style="margin-top:0.5rem;">
                    ${j.cidade ? `<div class="player-detail">📍 ${j.cidade}${j.estado ? ', ' + j.estado : ''}</div>` : ''}
                    ${j.dias_disponiveis ? `<div class="player-detail">📅 ${j.dias_disponiveis}</div>` : ''}
                    ${j.horario ? `<div class="player-detail">🕐 ${j.horario}</div>` : ''}
                </div>

                ${formatos.length > 0 ? `
                    <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.75rem;">
                        ${formatosTags}
                    </div>
                ` : ''}

                ${j.meses_apoiando ? `
                    <div style="margin-top:0.75rem;">
                        <span class="badge-apoiador">Apoiando há ${j.meses_apoiando} ${j.meses_apoiando === 1 ? 'mês' : 'meses'}</span>
                    </div>
                ` : ''}

                ${btnContato}
            </div>

            <button
                class="heart-btn ${isFav ? 'active' : ''}"
                onclick="toggleFav('${j.email}')"
                aria-label="Favoritar ${nome}"
                title="${isFav ? 'Remover favorito' : 'Favoritar'}"
            >${isFav ? '❤️' : '🤍'}</button>
        </div>
    `;
}

// ── Render lista ─────────────────────────────────────────────
function renderList(lista) {
    const container = document.getElementById('playersList');
    const empty = document.getElementById('emptyState');

    if (!lista.length) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    container.innerHTML = lista.map(renderPlayerCard).join('');
}

// ── Buscar jogadores ─────────────────────────────────────────
function buscarJogadores() {
    const termo = document.getElementById('searchInput').value.trim();
    const cidade = document.querySelector('select[onchange*="filtrarPorCidade"]')?.value || '';
    const formato = document.querySelector('select[onchange*="filtrarPorFormato"]')?.value || '';
    const disponibilidade = document.querySelector('select[onchange*="filtrarPorDisponibilidade"]')?.value || '';
    carregarJogadores(termo, cidade, formato, disponibilidade);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const input = document.getElementById('searchInput');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') buscarJogadores();
        });
        input.addEventListener('input', () => {
            clearTimeout(buscaTimeout);
            buscaTimeout = setTimeout(() => {
                buscarJogadores();
            }, 400);
        });
    }

    await carregarFavoritos();
    await carregarJogadores();
});
