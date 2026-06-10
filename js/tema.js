/**
 * tema.js — Diário Planinauta
 * Gerencia: API_URL, menu mobile, controle de acesso (login), modo beta.
 */

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Páginas que exigem login para acessar
const PAGINAS_PROTEGIDAS = ['perfil.html', 'loja.html'];

// Páginas que ficam escondidas na nav se não logado
const NAV_REQUER_LOGIN = ['perfil.html', 'comunidade.html', 'mesas-casuais.html', 'loja.html'];

// ── Verificar se está logado ──────────────────────────────────
function estaLogado() {
    return !!localStorage.getItem('auth_token');
}

// ── Retorna a página atual ────────────────────────────────────
function paginaAtual() {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1] || 'index.html';
}

// ── Controle de acesso ────────────────────────────────────────
function controlarAcesso() {
    const logado = estaLogado();
    const pagina = paginaAtual();

    // TEMPORÁRIO: restrição de login desativada para demonstração
    // Descomentar abaixo para reativar:
    
    // if (!logado && pagina === 'index.html') {
    //     window.location.href = 'landing.html';
    //     return;
    // }
    // if (!logado && PAGINAS_PROTEGIDAS.includes(pagina)) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // Admin: só quem é admin pode acessar
    if (pagina === 'admin.html' && (!logado || localStorage.getItem('is_admin') !== 'true')) {
        window.location.href = 'login.html';
        return;
    }

    // Gerenciar visibilidade na nav
    gerenciarNav(logado);
}

// ── Gerenciar nav: ocultar/mostrar links baseado em login ─────
function gerenciarNav(logado) {
    // TEMPORÁRIO: desativado para demonstração — todos os links visíveis
    return;
}

// ── Menu mobile (hambúrguer) ──────────────────────────────────
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            hamburger.classList.toggle('open');
        });

        // Fechar ao clicar num link
        mobileMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
            });
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
            }
        });
    }
}

// ── Modo beta (esconde funcionalidades se ativo) ──────────────
async function verificarModoBeta() {
    try {
        const response = await fetch(`${API_URL}/beta-status`);
        const data = await response.json();
        if (data.beta_mode) {
            const linksOcultar = ['inscricao.html', 'mesas-casuais.html', 'ranking.html', 'perfil.html', 'regras.html'];
            linksOcultar.forEach(href => {
                document.querySelectorAll(`a[href="${href}"]`).forEach(el => el.style.display = 'none');
            });
            const tabMinhas = document.querySelector('.tab-btn[data-tab="minhas"]');
            if (tabMinhas) tabMinhas.style.display = 'none';
        }
    } catch (_) { /* API indisponível, ignora */ }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    controlarAcesso();
    initMobileMenu();
    verificarModoBeta();
});
