-- ============================================================
-- DIÁRIO PLANINAUTA — Setup de tabelas do portal
-- Executar no banco u394631272_precompeonato
-- ============================================================

-- Tabela de membros do portal (substitui/complementa perfis_usuarios)
-- Cada pessoa que faz login tem um registro aqui
CREATE TABLE IF NOT EXISTS membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    -- Dados de exibição
    nickname VARCHAR(100) DEFAULT NULL COMMENT 'Nome público (exibido na comunidade)',
    nome_real VARCHAR(100) DEFAULT NULL COMMENT 'Nome completo (privado)',
    pronomes VARCHAR(30) DEFAULT NULL COMMENT 'Ex: ele/dele, ela/dela',
    avatar_url VARCHAR(500) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    -- Contato
    discord VARCHAR(100) DEFAULT NULL,
    whatsapp VARCHAR(30) DEFAULT NULL,
    telefone VARCHAR(30) DEFAULT NULL,
    -- Localização e disponibilidade
    cidade VARCHAR(100) DEFAULT NULL,
    estado VARCHAR(50) DEFAULT NULL,
    -- Card games
    formato_favorito VARCHAR(100) DEFAULT NULL COMMENT 'Ex: Bloomburrow, Commander, Precon',
    formatos JSON DEFAULT NULL COMMENT 'Array: ["Precon", "B3", "Commander"]',
    dias_disponiveis VARCHAR(100) DEFAULT NULL COMMENT 'Ex: Seg / Qua / Sext',
    horario VARCHAR(50) DEFAULT NULL COMMENT 'Ex: 18h30 - 00h',
    -- Controle
    visibilidade_telefone ENUM('privado', 'amigos', 'publico') DEFAULT 'privado',
    visibilidade_nome_real ENUM('privado', 'amigos', 'publico') DEFAULT 'privado',
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cidade (cidade),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de favoritos (amigos na comunidade)
CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_de VARCHAR(255) NOT NULL COMMENT 'Quem favoritou',
    email_para VARCHAR(255) NOT NULL COMMENT 'Quem foi favoritado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_favorito (email_de, email_para),
    INDEX idx_de (email_de),
    INDEX idx_para (email_para)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pontos (sistema de recompensas)
CREATE TABLE IF NOT EXISTS pontos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    tipo ENUM('credito', 'debito') NOT NULL,
    quantidade INT NOT NULL,
    descricao VARCHAR(255) NOT NULL COMMENT 'Ex: Vitória Rodada 3, Resgate Produto X',
    referencia_tipo VARCHAR(50) DEFAULT NULL COMMENT 'campeonato, mesa_casual, loja, manual',
    referencia_id INT DEFAULT NULL COMMENT 'ID da entidade relacionada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de produtos da loja
CREATE TABLE IF NOT EXISTS loja_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT DEFAULT NULL,
    preco_pontos INT NOT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,
    estoque INT DEFAULT NULL COMMENT 'NULL = ilimitado',
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de resgates da loja
CREATE TABLE IF NOT EXISTS loja_resgates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    produto_id INT NOT NULL,
    pontos_gastos INT NOT NULL,
    status ENUM('pendente', 'aprovado', 'entregue', 'cancelado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (produto_id) REFERENCES loja_produtos(id),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MIGRAÇÃO: Popular membros a partir dos dados de inscricoes
-- (Executar uma vez para criar registros iniciais)
-- ============================================================
INSERT IGNORE INTO membros (email, nickname, discord, whatsapp)
SELECT DISTINCT 
    i.email,
    i.nome,
    i.discord,
    i.whatsapp
FROM inscricoes i
WHERE i.ativo = TRUE;

-- ============================================================
-- Produtos de exemplo para a loja (mockados)
-- ============================================================
INSERT INTO loja_produtos (nome, descricao, preco_pontos, estoque, ativo) VALUES
('Sleeve Gamegenic', 'Pack de 100 sleeves Gamegenic Matte', 50, 10, 0),
('Deckbox Gamegenic', 'Deckbox Sidekick 100+ XL', 120, 5, 0),
('Camisa Glórin', 'Camisa exclusiva do canal - tamanho a escolher', 200, 3, 0),
('R$20 em crédito Citadel', 'Crédito na Citadel Hobby Store', 80, NULL, 0),
('Marcador de Mão WTF Cards', 'Marcador artesanal exclusivo', 60, 8, 0);
