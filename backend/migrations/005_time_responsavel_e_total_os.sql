-- Exige responsável ao cadastrar um time e disponibiliza a contagem de OS por time.
USE atividade_bdr_2dsm;

DELIMITER $$

-- Rejeita a criação do time se o responsável não tiver sido informado.
CREATE TRIGGER IF NOT EXISTS trg_time_bi_exigir_responsavel
BEFORE INSERT ON `time`
FOR EACH ROW
BEGIN
    IF NEW.responsavel_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O time precisa de uma pessoa responsável';
    END IF;
END$$

-- Conta as ordens vinculadas ao time, independentemente de status ou prioridade.
CREATE FUNCTION IF NOT EXISTS fn_total_os_time(p_time_id INT)
RETURNS BIGINT
READS SQL DATA
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM os
        WHERE id_time_responsavel = p_time_id
    );
END$$

DELIMITER ;
