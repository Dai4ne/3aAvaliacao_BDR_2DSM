-- VIEW PARA DETALHES DE OS
USE atividade_bdr_2dsm;

CREATE VIEW vw_os_detalhada AS
SELECT
    o.os_id,
    o.os_titulo,
    o.os_status,
    o.prioridade,
    o.data_limite,
    o.data_criacao,
    t.id_time,
    t.nome_time,
    t.departamento,
    c.nome AS criador,
    r.nome AS pessoa_responsavel
FROM os AS o
INNER JOIN `time` AS t ON t.id_time = o.id_time_responsavel
INNER JOIN usuario AS c ON c.id_usuario = o.id_criador
LEFT JOIN usuario AS r ON r.id_usuario = o.id_usuario_responsavel;


-- ---------------------------
-- STORED PROCEDURES

DELIMITER $$

-- 1. Cadastrar usuário
CREATE PROCEDURE sp_cadastrar_usuario(
    IN p_nome VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_senha_hash VARCHAR(255),
    IN p_cargo VARCHAR(20),
    IN p_time_id INT,
    OUT p_id_usuario INT
)
BEGIN
    IF p_cargo IS NULL
       OR p_cargo NOT IN ('gestor', 'comercial', 'producao', 'software') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cargo inválido para cadastro';
    END IF;

    IF p_senha_hash IS NULL
       OR p_senha_hash NOT REGEXP '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe um hash bcrypt no campo da senha';
    END IF;

    INSERT INTO usuario (nome, email, senha, cargo, time_id)
    VALUES (TRIM(p_nome), LOWER(TRIM(p_email)), p_senha_hash, p_cargo, p_time_id);

    SET p_id_usuario = LAST_INSERT_ID();
END$$

-- 2. Cadastrar time e vincular o primeiro membro
CREATE PROCEDURE sp_cadastrar_time(
    IN p_nome VARCHAR(100),
    IN p_departamento VARCHAR(100),
    IN p_responsavel_id INT,
    OUT p_id_time INT
)
BEGIN
    DECLARE v_time_atual INT;
    DECLARE v_usuario_encontrado BOOLEAN DEFAULT TRUE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_usuario_encontrado = FALSE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT time_id INTO v_time_atual
    FROM usuario
    WHERE id_usuario = p_responsavel_id
    FOR UPDATE;

    IF NOT v_usuario_encontrado THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Responsável não encontrado';
    END IF;

    IF v_time_atual IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O responsável já pertence a um time';
    END IF;

    INSERT INTO time (nome_time, departamento, responsavel_id)
    VALUES (TRIM(p_nome), TRIM(p_departamento), p_responsavel_id);

    SET p_id_time = LAST_INSERT_ID();

    UPDATE usuario
    SET time_id = p_id_time
    WHERE id_usuario = p_responsavel_id;

    COMMIT;
END$$

-- 3. Cadastrar ordem de serviço
CREATE PROCEDURE sp_cadastrar_os(
    IN p_titulo VARCHAR(150),
    IN p_descricao TEXT,
    IN p_prioridade VARCHAR(10),
    IN p_data_limite DATE,
    IN p_criador_id INT,
    IN p_time_id INT,
    IN p_pessoa_responsavel_id INT,
    OUT p_id_os INT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = p_criador_id
          AND cargo IN ('gestor', 'comercial', 'superusuario')
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O criador informado não pode abrir uma OS';
    END IF;

    IF p_prioridade IS NOT NULL
       AND p_prioridade NOT IN ('baixa', 'media', 'alta', 'critica') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Prioridade inválida';
    END IF;

    INSERT INTO os (
        os_titulo, os_descricao, prioridade, data_limite,
        id_criador, id_time_responsavel, id_usuario_responsavel
    )
    VALUES (
        TRIM(p_titulo), TRIM(p_descricao), COALESCE(p_prioridade, 'media'),
        p_data_limite, p_criador_id, p_time_id, p_pessoa_responsavel_id
    );

    SET p_id_os = LAST_INSERT_ID();
END$$

-- 4. Listar OS com filtros opcionais
CREATE PROCEDURE sp_listar_os(
    IN p_time_id INT,
    IN p_status VARCHAR(20),
    IN p_inicio DATE,
    IN p_fim DATE
)
BEGIN
    IF p_inicio IS NOT NULL AND p_fim IS NOT NULL AND p_inicio > p_fim THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A data inicial não pode ser posterior à final';
    END IF;

    SELECT *
    FROM vw_os_detalhada
    WHERE (p_time_id IS NULL OR id_time = p_time_id)
      AND (p_status IS NULL OR os_status = p_status)
      AND (p_inicio IS NULL OR data_limite >= p_inicio)
      AND (p_fim IS NULL OR data_limite <= p_fim)
    ORDER BY data_limite, os_id;
END$$

-- 5. Contar usuários por time com RIGHT JOIN e GROUP BY
CREATE PROCEDURE sp_resumo_usuarios_por_time()
BEGIN
    SELECT
        t.id_time,
        t.nome_time,
        t.departamento,
        COUNT(u.id_usuario) AS total_membros
    FROM usuario AS u
    RIGHT JOIN time AS t ON t.id_time = u.time_id
    GROUP BY t.id_time, t.nome_time, t.departamento
    ORDER BY total_membros DESC, t.nome_time;
END$$

-- 6. Gerar relatório de OS por time com um cursor
CREATE PROCEDURE sp_relatorio_times_cursor()
BEGIN
    DECLARE v_fim BOOLEAN DEFAULT FALSE;
    DECLARE v_id INT;
    DECLARE v_nome VARCHAR(100);

    DECLARE cur_times CURSOR FOR
        SELECT id_time, nome_time FROM time ORDER BY nome_time;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_fim = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DROP TEMPORARY TABLE IF EXISTS tmp_relatorio_os_times;
        RESIGNAL;
    END;

    CREATE TEMPORARY TABLE tmp_relatorio_os_times (
        id_time INT PRIMARY KEY,
        nome_time VARCHAR(100) NOT NULL,
        total_os BIGINT NOT NULL,
        concluidas BIGINT NOT NULL,
        atrasadas BIGINT NOT NULL
    );

    OPEN cur_times;

    ler_times: LOOP
        FETCH cur_times INTO v_id, v_nome;

        IF v_fim THEN
            LEAVE ler_times;
        END IF;

        INSERT INTO tmp_relatorio_os_times
            (id_time, nome_time, total_os, concluidas, atrasadas)
        SELECT
            v_id,
            v_nome,
            COUNT(*),
            COUNT(CASE WHEN os_status = 'concluida' THEN 1 END),
            COUNT(CASE
                WHEN os_status <> 'concluida' AND data_limite < CURRENT_DATE
                THEN 1
            END)
        FROM os
        WHERE id_time_responsavel = v_id;
    END LOOP;

    CLOSE cur_times;

    SELECT id_time, nome_time, total_os, concluidas, atrasadas
    FROM tmp_relatorio_os_times
    ORDER BY atrasadas DESC, nome_time;

    DROP TEMPORARY TABLE tmp_relatorio_os_times;
END$$

DELIMITER ;


-- ---------------------------
-- FUNCTIONS

DELIMITER $$

-- 1. Total de OS do time
CREATE FUNCTION fn_total_os_time(p_time_id INT)
RETURNS BIGINT
READS SQL DATA
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM os
        WHERE id_time_responsavel = p_time_id
    );
END$$

-- 2. Total de OS atrasadas
CREATE FUNCTION fn_os_atrasadas_time(p_time_id INT)
RETURNS BIGINT
READS SQL DATA
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM os
        WHERE id_time_responsavel = p_time_id
          AND os_status <> 'concluida'
          AND data_limite < CURRENT_DATE
    );
END$$

-- 3. Percentual de OS concluídas
CREATE FUNCTION fn_percentual_os_concluidas(p_time_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    RETURN (
        SELECT COALESCE(
            ROUND(
                100.0 * COUNT(CASE WHEN os_status = 'concluida' THEN 1 END)
                / NULLIF(COUNT(*), 0),
                2
            ),
            0.00
        )
        FROM os
        WHERE id_time_responsavel = p_time_id
    );
END$$

-- 4. Total de membros do time
CREATE FUNCTION fn_total_membros_time(p_time_id INT)
RETURNS BIGINT
READS SQL DATA
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM usuario
        WHERE time_id = p_time_id
    );
END$$

-- 5. Verificar se o usuário é responsável por algum time
CREATE FUNCTION fn_usuario_lidera_time(p_usuario_id INT)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM time
        WHERE responsavel_id = p_usuario_id
    );
END$$

-- 6. Dias restantes até a data do prazo
CREATE FUNCTION fn_dias_para_prazo(p_os_id INT)
RETURNS INT
READS SQL DATA
BEGIN
    RETURN (
        SELECT DATEDIFF(data_limite, CURRENT_DATE)
        FROM os
        WHERE os_id = p_os_id
    );
END$$

DELIMITER ;


-- ---------------------------
-- TRIGGERS

DELIMITER $$

-- 1. Padronizar nome e e-mail ao cadastrar usuário
CREATE TRIGGER trg_usuario_bi_normalizar
BEFORE INSERT ON usuario
FOR EACH ROW
BEGIN
    SET NEW.nome = TRIM(NEW.nome);
    SET NEW.email = LOWER(TRIM(NEW.email));

    IF NEW.nome IS NULL OR CHAR_LENGTH(NEW.nome) < 2
       OR NEW.email IS NULL OR NEW.email = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe um nome válido e um e-mail';
    END IF;
END$$

-- 2. Impedir a exclusão de um responsável por time
CREATE TRIGGER trg_usuario_bd_proteger_lider
BEFORE DELETE ON usuario
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM time
        WHERE responsavel_id = OLD.id_usuario
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Defina outro responsável pelo time antes de excluir este usuário';
    END IF;
END$$

-- 3. Exigir responsável na criação de um time
CREATE TRIGGER trg_time_bi_exigir_responsavel
BEFORE INSERT ON time
FOR EACH ROW
BEGIN
    IF NEW.responsavel_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O time precisa de uma pessoa responsável';
    END IF;
END$$

-- 4. Validar a troca do responsável de um time
CREATE TRIGGER trg_time_bu_validar_responsavel
BEFORE UPDATE ON time
FOR EACH ROW
BEGIN
    IF NOT (NEW.responsavel_id <=> OLD.responsavel_id) THEN
        IF NEW.responsavel_id IS NULL OR NOT EXISTS (
            SELECT 1
            FROM usuario
            WHERE id_usuario = NEW.responsavel_id
              AND time_id = OLD.id_time
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'O novo responsável precisa ser membro deste time';
        END IF;
    END IF;
END$$

-- 5. Validar uma nova ordem de serviço
CREATE TRIGGER trg_os_bi_validar_cadastro
BEFORE INSERT ON os
FOR EACH ROW
BEGIN
    IF NEW.os_titulo IS NULL OR CHAR_LENGTH(TRIM(NEW.os_titulo)) < 3
       OR NEW.os_descricao IS NULL OR TRIM(NEW.os_descricao) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe um título e uma descrição válidos para a OS';
    END IF;

    IF NEW.id_usuario_responsavel IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = NEW.id_usuario_responsavel
          AND cargo = 'comercial'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A pessoa responsável pela OS precisa ser do Comercial';
    END IF;

    IF NEW.id_usuario_responsavel IS NULL AND EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = NEW.id_criador
          AND cargo = 'comercial'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O Comercial precisa indicar uma pessoa responsável ao abrir a OS';
    END IF;
END$$

-- 6. Validar uma nova atribuição de responsável na OS
CREATE TRIGGER trg_os_bu_validar_responsavel
BEFORE UPDATE ON os
FOR EACH ROW
BEGIN
    IF NOT (NEW.id_usuario_responsavel <=> OLD.id_usuario_responsavel)
       AND NEW.id_usuario_responsavel IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM usuario
           WHERE id_usuario = NEW.id_usuario_responsavel
             AND cargo = 'comercial'
       ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A nova pessoa responsável pela OS precisa ser do Comercial';
    END IF;
END$$

DELIMITER ;