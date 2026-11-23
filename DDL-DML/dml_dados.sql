-- ============================================================
-- DML - Altave OS (dados fictícios)
-- PRESSUPÕE que o script.sql já foi executado: ele cria as tabelas e
-- insere os 4 usuários de demonstração (ids 1 a 4: gestor, comercial,
-- producao e software) e os 2 times Produção e Software (ids 1 e 2).
-- Este arquivo NÃO repete esses registros; ele continua a partir deles
-- (usuarios 5 a 60, times 3 a 12) e usa os ids 1 a 4 como referência.
--
-- Ordem: script.sql -> dml_dados.sql -> script2.sql
--
-- Totais finais (seed + este arquivo):
--   usuario 60 | time 12 (exceção: poucos times) | os 60 | os_anexo 50
-- Senhas dos usuários gerados (hash bcrypt reaproveitado):
--   gestor/superusuario = Gestor123!   comercial/implantacao = Comercial123!
--   producao/suporte    = Producao123! software/monitoramento = Software123!
-- ============================================================
USE atividade_bdr_2dsm;

START TRANSACTION;

-- 1) USUARIO (sem time: a FK usuario.time_id é preenchida no passo 3,
--    pois time e usuario referenciam um ao outro)
INSERT INTO usuario (id_usuario, nome, email, senha, cargo) VALUES
  (5, 'Diego Carvalho', 'diego.carvalho5@altave.test', '$2b$10$CvZ0UDKWoF1hPaVINFt6MOtHvNadulhyUqWmwUIl825.y9twNZ2Ka', 'superusuario'),
  (6, 'Sergio Santos', 'sergio.santos6@altave.test', '$2b$10$CvZ0UDKWoF1hPaVINFt6MOtHvNadulhyUqWmwUIl825.y9twNZ2Ka', 'gestor'),
  (7, 'Renato Rodrigues', 'renato.rodrigues7@altave.test', '$2b$10$CvZ0UDKWoF1hPaVINFt6MOtHvNadulhyUqWmwUIl825.y9twNZ2Ka', 'gestor'),
  (8, 'Renato Araujo', 'renato.araujo8@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (9, 'Beatriz Barbosa', 'beatriz.barbosa9@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (10, 'Thiago Ribeiro', 'thiago.ribeiro10@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (11, 'Helena Silva', 'helena.silva11@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (12, 'Yasmin Oliveira', 'yasmin.oliveira12@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (13, 'Diego Nascimento', 'diego.nascimento13@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (14, 'Gustavo Santos', 'gustavo.santos14@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (15, 'Paulo Silva', 'paulo.silva15@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (16, 'Gustavo Barbosa', 'gustavo.barbosa16@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (17, 'Camila Carvalho', 'camila.carvalho17@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (18, 'Gabriel Martins', 'gabriel.martins18@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (19, 'Igor Gomes', 'igor.gomes19@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (20, 'Aline Gomes', 'aline.gomes20@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (21, 'Beatriz Martins', 'beatriz.martins21@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'comercial'),
  (22, 'Larissa Oliveira', 'larissa.oliveira22@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (23, 'Larissa Carvalho', 'larissa.carvalho23@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (24, 'Carla Nascimento', 'carla.nascimento24@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (25, 'Juliana Ribeiro', 'juliana.ribeiro25@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (26, 'Eduardo Nascimento', 'eduardo.nascimento26@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (27, 'Ana Gomes', 'ana.gomes27@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (28, 'Marina Ribeiro', 'marina.ribeiro28@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (29, 'Olivia Oliveira', 'olivia.oliveira29@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (30, 'Nicolas Barbosa', 'nicolas.barbosa30@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'suporte'),
  (31, 'Patricia Santos', 'patricia.santos31@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (32, 'Olivia Barbosa', 'olivia.barbosa32@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (33, 'Nicolas Almeida', 'nicolas.almeida33@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (34, 'Patricia Araujo', 'patricia.araujo34@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (35, 'Vitor Barbosa', 'vitor.barbosa35@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (36, 'Sergio Silva', 'sergio.silva36@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (37, 'Vitor Rodrigues', 'vitor.rodrigues37@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (38, 'Thiago Lima', 'thiago.lima38@altave.test', '$2b$10$YAz9JumG9lzikXKZHi97u.L8Pj0iODL.du1gFd3QI2W1B3wuseTQe', 'producao'),
  (39, 'Gustavo Souza', 'gustavo.souza39@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (40, 'Felipe Santos', 'felipe.santos40@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (41, 'Felipe Araujo', 'felipe.araujo41@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (42, 'Rafaela Lima', 'rafaela.lima42@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (43, 'Rafaela Rodrigues', 'rafaela.rodrigues43@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (44, 'Rodrigo Ribeiro', 'rodrigo.ribeiro44@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (45, 'Camila Barbosa', 'camila.barbosa45@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (46, 'Felipe Almeida', 'felipe.almeida46@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'software'),
  (47, 'Tatiana Martins', 'tatiana.martins47@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (48, 'Camila Nascimento', 'camila.nascimento48@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (49, 'Tatiana Barbosa', 'tatiana.barbosa49@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (50, 'Olivia Costa', 'olivia.costa50@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (51, 'Juliana Almeida', 'juliana.almeida51@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (52, 'Ana Souza', 'ana.souza52@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (53, 'Eduardo Ribeiro', 'eduardo.ribeiro53@altave.test', '$2b$10$HDmtF1WPtT4E9Yh2b5.w9.eyEurnyE5qCGAVvK9ioZCvIOaJj5e0S', 'implantacao'),
  (54, 'Marina Costa', 'marina.costa54@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento'),
  (55, 'Igor Barbosa', 'igor.barbosa55@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento'),
  (56, 'Paulo Barbosa', 'paulo.barbosa56@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento'),
  (57, 'Beatriz Araujo', 'beatriz.araujo57@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento'),
  (58, 'Tatiana Souza', 'tatiana.souza58@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento'),
  (59, 'Gustavo Nascimento', 'gustavo.nascimento59@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento'),
  (60, 'Lucas Ribeiro', 'lucas.ribeiro60@altave.test', '$2b$10$kJc70PxtRTWVt9Idt6OwY.z8T2ElVuMaHIM41dcVsKav7nODWyY7W', 'monitoramento');

-- 2) TIME (o trigger exige responsavel_id no INSERT)
INSERT INTO `time` (id_time, nome_time, email_time, departamento, responsavel_id) VALUES
  (3, 'Suporte', 'suporte@times.altave.test', 'Atendimento', 22),
  (4, 'Implantação', 'implantacao@times.altave.test', 'Operações', 47),
  (5, 'Monitoramento', 'monitoramento@times.altave.test', 'Operações', 54),
  (6, 'Qualidade', 'qualidade@times.altave.test', 'Produção', 31),
  (7, 'Manutenção', 'manutencao@times.altave.test', 'Produção', 32),
  (8, 'Infraestrutura', 'infraestrutura@times.altave.test', 'Tecnologia', 39),
  (9, 'Banco de Dados', 'bancodedados@times.altave.test', 'Tecnologia', 40),
  (10, 'Redes', 'redes@times.altave.test', 'Atendimento', 23),
  (11, 'Engenharia', 'engenharia@times.altave.test', 'Produção', 33),
  (12, 'Logística', 'logistica@times.altave.test', 'Operações', 48);

-- 3) Vincula cada usuário ao seu time (líder incluído)
UPDATE usuario SET time_id = 1 WHERE id_usuario IN (34, 38);
UPDATE usuario SET time_id = 2 WHERE id_usuario IN (41, 44);
UPDATE usuario SET time_id = 3 WHERE id_usuario IN (22, 24, 26, 28, 30);
UPDATE usuario SET time_id = 4 WHERE id_usuario IN (47, 49, 51, 53);
UPDATE usuario SET time_id = 5 WHERE id_usuario IN (54, 55, 56, 57, 58, 59, 60);
UPDATE usuario SET time_id = 6 WHERE id_usuario IN (31, 35);
UPDATE usuario SET time_id = 7 WHERE id_usuario IN (32, 36);
UPDATE usuario SET time_id = 8 WHERE id_usuario IN (39, 42, 45);
UPDATE usuario SET time_id = 9 WHERE id_usuario IN (40, 43, 46);
UPDATE usuario SET time_id = 10 WHERE id_usuario IN (23, 25, 27, 29);
UPDATE usuario SET time_id = 11 WHERE id_usuario IN (33, 37);
UPDATE usuario SET time_id = 12 WHERE id_usuario IN (48, 50, 52);

-- 4) OS (responsável sempre do cargo Comercial, como exigem os triggers)
INSERT INTO os (os_id, os_titulo, os_descricao, os_status, prioridade, data_limite, data_criacao, id_criador, id_time_responsavel, id_usuario_responsavel) VALUES
  (1, 'Implantação de sistema - Almoxarifado', 'Solicitação #1: implantação de sistema em almoxarifado. Registrar evidências e informar o comercial responsável ao final.', 'bloqueado', 'media', '2026-10-30', '2026-10-04 13:24:00', 15, 1, 15),
  (2, 'Reparo de fonte - Cliente Beta', 'Solicitação #2: reparo de fonte em cliente beta. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'baixa', '2026-11-13', '2026-09-18 07:06:00', 21, 2, 21),
  (3, 'Revisão de painel - Galpão B', 'Solicitação #3: revisão de painel em galpão b. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'baixa', '2026-09-28', '2026-08-07 12:41:00', 21, 3, 21),
  (4, 'Migração de dados - Unidade Sul', 'Solicitação #4: migração de dados em unidade sul. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'critica', '2026-09-21', '2026-08-04 15:30:00', 6, 4, 17),
  (5, 'Configuração de gateway - Linha 2', 'Solicitação #5: configuração de gateway em linha 2. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'media', '2026-11-16', '2026-09-11 08:31:00', 16, 5, 16),
  (6, 'Auditoria de qualidade - Setor de testes', 'Solicitação #6: auditoria de qualidade em setor de testes. Registrar evidências e informar o comercial responsável ao final.', 'review', 'alta', '2026-11-11', '2026-08-20 16:33:00', 16, 6, 16),
  (7, 'Calibração de equipamento - Cliente Gama', 'Solicitação #7: calibração de equipamento em cliente gama. Registrar evidências e informar o comercial responsável ao final.', 'review', 'critica', '2026-10-13', '2026-09-28 16:14:00', 15, 7, 15),
  (8, 'Treinamento de operadores - Sala de controle', 'Solicitação #8: treinamento de operadores em sala de controle. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'baixa', '2026-09-03', '2026-08-05 10:41:00', 7, 8, 2),
  (9, 'Atualização de firmware - Cliente Alfa', 'Solicitação #9: atualização de firmware em cliente alfa. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'baixa', '2026-12-04', '2026-09-27 17:12:00', 18, 9, 18),
  (10, 'Ajuste de parâmetros - Galpão A', 'Solicitação #10: ajuste de parâmetros em galpão a. Registrar evidências e informar o comercial responsável ao final.', 'teste', 'media', '2026-09-20', '2026-08-17 17:33:00', 19, 10, 19),
  (11, 'Troca de módulo - Unidade Norte', 'Solicitação #11: troca de módulo em unidade norte. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'alta', '2026-09-20', '2026-08-21 17:54:00', 13, 11, 13),
  (12, 'Substituição de cabo - Linha 1', 'Solicitação #12: substituição de cabo em linha 1. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'alta', '2026-11-12', '2026-09-24 15:26:00', 1, 12, 11),
  (13, 'Manutenção preventiva - Almoxarifado', 'Solicitação #13: manutenção preventiva em almoxarifado. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'critica', '2026-11-01', '2026-08-23 11:29:00', 19, 1, 19),
  (14, 'Diagnóstico de falha - Cliente Beta', 'Solicitação #14: diagnóstico de falha em cliente beta. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'critica', '2026-10-24', '2026-09-06 14:11:00', 15, 2, 15),
  (15, 'Instalação de sensor - Galpão B', 'Solicitação #15: instalação de sensor em galpão b. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'baixa', '2026-11-07', '2026-09-26 08:33:00', 20, 3, 20),
  (16, 'Implantação de sistema - Unidade Sul', 'Solicitação #16: implantação de sistema em unidade sul. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'alta', '2026-11-24', '2026-11-17 10:14:00', 6, 4, 8),
  (17, 'Reparo de fonte - Linha 2', 'Solicitação #17: reparo de fonte em linha 2. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'alta', '2026-10-22', '2026-09-22 15:50:00', 2, 5, 2),
  (18, 'Revisão de painel - Setor de testes', 'Solicitação #18: revisão de painel em setor de testes. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'alta', '2026-12-21', '2026-11-17 09:22:00', 8, 6, 8),
  (19, 'Migração de dados - Cliente Gama', 'Solicitação #19: migração de dados em cliente gama. Registrar evidências e informar o comercial responsável ao final.', 'bloqueado', 'alta', '2026-11-14', '2026-10-11 16:46:00', 16, 7, 16),
  (20, 'Configuração de gateway - Sala de controle', 'Solicitação #20: configuração de gateway em sala de controle. Registrar evidências e informar o comercial responsável ao final.', 'teste', 'baixa', '2026-11-04', '2026-10-12 11:42:00', 6, 8, 8),
  (21, 'Auditoria de qualidade - Cliente Alfa', 'Solicitação #21: auditoria de qualidade em cliente alfa. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'alta', '2026-10-09', '2026-09-25 09:06:00', 19, 9, 19),
  (22, 'Calibração de equipamento - Galpão A', 'Solicitação #22: calibração de equipamento em galpão a. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'alta', '2026-11-21', '2026-11-01 09:41:00', 15, 10, 15),
  (23, 'Treinamento de operadores - Unidade Norte', 'Solicitação #23: treinamento de operadores em unidade norte. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'alta', '2026-09-20', '2026-09-05 16:53:00', 11, 11, 11),
  (24, 'Atualização de firmware - Linha 1', 'Solicitação #24: atualização de firmware em linha 1. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'alta', '2026-09-05', '2026-08-21 11:16:00', 6, 12, 2),
  (25, 'Ajuste de parâmetros - Almoxarifado', 'Solicitação #25: ajuste de parâmetros em almoxarifado. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'baixa', '2026-10-12', '2026-09-23 07:03:00', 10, 1, 10),
  (26, 'Troca de módulo - Cliente Beta', 'Solicitação #26: troca de módulo em cliente beta. Registrar evidências e informar o comercial responsável ao final.', 'teste', 'critica', '2026-10-30', '2026-09-09 08:06:00', 12, 2, 12),
  (27, 'Substituição de cabo - Galpão B', 'Solicitação #27: substituição de cabo em galpão b. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'critica', '2026-10-28', '2026-10-17 17:41:00', 21, 3, 21),
  (28, 'Manutenção preventiva - Unidade Sul', 'Solicitação #28: manutenção preventiva em unidade sul. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'baixa', '2026-11-15', '2026-09-10 16:13:00', 7, 4, 13),
  (29, 'Diagnóstico de falha - Linha 2', 'Solicitação #29: diagnóstico de falha em linha 2. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'alta', '2026-12-05', '2026-10-27 12:55:00', 13, 5, 13),
  (30, 'Instalação de sensor - Setor de testes', 'Solicitação #30: instalação de sensor em setor de testes. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'alta', '2026-11-24', '2026-11-13 12:03:00', 11, 6, 11),
  (31, 'Implantação de sistema - Cliente Gama', 'Solicitação #31: implantação de sistema em cliente gama. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'baixa', '2026-11-06', '2026-09-07 08:19:00', 12, 7, 12),
  (32, 'Reparo de fonte - Sala de controle', 'Solicitação #32: reparo de fonte em sala de controle. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'media', '2026-10-23', '2026-10-09 12:12:00', 1, 8, 18),
  (33, 'Revisão de painel - Cliente Alfa', 'Solicitação #33: revisão de painel em cliente alfa. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'alta', '2026-10-30', '2026-10-19 08:07:00', 9, 9, 9),
  (34, 'Migração de dados - Galpão A', 'Solicitação #34: migração de dados em galpão a. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'critica', '2026-11-30', '2026-10-16 17:41:00', 2, 10, 2),
  (35, 'Configuração de gateway - Unidade Norte', 'Solicitação #35: configuração de gateway em unidade norte. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'critica', '2026-12-13', '2026-10-14 09:22:00', 13, 11, 13),
  (36, 'Auditoria de qualidade - Linha 1', 'Solicitação #36: auditoria de qualidade em linha 1. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'baixa', '2026-10-31', '2026-08-31 13:42:00', 1, 12, 9),
  (37, 'Calibração de equipamento - Almoxarifado', 'Solicitação #37: calibração de equipamento em almoxarifado. Registrar evidências e informar o comercial responsável ao final.', 'bloqueado', 'alta', '2026-12-20', '2026-10-24 15:43:00', 21, 1, 21),
  (38, 'Treinamento de operadores - Cliente Beta', 'Solicitação #38: treinamento de operadores em cliente beta. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'alta', '2026-11-18', '2026-11-09 09:14:00', 2, 2, 2),
  (39, 'Atualização de firmware - Galpão B', 'Solicitação #39: atualização de firmware em galpão b. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'media', '2026-11-18', '2026-10-09 14:26:00', 12, 3, 12),
  (40, 'Ajuste de parâmetros - Unidade Sul', 'Solicitação #40: ajuste de parâmetros em unidade sul. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'alta', '2026-11-18', '2026-10-20 16:05:00', 1, 4, 15),
  (41, 'Troca de módulo - Linha 2', 'Solicitação #41: troca de módulo em linha 2. Registrar evidências e informar o comercial responsável ao final.', 'review', 'baixa', '2026-10-30', '2026-09-13 17:33:00', 2, 5, 2),
  (42, 'Substituição de cabo - Setor de testes', 'Solicitação #42: substituição de cabo em setor de testes. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'media', '2026-11-17', '2026-10-20 10:30:00', 17, 6, 17),
  (43, 'Manutenção preventiva - Cliente Gama', 'Solicitação #43: manutenção preventiva em cliente gama. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'media', '2026-12-27', '2026-11-04 13:45:00', 19, 7, 19),
  (44, 'Diagnóstico de falha - Sala de controle', 'Solicitação #44: diagnóstico de falha em sala de controle. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'critica', '2026-11-12', '2026-10-11 11:21:00', 6, 8, 12),
  (45, 'Instalação de sensor - Cliente Alfa', 'Solicitação #45: instalação de sensor em cliente alfa. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'alta', '2026-12-27', '2026-10-21 14:35:00', 21, 9, 21),
  (46, 'Implantação de sistema - Galpão A', 'Solicitação #46: implantação de sistema em galpão a. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'critica', '2026-10-23', '2026-08-25 09:40:00', 9, 10, 9),
  (47, 'Reparo de fonte - Unidade Norte', 'Solicitação #47: reparo de fonte em unidade norte. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'baixa', '2027-01-21', '2026-11-23 07:22:00', 19, 11, 19),
  (48, 'Revisão de painel - Linha 1', 'Solicitação #48: revisão de painel em linha 1. Registrar evidências e informar o comercial responsável ao final.', 'teste', 'alta', '2026-11-13', '2026-10-21 09:05:00', 7, 12, 15),
  (49, 'Migração de dados - Almoxarifado', 'Solicitação #49: migração de dados em almoxarifado. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'alta', '2026-08-27', '2026-08-18 08:57:00', 15, 4, 15),
  (50, 'Configuração de gateway - Cliente Beta', 'Solicitação #50: configuração de gateway em cliente beta. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'media', '2026-12-07', '2026-10-13 07:25:00', 15, 9, 15),
  (51, 'Auditoria de qualidade - Galpão B', 'Solicitação #51: auditoria de qualidade em galpão b. Registrar evidências e informar o comercial responsável ao final.', 'review', 'alta', '2026-10-30', '2026-10-05 08:05:00', 18, 7, 18),
  (52, 'Calibração de equipamento - Unidade Sul', 'Solicitação #52: calibração de equipamento em unidade sul. Registrar evidências e informar o comercial responsável ao final.', 'em andamento', 'media', '2026-10-22', '2026-10-10 11:19:00', 7, 11, 18),
  (53, 'Treinamento de operadores - Linha 2', 'Solicitação #53: treinamento de operadores em linha 2. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'critica', '2026-10-03', '2026-08-21 11:18:00', 12, 3, 12),
  (54, 'Atualização de firmware - Setor de testes', 'Solicitação #54: atualização de firmware em setor de testes. Registrar evidências e informar o comercial responsável ao final.', 'teste', 'media', '2026-11-11', '2026-08-25 17:00:00', 12, 9, 12),
  (55, 'Ajuste de parâmetros - Cliente Gama', 'Solicitação #55: ajuste de parâmetros em cliente gama. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'media', '2026-11-30', '2026-11-01 15:01:00', 12, 9, 12),
  (56, 'Troca de módulo - Sala de controle', 'Solicitação #56: troca de módulo em sala de controle. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'baixa', '2026-09-11', '2026-08-21 07:56:00', 7, 12, 15),
  (57, 'Substituição de cabo - Cliente Alfa', 'Solicitação #57: substituição de cabo em cliente alfa. Registrar evidências e informar o comercial responsável ao final.', 'concluida', 'media', '2027-01-09', '2026-11-16 12:04:00', 11, 4, 11),
  (58, 'Manutenção preventiva - Galpão A', 'Solicitação #58: manutenção preventiva em galpão a. Registrar evidências e informar o comercial responsável ao final.', 'aberta', 'critica', '2026-11-08', '2026-10-16 16:15:00', 8, 6, 8),
  (59, 'Diagnóstico de falha - Unidade Norte', 'Solicitação #59: diagnóstico de falha em unidade norte. Registrar evidências e informar o comercial responsável ao final.', 'bloqueado', 'baixa', '2026-09-23', '2026-08-14 08:24:00', 16, 5, 16),
  (60, 'Instalação de sensor - Linha 1', 'Solicitação #60: instalação de sensor em linha 1. Registrar evidências e informar o comercial responsável ao final.', 'review', 'alta', '2026-11-21', '2026-09-14 14:58:00', 7, 4, 15);

-- 5) OS_ANEXO (conteúdo textual pequeno no campo MEDIUMBLOB)
INSERT INTO os_anexo (id_anexo, os_id, nome, conteudo) VALUES
  (1, 1, 'relatorio_teste_os1_1.txt', 'Anexo ficticio 1 da OS 1: relatorio teste.'),
  (2, 8, 'foto_instalacao_os8_2.txt', 'Anexo ficticio 2 da OS 8: foto instalacao.'),
  (3, 15, 'checklist_os15_3.txt', 'Anexo ficticio 3 da OS 15: checklist.'),
  (4, 22, 'laudo_tecnico_os22_4.txt', 'Anexo ficticio 4 da OS 22: laudo tecnico.'),
  (5, 29, 'termo_aceite_os29_5.txt', 'Anexo ficticio 5 da OS 29: termo aceite.'),
  (6, 36, 'relatorio_teste_os36_6.txt', 'Anexo ficticio 6 da OS 36: relatorio teste.'),
  (7, 43, 'foto_instalacao_os43_7.txt', 'Anexo ficticio 7 da OS 43: foto instalacao.'),
  (8, 50, 'checklist_os50_8.txt', 'Anexo ficticio 8 da OS 50: checklist.'),
  (9, 57, 'laudo_tecnico_os57_9.txt', 'Anexo ficticio 9 da OS 57: laudo tecnico.'),
  (10, 4, 'termo_aceite_os4_10.txt', 'Anexo ficticio 10 da OS 4: termo aceite.'),
  (11, 11, 'relatorio_teste_os11_11.txt', 'Anexo ficticio 11 da OS 11: relatorio teste.'),
  (12, 18, 'foto_instalacao_os18_12.txt', 'Anexo ficticio 12 da OS 18: foto instalacao.'),
  (13, 25, 'checklist_os25_13.txt', 'Anexo ficticio 13 da OS 25: checklist.'),
  (14, 32, 'laudo_tecnico_os32_14.txt', 'Anexo ficticio 14 da OS 32: laudo tecnico.'),
  (15, 39, 'termo_aceite_os39_15.txt', 'Anexo ficticio 15 da OS 39: termo aceite.'),
  (16, 46, 'relatorio_teste_os46_16.txt', 'Anexo ficticio 16 da OS 46: relatorio teste.'),
  (17, 53, 'foto_instalacao_os53_17.txt', 'Anexo ficticio 17 da OS 53: foto instalacao.'),
  (18, 60, 'checklist_os60_18.txt', 'Anexo ficticio 18 da OS 60: checklist.'),
  (19, 7, 'laudo_tecnico_os7_19.txt', 'Anexo ficticio 19 da OS 7: laudo tecnico.'),
  (20, 14, 'termo_aceite_os14_20.txt', 'Anexo ficticio 20 da OS 14: termo aceite.'),
  (21, 21, 'relatorio_teste_os21_21.txt', 'Anexo ficticio 21 da OS 21: relatorio teste.'),
  (22, 28, 'foto_instalacao_os28_22.txt', 'Anexo ficticio 22 da OS 28: foto instalacao.'),
  (23, 35, 'checklist_os35_23.txt', 'Anexo ficticio 23 da OS 35: checklist.'),
  (24, 42, 'laudo_tecnico_os42_24.txt', 'Anexo ficticio 24 da OS 42: laudo tecnico.'),
  (25, 49, 'termo_aceite_os49_25.txt', 'Anexo ficticio 25 da OS 49: termo aceite.'),
  (26, 56, 'relatorio_teste_os56_26.txt', 'Anexo ficticio 26 da OS 56: relatorio teste.'),
  (27, 3, 'foto_instalacao_os3_27.txt', 'Anexo ficticio 27 da OS 3: foto instalacao.'),
  (28, 10, 'checklist_os10_28.txt', 'Anexo ficticio 28 da OS 10: checklist.'),
  (29, 17, 'laudo_tecnico_os17_29.txt', 'Anexo ficticio 29 da OS 17: laudo tecnico.'),
  (30, 24, 'termo_aceite_os24_30.txt', 'Anexo ficticio 30 da OS 24: termo aceite.'),
  (31, 31, 'relatorio_teste_os31_31.txt', 'Anexo ficticio 31 da OS 31: relatorio teste.'),
  (32, 38, 'foto_instalacao_os38_32.txt', 'Anexo ficticio 32 da OS 38: foto instalacao.'),
  (33, 45, 'checklist_os45_33.txt', 'Anexo ficticio 33 da OS 45: checklist.'),
  (34, 52, 'laudo_tecnico_os52_34.txt', 'Anexo ficticio 34 da OS 52: laudo tecnico.'),
  (35, 59, 'termo_aceite_os59_35.txt', 'Anexo ficticio 35 da OS 59: termo aceite.'),
  (36, 6, 'relatorio_teste_os6_36.txt', 'Anexo ficticio 36 da OS 6: relatorio teste.'),
  (37, 13, 'foto_instalacao_os13_37.txt', 'Anexo ficticio 37 da OS 13: foto instalacao.'),
  (38, 20, 'checklist_os20_38.txt', 'Anexo ficticio 38 da OS 20: checklist.'),
  (39, 27, 'laudo_tecnico_os27_39.txt', 'Anexo ficticio 39 da OS 27: laudo tecnico.'),
  (40, 34, 'termo_aceite_os34_40.txt', 'Anexo ficticio 40 da OS 34: termo aceite.'),
  (41, 41, 'relatorio_teste_os41_41.txt', 'Anexo ficticio 41 da OS 41: relatorio teste.'),
  (42, 48, 'foto_instalacao_os48_42.txt', 'Anexo ficticio 42 da OS 48: foto instalacao.'),
  (43, 55, 'checklist_os55_43.txt', 'Anexo ficticio 43 da OS 55: checklist.'),
  (44, 2, 'laudo_tecnico_os2_44.txt', 'Anexo ficticio 44 da OS 2: laudo tecnico.'),
  (45, 9, 'termo_aceite_os9_45.txt', 'Anexo ficticio 45 da OS 9: termo aceite.'),
  (46, 16, 'relatorio_teste_os16_46.txt', 'Anexo ficticio 46 da OS 16: relatorio teste.'),
  (47, 23, 'foto_instalacao_os23_47.txt', 'Anexo ficticio 47 da OS 23: foto instalacao.'),
  (48, 30, 'checklist_os30_48.txt', 'Anexo ficticio 48 da OS 30: checklist.'),
  (49, 37, 'laudo_tecnico_os37_49.txt', 'Anexo ficticio 49 da OS 37: laudo tecnico.'),
  (50, 44, 'termo_aceite_os44_50.txt', 'Anexo ficticio 50 da OS 44: termo aceite.');

COMMIT;

-- Conferência rápida
SELECT 'usuario' AS tabela, COUNT(*) AS total FROM usuario
UNION ALL SELECT 'time', COUNT(*) FROM `time`
UNION ALL SELECT 'os', COUNT(*) FROM os
UNION ALL SELECT 'os_anexo', COUNT(*) FROM os_anexo;