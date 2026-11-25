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

CREATE TABLE IF NOT EXISTS os_anexo (
  id_anexo INT PRIMARY KEY AUTO_INCREMENT,
  os_id    INT NOT NULL,
  nome     VARCHAR(255) NOT NULL,
  conteudo MEDIUMBLOB NOT NULL,
  CONSTRAINT fk_os_anexo_os
    FOREIGN KEY (os_id) REFERENCES os(os_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE os
  ADD COLUMN id_usuario_responsavel INT NULL,
  ADD CONSTRAINT fk_os_usuario_responsavel
    FOREIGN KEY (id_usuario_responsavel) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL;

START TRANSACTION;

INSERT INTO usuario (nome, email, senha, cargo) VALUES
  ('Gestor', 'gestor@altave.test', '$2b$10$CvZ0UDKWoF1hPaVINFt6MOtHvNadulhyUqWmwUIl825.y9twNZ2Ka', 'gestor'),
  ('Comercial', 'comercial@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  ('Produção', 'producao@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  ('Software', 'software@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software')
ON DUPLICATE KEY UPDATE id_usuario = id_usuario;

INSERT INTO `time` (nome_time, departamento, responsavel_id)
SELECT u.nome, u.nome, u.id_usuario
  FROM usuario u
 WHERE ((u.email = 'producao@altave.test' AND u.cargo = 'producao')
     OR (u.email = 'software@altave.test' AND u.cargo = 'software'))
   AND u.time_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM `time` t WHERE t.nome_time = u.nome);

UPDATE usuario u
JOIN `time` t ON t.responsavel_id = u.id_usuario
SET u.time_id = t.id_time
WHERE u.time_id IS NULL
  AND u.email IN ('producao@altave.test', 'software@altave.test')
  AND t.nome_time = u.nome;

COMMIT;

