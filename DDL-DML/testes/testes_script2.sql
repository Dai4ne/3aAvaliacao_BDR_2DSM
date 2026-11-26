-- Altave OS | Roteiro de testes para o MySQL Workbench

USE atividade_bdr_2dsm;

SET @sufixo = LEFT(REPLACE(UUID(), '-', ''), 12);
-- Hash bcrypt de uma conta fictícia. Nenhum resultado exibe senhas.
SET @hash_teste = '$2b$10$CvZ0UDKWoF1hPaVINFt6MOtHvNadulhyUqWmwUIl825.y9twNZ2Ka';
SET @hoje = CURRENT_DATE;
SET @ontem = DATE_SUB(@hoje, INTERVAL 1 DAY);
SET @prazo_futuro = DATE_ADD(@hoje, INTERVAL 7 DAY);
SET @nome_time_teste = CONCAT('AAA Teste da avaliacao ', @sufixo);

-- A rotina auxiliar captura apenas a rejeição esperada (SQLSTATE 45000).
-- Se o comando for aceito ou a mensagem não for a esperada, aparece FALHOU.
DROP PROCEDURE IF EXISTS sp_aux_teste_sql_avaliacao;
DELIMITER $$
CREATE PROCEDURE sp_aux_teste_sql_avaliacao(
    IN p_teste VARCHAR(100),
    IN p_comando TEXT,
    IN p_mensagem_esperada VARCHAR(255)
)
BEGIN
    DECLARE v_mensagem VARCHAR(255) DEFAULT NULL;

    SET @sql_teste_avaliacao = p_comando;
    PREPARE comando_teste FROM @sql_teste_avaliacao;
    BEGIN
        DECLARE CONTINUE HANDLER FOR SQLSTATE '45000'
        BEGIN
            GET STACKED DIAGNOSTICS CONDITION 1 v_mensagem = MESSAGE_TEXT;
        END;
        EXECUTE comando_teste;
    END;
    DEALLOCATE PREPARE comando_teste;

    SELECT p_teste AS teste,
           IF(v_mensagem = p_mensagem_esperada, 'OK', 'FALHOU') AS resultado,
           COALESCE(v_mensagem, 'Comando aceito') AS mensagem_obtida,
           p_mensagem_esperada AS mensagem_esperada;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURES (01 a 06)
-- ============================================================

-- 01. sp_cadastrar_usuario
-- Esperado: usuário Comercial criado com o e-mail em minúsculas e sem time.
START TRANSACTION;
SET @id_usuario_proc = NULL;
SET @email_proc = CONCAT('PROC01.', @sufixo, '@ALTAVE.TEST');
CALL sp_cadastrar_usuario('  Comercial de teste  ', @email_proc,
    @hash_teste, 'comercial', NULL, @id_usuario_proc);
SELECT '01 - sp_cadastrar_usuario' AS teste,
       IF(nome = 'Comercial de teste' AND BINARY email = BINARY LOWER(@email_proc)
          AND cargo = 'comercial' AND time_id IS NULL, 'OK', 'FALHOU') AS resultado,
       id_usuario, nome, email, cargo, time_id
FROM usuario WHERE id_usuario = @id_usuario_proc;
ROLLBACK;

-- 02. sp_cadastrar_time
-- Esperado: o novo time referencia o responsável, e o usuário referencia o time.
-- A procedure faz COMMIT. Por isso este teste remove os registros que criou logo depois da consulta.
INSERT INTO usuario (nome, email, senha, cargo)
VALUES ('Lider da procedure', CONCAT('proc02.', @sufixo, '@altave.test'), @hash_teste, 'producao');
SET @lider_proc = LAST_INSERT_ID();
SET @time_proc = NULL;
CALL sp_cadastrar_time(CONCAT('Teste da procedure ', @sufixo), 'Produção', @lider_proc, @time_proc);
SELECT '02 - sp_cadastrar_time' AS teste,
       IF(t.responsavel_id = @lider_proc AND u.time_id = t.id_time, 'OK', 'FALHOU') AS resultado,
       t.id_time, t.nome_time, t.responsavel_id, u.time_id AS time_do_responsavel
FROM `time` AS t JOIN usuario AS u ON u.id_usuario = t.responsavel_id
WHERE t.id_time = @time_proc;

START TRANSACTION;
DELETE FROM `time` WHERE id_time = @time_proc;
DELETE FROM usuario WHERE id_usuario = @lider_proc;
COMMIT;

-- Prepara registros independentes dos dados cadastrados na aplicação.
-- Os testes 03 a 18 usam estes registros e terminam com ROLLBACK.
START TRANSACTION;
INSERT INTO usuario (nome, email, senha, cargo)
VALUES ('Lider de teste', CONCAT('lider.', @sufixo, '@altave.test'), @hash_teste, 'producao');
SET @lider = LAST_INSERT_ID();
INSERT INTO usuario (nome, email, senha, cargo)
VALUES ('Membro de teste', CONCAT('membro.', @sufixo, '@altave.test'), @hash_teste, 'producao');
SET @membro = LAST_INSERT_ID();
INSERT INTO usuario (nome, email, senha, cargo)
VALUES ('Comercial de teste', CONCAT('comercial.', @sufixo, '@altave.test'), @hash_teste, 'comercial');
SET @comercial = LAST_INSERT_ID();
INSERT INTO `time` (nome_time, departamento, responsavel_id)
VALUES (@nome_time_teste, 'Produção', @lider);
SET @time = LAST_INSERT_ID();
UPDATE usuario SET time_id = @time WHERE id_usuario IN (@lider, @membro);

-- 03. sp_cadastrar_os
-- Esperado: OS aberta, prioridade media por padrão, time e responsável registrados.
CALL sp_cadastrar_os('OS de teste vencida', 'Teste de cadastro', NULL, @ontem,
    @comercial, @time, @comercial, @os_atrasada);
SELECT '03 - sp_cadastrar_os' AS teste,
       IF(os_status = 'aberta' AND prioridade = 'media'
          AND id_time_responsavel = @time AND id_usuario_responsavel = @comercial,
          'OK', 'FALHOU') AS resultado,
       os_id, os_titulo, os_status, prioridade, id_time_responsavel, id_usuario_responsavel
FROM os WHERE os_id = @os_atrasada;

-- Acrescenta uma OS concluída com prazo passado e outra aberta com prazo futuro.
INSERT INTO os (os_titulo, os_descricao, os_status, data_limite,
    id_criador, id_time_responsavel, id_usuario_responsavel)
VALUES ('OS de teste concluida', 'Prazo vencido, mas já concluída', 'concluida', @ontem,
    @comercial, @time, @comercial);
SET @os_concluida = LAST_INSERT_ID();
INSERT INTO os (os_titulo, os_descricao, os_status, data_limite,
    id_criador, id_time_responsavel, id_usuario_responsavel)
VALUES ('OS de teste futura', 'Prazo daqui a sete dias', 'aberta', @prazo_futuro,
    @comercial, @time, @comercial);
SET @os_futura = LAST_INSERT_ID();

-- 04. sp_listar_os
-- Esperado no primeiro CALL: duas OS abertas do time, sem restringir o prazo.
-- Esperado no segundo CALL: somente a OS futura. NULL ignora o filtro de status.
SELECT '04 - sp_listar_os (time e status)' AS teste, '2 OS abertas' AS esperado;
CALL sp_listar_os(@time, 'aberta', NULL, NULL);
SELECT '04 - sp_listar_os (time e prazo)' AS teste, '1 OS futura' AS esperado;
CALL sp_listar_os(@time, NULL, @hoje, @prazo_futuro);

-- 05. sp_resumo_usuarios_por_time
-- Esperado: a linha do time de teste mostra 2 membros.
SELECT '05 - sp_resumo_usuarios_por_time' AS teste, @nome_time_teste AS time_para_localizar, 2 AS membros_esperados;
CALL sp_resumo_usuarios_por_time();

-- 06. sp_relatorio_times_cursor
-- Esperado: o relatório mostra 3 OS, 1 concluída e 1 atrasada no time de teste.
SELECT '06 - sp_relatorio_times_cursor' AS teste, @nome_time_teste AS time_para_localizar,
       3 AS total_esperado, 1 AS concluidas_esperadas, 1 AS atrasadas_esperadas;
CALL sp_relatorio_times_cursor();

-- ============================================================
-- FUNCTIONS (07 a 12)
-- ============================================================

-- 07. Total de OS do time: duas abertas e uma concluída.
SET @obtido = fn_total_os_time(@time);
SELECT '07 - fn_total_os_time' AS teste, 3 AS esperado, @obtido AS obtido,
       IF(@obtido = 3, 'OK', 'FALHOU') AS resultado;

-- 08. OS atrasadas: a OS concluída com prazo passado fica fora da contagem.
SET @obtido = fn_os_atrasadas_time(@time);
SELECT '08 - fn_os_atrasadas_time' AS teste, 1 AS esperado, @obtido AS obtido,
       IF(@obtido = 1, 'OK', 'FALHOU') AS resultado;

-- 09. Percentual de conclusão: 1 concluída de 3, arredondado para 33,33%.
SET @obtido = fn_percentual_os_concluidas(@time);
SELECT '09 - fn_percentual_os_concluidas' AS teste, 33.33 AS esperado, @obtido AS obtido,
       IF(@obtido = 33.33, 'OK', 'FALHOU') AS resultado;

-- 10. Membros do time: responsável e membro. O Comercial não pertence ao time.
SET @obtido = fn_total_membros_time(@time);
SELECT '10 - fn_total_membros_time' AS teste, 2 AS esperado, @obtido AS obtido,
       IF(@obtido = 2, 'OK', 'FALHOU') AS resultado;

-- 11. A função retorna 1 para o responsável e 0 para um membro sem liderança.
SET @obtido_lider = fn_usuario_lidera_time(@lider);
SET @obtido_membro = fn_usuario_lidera_time(@membro);
SELECT '11 - fn_usuario_lidera_time' AS teste,
       1 AS esperado_lider, @obtido_lider AS obtido_lider,
       0 AS esperado_membro, @obtido_membro AS obtido_membro,
       IF(@obtido_lider = 1 AND @obtido_membro = 0, 'OK', 'FALHOU') AS resultado;

-- 12. A OS futura vence em 7 dias. A OS vencida retorna -1.
SET @obtido_futuro = fn_dias_para_prazo(@os_futura);
SET @obtido_passado = fn_dias_para_prazo(@os_atrasada);
SELECT '12 - fn_dias_para_prazo' AS teste,
       7 AS esperado_futuro, @obtido_futuro AS obtido_futuro,
       -1 AS esperado_passado, @obtido_passado AS obtido_passado,
       IF(@obtido_futuro = 7 AND @obtido_passado = -1, 'OK', 'FALHOU') AS resultado;

-- ============================================================
-- TRIGGERS (13 a 18)
-- ============================================================

-- 13. O INSERT direto demonstra que foi o trigger que normalizou nome e e-mail.
SET @email_misto = CONCAT('  ExEMPLO.', @sufixo, '@ALTAVE.TEST  ');
INSERT INTO usuario (nome, email, senha, cargo)
VALUES ('  Usuario para normalizar  ', @email_misto, @hash_teste, 'software');
SET @normalizado = LAST_INSERT_ID();
SELECT '13 - trg_usuario_bi_normalizar' AS teste,
       IF(BINARY nome = BINARY 'Usuario para normalizar'
          AND BINARY email = BINARY LOWER(TRIM(@email_misto)), 'OK', 'FALHOU') AS resultado,
       nome AS nome_gravado, email AS email_gravado
FROM usuario WHERE id_usuario = @normalizado;

-- 14. Tenta apagar o usuário que ainda é responsável pelo time.
CALL sp_aux_teste_sql_avaliacao(
    '14 - trg_usuario_bd_proteger_lider',
    'DELETE FROM usuario WHERE id_usuario = @lider',
    'Defina outro responsável pelo time antes de excluir este usuário'
);

-- 15. Tenta criar um time sem definir uma pessoa responsável.
CALL sp_aux_teste_sql_avaliacao(
    '15 - trg_time_bi_exigir_responsavel',
    'INSERT INTO `time` (nome_time, departamento, responsavel_id)
     VALUES (CONCAT(''Time invalido '', @sufixo), ''Software'', NULL)',
    'O time precisa de uma pessoa responsável'
);

-- 16. Tenta indicar um usuário que não faz parte do time como novo responsável.
CALL sp_aux_teste_sql_avaliacao(
    '16 - trg_time_bu_validar_responsavel',
    'UPDATE `time` SET responsavel_id = @comercial WHERE id_time = @time',
    'O novo responsável precisa ser membro deste time'
);

-- 17. Tenta criar uma OS indicando um responsável de Produção em vez de Comercial.
CALL sp_aux_teste_sql_avaliacao(
    '17 - trg_os_bi_validar_cadastro',
    'INSERT INTO os (os_titulo, os_descricao, data_limite, id_criador,
                     id_time_responsavel, id_usuario_responsavel)
     VALUES (''OS de teste invalida'', ''Teste de responsável'', @hoje,
             @comercial, @time, @membro)',
    'A pessoa responsável pela OS precisa ser do Comercial'
);

-- 18. Tenta trocar o responsável Comercial de uma OS existente por um de Produção.
CALL sp_aux_teste_sql_avaliacao(
    '18 - trg_os_bu_validar_responsavel',
    'UPDATE os SET id_usuario_responsavel = @membro WHERE os_id = @os_futura',
    'A nova pessoa responsável pela OS precisa ser do Comercial'
);

-- Remove os dados do bloco 03 a 18 e a rotina auxiliar usada apenas nos testes.
ROLLBACK;
DROP PROCEDURE sp_aux_teste_sql_avaliacao;
SELECT 'Limpeza dos testes' AS etapa,
       (SELECT COUNT(*) FROM usuario WHERE email LIKE CONCAT('%.', @sufixo, '@altave.test')) AS usuarios_restantes,
       (SELECT COUNT(*) FROM `time` WHERE nome_time LIKE CONCAT('%', @sufixo)) AS times_restantes,
       (SELECT COUNT(*) FROM os WHERE os_id IN (@os_atrasada, @os_concluida, @os_futura)) AS os_restantes;
