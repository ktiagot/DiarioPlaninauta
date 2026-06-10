const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

let token = localStorage.getItem('auth_token');
let userEmail = localStorage.getItem('user_email');
let todasMesas = [];
let filtroAtual = 'todas';

// Verificar autenticação (não redireciona, apenas verifica)
async function verificarAuth(mostrarAlerta = true) {
    token = localStorage.getItem('auth_token');
    userEmail = localStorage.getItem('user_email');
    
    if (!token) {
        if (mostrarAlerta) alert('Você precisa fazer login para realizar esta ação');
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_email');
            token = null;
            userEmail = null;
            if (mostrarAlerta) alert('Sessão expirada. Faça login novamente.');
            return false;
        }
        
        const data = await response.json();
        userEmail = data.email;
        localStorage.setItem('user_email', data.email);
        return true;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
    }
}

// Carregar mesas
async function carregarMesas() {
    try {
        const response = await fetch(`${API_URL}/mesas-casuais`);
        todasMesas = await response.json();
        aplicarFiltro();
    } catch (error) {
        console.error('Erro ao carregar mesas:', error);
        document.getElementById('mesasList').innerHTML = `
            <div style="text-align:center; padding:2rem; color:var(--danger);">
                Erro ao carregar mesas. Tente novamente.
            </div>
        `;
    }
}

// Filtros
function filtrarMesas(filtro) {
    filtroAtual = filtro;
    aplicarFiltro();
}

function aplicarFiltro() {
    let mesasFiltradas = [...todasMesas];
    
    if (filtroAtual === 'abertas') {
        mesasFiltradas = mesasFiltradas.filter(m => m.status === 'aberta');
    } else if (filtroAtual === 'minhas') {
        mesasFiltradas = mesasFiltradas.filter(m => 
            m.criador_email === userEmail || 
            m.jogadores.some(j => j.jogador_email === userEmail)
        );
    }
    
    exibirMesas(mesasFiltradas);
}

// Exibir mesas (simplificado — sem botões de entrar/sair/cancelar)
function exibirMesas(mesas) {
    const container = document.getElementById('mesasList');
    const emptyState = document.getElementById('emptyState');
    
    if (mesas.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = mesas.map(mesa => {
        const dataHora = new Date(mesa.data_hora);
        const dataFormatada = dataHora.toLocaleDateString('pt-BR');
        const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const ehCriador = mesa.criador_email === userEmail;
        
        let statusBadge = '';
        let statusColor = '';
        switch(mesa.status) {
            case 'aberta': statusBadge = 'Aberta'; statusColor = '#16a34a'; break;
            case 'cheia': statusBadge = 'Cheia'; statusColor = '#f59e0b'; break;
            case 'em_andamento': statusBadge = 'Em Andamento'; statusColor = '#3b82f6'; break;
            case 'finalizada': statusBadge = 'Finalizada'; statusColor = '#6b7280'; break;
            case 'cancelada': statusBadge = 'Cancelada'; statusColor = '#dc2626'; break;
        }
        
        return `
            <div class="mesa-card">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem; flex-wrap:wrap; gap:1rem;">
                    <div style="flex:1;">
                        <h3 style="margin:0 0 0.4rem 0; color:var(--text); font-size:1.1rem;">${mesa.titulo}</h3>
                        <p style="margin:0; color:var(--text-tertiary); font-size:0.8rem;">
                            Criado por: ${mesa.criador_email}
                        </p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <span style="padding:0.25rem 0.65rem; background:${statusColor}; color:white; border-radius:6px; font-size:0.8rem; font-weight:600;">
                            ${statusBadge}
                        </span>
                        <span style="padding:0.25rem 0.65rem; background:rgba(255,255,255,0.06); color:var(--text-secondary); border-radius:6px; font-size:0.8rem; font-weight:600;">
                            ${mesa.jogadores_atuais}/${mesa.max_jogadores}
                        </span>
                    </div>
                </div>
                
                ${mesa.descricao ? `<p style="margin:0 0 1rem 0; color:var(--text-secondary); font-size:0.9rem;">${mesa.descricao}</p>` : ''}
                
                <div style="display:flex; gap:1.5rem; margin-bottom:1rem; flex-wrap:wrap; font-size:0.875rem; color:var(--text-secondary);">
                    <div>📅 ${dataFormatada}</div>
                    <div>🕐 ${horaFormatada}</div>
                </div>
                
                ${mesa.link_jogo ? `
                    <div style="margin-bottom:1rem;">
                        <a href="${mesa.link_jogo.startsWith('http') ? mesa.link_jogo : 'https://' + mesa.link_jogo}" target="_blank" class="btn-primary btn-sm" style="text-decoration:none;">
                            🎮 Link do Jogo
                        </a>
                    </div>
                ` : ''}
                
                <!-- Jogadores -->
                ${mesa.jogadores.length > 0 ? `
                <div>
                    <strong style="display:block; margin-bottom:0.4rem; color:var(--text); font-size:0.85rem;">Jogadores:</strong>
                    <div style="display:flex; flex-direction:column; gap:0.35rem;">
                        ${mesa.jogadores.map(j => `
                            <div style="padding:0.5rem 0.75rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:8px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                                <span style="color:var(--text-secondary);">
                                    ${j.jogador_email}
                                    ${j.deck_nome ? ` — <span style="color:var(--text-tertiary);">${j.deck_nome}</span>` : ''}
                                </span>
                                ${j.deck_link ? `<a href="${j.deck_link.startsWith('http') ? j.deck_link : 'https://' + j.deck_link}" target="_blank" style="color:var(--orange); text-decoration:none; font-size:0.75rem;">📋 Deck</a>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Ação do criador: adicionar link -->
                ${ehCriador && !mesa.link_jogo && mesa.status !== 'cancelada' ? `
                    <div style="margin-top:1rem;">
                        <button onclick="adicionarLinkJogo(${mesa.id})" class="btn-secondary btn-sm">
                            🔗 Adicionar Link do Jogo
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Abrir modal criar mesa
document.getElementById('btnCriarMesa').addEventListener('click', async () => {
    const autenticado = await verificarAuth(true);
    if (!autenticado) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('modalCriarMesa').style.display = 'flex';
    
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    document.querySelector('input[name="data_hora"]').min = agora.toISOString().slice(0, 16);
});

// Busca de deck
let timeoutBusca;
document.getElementById('deckBuscaCasual').addEventListener('input', (e) => {
    clearTimeout(timeoutBusca);
    const busca = e.target.value.trim();
    
    if (busca.length < 2) {
        document.getElementById('deckSugestoesCasual').style.display = 'none';
        return;
    }
    
    timeoutBusca = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/precons?busca=${encodeURIComponent(busca)}`);
            const precons = await response.json();
            const sugestoes = document.getElementById('deckSugestoesCasual');
            
            if (precons.length === 0) {
                sugestoes.innerHTML = '<div style="padding:0.75rem; color:var(--text-tertiary);">Nenhum deck encontrado</div>';
                sugestoes.style.display = 'block';
                return;
            }
            
            sugestoes.innerHTML = precons.slice(0, 5).map(p => `
                <div onclick="selecionarDeckCasual(${p.id}, '${p.nome.replace(/'/g, "\\'")}')" 
                     class="deck-sugestao">
                    <strong>${p.nome}</strong>
                    <small>${p.comandante_principal} — ${p.set_nome}</small>
                </div>
            `).join('');
            
            sugestoes.style.display = 'block';
        } catch (error) {
            console.error('Erro ao buscar precons:', error);
        }
    }, 300);
});

function selecionarDeckCasual(id, nome) {
    document.getElementById('deckIdCasual').value = id;
    document.getElementById('deckBuscaCasual').value = nome;
    document.getElementById('deckSugestoesCasual').style.display = 'none';
}

// Criar mesa
document.getElementById('formCriarMesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        titulo: formData.get('titulo'),
        descricao: formData.get('descricao'),
        data_hora: formData.get('data_hora'),
        max_jogadores: parseInt(formData.get('max_jogadores')),
        deck_precon_id: document.getElementById('deckIdCasual').value || null,
        deck_link: formData.get('deck_link') || null,
        comandante_1: null,
        comandante_2: null
    };
    
    try {
        const response = await fetch(`${API_URL}/mesas-casuais`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar mesa');
        }
        
        alert('Mesa criada com sucesso!');
        fecharModal();
        carregarMesas();
    } catch (error) {
        console.error('Erro ao criar mesa:', error);
        alert('Erro ao criar mesa: ' + error.message);
    }
});

// Adicionar link do jogo (apenas criador)
async function adicionarLinkJogo(mesaId) {
    let link = prompt('Cole o link do jogo (SpellTable, Discord, etc.):');
    if (!link) return;
    
    link = link.trim();
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
    }
    
    try {
        const response = await fetch(`${API_URL}/mesas-casuais/${mesaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ link_jogo: link })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar link');
        }
        
        alert('Link adicionado!');
        carregarMesas();
    } catch (error) {
        console.error('Erro ao adicionar link:', error);
        alert('Erro: ' + error.message);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await verificarAuth(false);
    carregarMesas();
    setInterval(carregarMesas, 30000);
    
    const btnCriar = document.getElementById('btnCriarMesa');
    if (!autenticado || !token) {
        btnCriar.innerHTML = '🔒 Fazer Login para Criar Mesa';
    }
});
