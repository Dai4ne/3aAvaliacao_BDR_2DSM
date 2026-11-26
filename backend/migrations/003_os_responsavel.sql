-- Adiciona à OS a pessoa responsável pelo acompanhamento, além do time executor.
USE atividade_bdr_2dsm;

ALTER TABLE os
  ADD COLUMN id_usuario_responsavel INT NULL,
  ADD CONSTRAINT fk_os_usuario_responsavel
    FOREIGN KEY (id_usuario_responsavel) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL;
