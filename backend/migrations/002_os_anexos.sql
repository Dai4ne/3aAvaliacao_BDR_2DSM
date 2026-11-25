USE atividade_bdr_2dsm;

CREATE TABLE IF NOT EXISTS os_anexo (
  id_anexo INT PRIMARY KEY AUTO_INCREMENT,
  os_id    INT NOT NULL,
  nome     VARCHAR(255) NOT NULL,
  conteudo MEDIUMBLOB NOT NULL,
  CONSTRAINT fk_os_anexo_os
    FOREIGN KEY (os_id) REFERENCES os(os_id) ON DELETE CASCADE
) ENGINE=InnoDB;
