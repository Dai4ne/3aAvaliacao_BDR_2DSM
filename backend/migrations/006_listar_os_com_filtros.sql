USE atividade_bdr_2dsm;

-- A view reúne os dados exibidos na lista e os vínculos usados no controle de acesso.
CREATE OR REPLACE VIEW vw_os_detalhada AS
SELECT
    o.os_id, o.os_titulo, o.os_status, o.prioridade, o.data_limite, o.data_criacao,
    t.id_time, t.nome_time, t.departamento,
    c.nome AS criador, r.nome AS pessoa_responsavel,
    o.os_descricao, o.id_criador, o.id_usuario_responsavel,
    r.cargo AS responsavel_cargo, t.responsavel_id AS id_lider_time
FROM os AS o
INNER JOIN `time` AS t ON t.id_time = o.id_time_responsavel
INNER JOIN usuario AS c ON c.id_usuario = o.id_criador
LEFT JOIN usuario AS r ON r.id_usuario = o.id_usuario_responsavel;

DELIMITER $$

-- NULL ignora o filtro. A API só informa o usuário nos perfis com acesso restrito.
CREATE PROCEDURE IF NOT EXISTS sp_listar_os_app(
    IN p_time_id INT,
    IN p_status VARCHAR(20),
    IN p_inicio DATE,
    IN p_fim DATE,
    IN p_prioridade VARCHAR(10),
    IN p_usuario_restrito INT
)
READS SQL DATA
BEGIN
    IF p_inicio IS NOT NULL AND p_fim IS NOT NULL AND p_inicio > p_fim THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O prazo inicial não pode ser posterior ao final';
    END IF;

    SELECT os_id, os_titulo, os_descricao, os_status, prioridade, data_limite,
           data_criacao, id_criador, id_time AS id_time_responsavel,
           id_usuario_responsavel, pessoa_responsavel AS responsavel_nome,
           responsavel_cargo, id_lider_time, criador AS criador_nome, nome_time AS time_nome
    FROM vw_os_detalhada
    WHERE (p_time_id IS NULL OR id_time = p_time_id)
      AND (p_status IS NULL OR os_status = p_status)
      AND (p_inicio IS NULL OR data_limite >= p_inicio)
      AND (p_fim IS NULL OR data_limite <= p_fim)
      AND (p_prioridade IS NULL OR prioridade = p_prioridade)
      AND (
          p_usuario_restrito IS NULL
          OR id_usuario_responsavel = p_usuario_restrito
          OR (
              (id_usuario_responsavel IS NULL OR responsavel_cargo = 'comercial')
              AND id_time = (SELECT time_id FROM usuario WHERE id_usuario = p_usuario_restrito)
          )
      )
    ORDER BY data_limite, os_id;
END$$

-- Consulta direta no MySQL com a assinatura de quatro filtros da avaliação.
CREATE PROCEDURE IF NOT EXISTS sp_listar_os(
    IN p_time_id INT,
    IN p_status VARCHAR(20),
    IN p_inicio DATE,
    IN p_fim DATE
)
READS SQL DATA
BEGIN
    CALL sp_listar_os_app(p_time_id, p_status, p_inicio, p_fim, NULL, NULL);
END$$

DELIMITER ;
