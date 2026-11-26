-- ============================================================
-- DDL - Altave OS
-- Ordem: usuario -> time -> (FK usuario.time_id) -> os
-- (usuario e time referenciam um ao outro, então a FK
--  usuario.time_id é adicionada depois via ALTER TABLE)
-- ============================================================
CREATE DATABASE IF NOT EXISTS atividade_bdr_2dsm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE atividade_bdr_2dsm;

-- O usuário pode ser cadastrado antes de receber um time.
CREATE TABLE usuario (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  senha      VARCHAR(255) NOT NULL, -- hash bcrypt (60 chars), nunca senha pura
  cargo      ENUM(
    'superusuario',
    'gestor',
    'comercial',
    'suporte',
    'producao',
    'software',
    'implantacao',
    'monitoramento'
  ) NOT NULL,
  time_id    INT NULL               -- usuário pode existir sem time
) ENGINE=InnoDB;

CREATE TABLE `time` (
  id_time        INT PRIMARY KEY AUTO_INCREMENT,
  nome_time      VARCHAR(100) NOT NULL UNIQUE,
  email_time     VARCHAR(150) NULL UNIQUE,
  departamento   VARCHAR(100) NOT NULL,
  responsavel_id INT NULL,          -- líder do time (quem pode concluir OS)
  CONSTRAINT fk_time_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE usuario
  ADD CONSTRAINT fk_usuario_time
  FOREIGN KEY (time_id) REFERENCES `time`(id_time)
  ON DELETE SET NULL;

-- Cada ordem precisa de um criador e de um time executor.
CREATE TABLE os (
  os_id               INT PRIMARY KEY AUTO_INCREMENT,
  os_titulo           VARCHAR(150) NOT NULL,
  os_descricao        TEXT NOT NULL,
  os_status           ENUM(
    'aberta',
    'em andamento',
    'concluida',
    'teste',
    'bloqueado',
    'review'
  ) NOT NULL DEFAULT 'aberta',
  prioridade          ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
  data_limite         DATE NOT NULL,
  data_criacao        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_criador          INT NOT NULL,
  id_time_responsavel INT NOT NULL,
  CONSTRAINT fk_os_criador
    FOREIGN KEY (id_criador) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_os_time
    FOREIGN KEY (id_time_responsavel) REFERENCES `time`(id_time)
) ENGINE=InnoDB;
