-- COMANDOS DDL 
CREATE DATABASE atividade_bdr_2dsm;

CREATE TABLE os (
os_id INT PRIMARY KEY AUTO_INCREMENT,
os_titulo VARCHAR(150) NOT NULL,
os_descricao TEXT NOT NULL,
os_status ENUM(
'aberta',
'em andamento',
'concluida',
'teste',
'bloqueado',
'review'
) NOT NULL DEFAULT 'aberta',
prioridade ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
data_limite DATE NOT NULL,
data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
id_criador INT NOT NULL,
id_time_responsavel INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE time (
id_time INT PRIMARY KEY AUTO_INCREMENT,
nome_time VARCHAR(100) NOT NULL UNIQUE,
email_time VARCHAR(150) NULL UNIQUE,
departamento VARCHAR(100) NOT NULL,
responsavel_id INT NULL,
FOREIGN KEY (responsavel_id) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE usuario (
id_usuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(100) NOT NULL,
email VARCHAR(150) NOT NULL UNIQUE,
senha VARCHAR(12) NOT NULL, -- ver se vai usar hash, se sim mudar para (255)
cargo ENUM(
'superusuario',
'gestor',
'comercial',
'suporte',
'producao',
'software',
'implantacao',
'monitoramento') NOT NULL,
time_id INT NULL,
FOREIGN KEY (time_id) REFERENCES times(id_time)
) ENGINE=InnoDB;


-- COMANDOS DML 
-- insert da tabela de usuários
INSERT INTO usuario (nome, email, cargo, time_id) VALUES
('Rafael Mendes', 'rafael.mendes@altave.com.br', 'superusuario', 1),
('Camila Rocha', 'camila.rocha@altave.com.br', 'gestor', 2),
('Lucas Ferreira', 'lucas.ferreira@altave.com.br', 'software', 1),
('Mariana Azevedo', 'mariana.azevedo@altave.com.br', 'implantacao', 2),
('Bruno Carvalho', 'bruno.carvalho@altave.com.br', 'gestor', 3),
('Patricia Lima', 'patricia.lima@altave.com.br', 'suporte', 6),
('Diego Almeida', 'diego.almeida@altave.com.br', 'producao', 5),
('Fernanda Costa', 'fernanda.costa@altave.com.br', 'comercial', 8),
('Thiago Oliveira', 'thiago.oliveira@altave.com.br', 'software', 12),
('Juliana Santos', 'juliana.santos@altave.com.br', 'implantacao', 9),
('Eduardo Pereira', 'eduardo.pereira@altave.com.br', 'monitoramento', 6),
('Aline Ribeiro', 'aline.ribeiro@altave.com.br', 'suporte', 7),
('Gustavo Martins', 'gustavo.martins@altave.com.br', 'software', 13),
('Beatriz Goncalves', 'beatriz.goncalves@altave.com.br', 'gestor', 10),
('Henrique Souza', 'henrique.souza@altave.com.br', 'producao', 14),
('Larissa Barbosa', 'larissa.barbosa@altave.com.br', 'comercial', 19),
('Felipe Nascimento', 'felipe.nascimento@altave.com.br', 'implantacao', 16),
('Vanessa Araujo', 'vanessa.araujo@altave.com.br', 'monitoramento', 27),
('Rodrigo Castro', 'rodrigo.castro@altave.com.br', 'software', 15),
('Priscila Melo', 'priscila.melo@altave.com.br', 'suporte', 18),
('Andre Cardoso', 'andre.cardoso@altave.com.br', 'producao', 22),
('Tatiane Correia', 'tatiane.correia@altave.com.br', 'comercial', 20),
('Marcelo Vieira', 'marcelo.vieira@altave.com.br', 'gestor', 21),
('Renata Dias', 'renata.dias@altave.com.br', 'software', 23),
('Caio Monteiro', 'caio.monteiro@altave.com.br', 'implantacao', 17),
('Natalia Teixeira', 'natalia.teixeira@altave.com.br', 'monitoramento', 6),
('Vitor Pinto', 'vitor.pinto@altave.com.br', 'suporte', 35),
('Carolina Nunes', 'carolina.nunes@altave.com.br', 'software', 25),
('Leonardo Moreira', 'leonardo.moreira@altave.com.br', 'producao', 26),
('Isabela Freitas', 'isabela.freitas@altave.com.br', 'comercial', 33),
('Gabriel Cavalcanti', 'gabriel.cavalcanti@altave.com.br', 'implantacao', 24),
('Debora Ramos', 'debora.ramos@altave.com.br', 'monitoramento', 42),
('Daniela Andrade', 'daniela.andrade@altave.com.br', 'suporte', 29),
('Mateus Farias', 'mateus.farias@altave.com.br', 'software', 30),
('Bianca Machado', 'bianca.machado@altave.com.br', 'producao', 32),
('Samuel Batista', 'samuel.batista@altave.com.br', 'comercial', 45),
('Leticia Duarte', 'leticia.duarte@altave.com.br', 'gestor', 28),
('Igor Mendes', 'igor.mendes@altave.com.br', 'software', 31),
('Amanda Moura', 'amanda.moura@altave.com.br', 'implantacao', 39),
('Pedro Henrique', 'pedro.henrique@altave.com.br', 'monitoramento', 27),
('Sabrina Campos', 'sabrina.campos@altave.com.br', 'suporte', 43),
('Murilo Peixoto', 'murilo.peixoto@altave.com.br', 'producao', 40),
('Cristina Lopes', 'cristina.lopes@altave.com.br', 'software', 37),
('Arthur Vasconcelos', 'arthur.vasconcelos@altave.com.br', 'implantacao', 49),
('Paloma Guimaraes', 'paloma.guimaraes@altave.com.br', 'monitoramento', 42),
('Fabricio Rezende', 'fabricio.rezende@altave.com.br', 'suporte', 46),
('Elaine Silveira', 'elaine.silveira@altave.com.br', 'producao', 47),
('Rafaela Tavares', 'rafaela.tavares@altave.com.br', 'software', 48),
('Hugo Bastos', 'hugo.bastos@altave.com.br', 'gestor', 50),
('Monica Paiva', 'monica.paiva@altave.com.br', 'superusuario', 50);