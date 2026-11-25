USE atividade_bdr_2dsm;

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
