# Altave OS

Gestão de Ordens de Serviço (OS) da Altave. Node, TypeScript, Express 5 e MySQL no backend; Vite, TypeScript e Tailwind v4 no frontend.

## Estrutura

```
assets/          imagens e materiais do projeto (README, apresentação)
backend/         API Express + MySQL
  migrations/    scripts SQL versionados
  src/           servidor, conexão MySQL, configuração e autenticação
    routes/      endpoints e validação de entrada
    services/    regras de negócio e consultas SQL de usuários, times e OS
docs/            documentação (modelos, dicionário de dados)
frontend/        Vite + Tailwind
  public/img/    imagens estáticas
  src/           main.ts, api.ts, style.css
script.sql       DDL completo para uma instalação nova
instrucoes.txt   passo a passo para rodar
```

## Arquivos de apoio

| Arquivo | Para que serve |
|---|---|
| `package.json` | Comandos para instalar, compilar e iniciar o projeto a partir da raiz. |
| `backend/package.json` | Dependências e comandos da API Express. |
| `frontend/package.json` | Dependências e comandos da interface com Vite. |
| `backend/package-lock.json` e `frontend/package-lock.json` | Versões exatas das dependências instaladas em cada parte do projeto. |
| `frontend/.prettierrc` | Preferências de formatação do código do frontend. |
| `DDL-DML/script.sql` | Cria as tabelas, os vínculos e as contas iniciais. |
| `DDL-DML/dml_dados.sql` | Popula as tabelas com dados fictícios para demonstração. |
| `DDL-DML/script2.sql` | Reúne a view, as procedures, as functions e os triggers da avaliação. |
| `modelo_conceitual.pdf` | Representa as entidades e seus relacionamentos. |
| `modelo_logico.pdf` | Mostra a estrutura lógica das tabelas, com chaves primárias e estrangeiras. |
| `docs/usuarios_login.md` | Lista as contas fictícias e os cargos disponíveis para demonstração. |

Os arquivos `.gitkeep` registram no Git diretórios de documentação e imagens que podem ficar vazios.

## Como rodar

Veja `instrucoes.txt`. Se o banco já existe, aplique as migrações pendentes em
`backend/migrations/`, em ordem numérica. Para uma instalação nova:

```bash
npm run install:all
mysql -u root -p < DDL-DML/script.sql
mysql -u root -p < backend/migrations/005_time_responsavel_e_total_os.sql
mysql -u root -p < backend/migrations/006_listar_os_com_filtros.sql
# copiar backend/.env.example -> backend/.env e frontend/.env.example -> frontend/.env
npm run dev:backend    # http://localhost:3000
npm run dev:frontend   # http://localhost:5173
```

## Regras de negócio

O `script.sql` cria quatro contas de demonstração. Gestor e Comercial iniciam
sem time. Produção e Software começam como responsáveis dos respectivos times.

| Cargo | E-mail | Senha inicial |
|---|---|---|
| Gestor | gestor@altave.test | `Gestor123!` |
| Comercial | comercial@altave.test | `Comercial123!` |
| Produção | producao@altave.test | `Producao123!` |
| Software | software@altave.test | `Software123!` |


| Regra | Onde é aplicada |
|---|---|
| Usuário pode ser criado sem time (`time_id` opcional) | `usuarios.service.ts` |
| Time só nasce com pelo menos 1 usuário (em transação) | `times.service.ts › criarTime` |
| O responsável (líder) do time é um dos membros | `criarTime`, `trocarResponsavel` |
| Líder não pode ser removido do time nem apagado | `removerMembro`, `removerUsuario` |
| Gestor administra usuários, times e OS | Rotas e serviços |
| Comercial cria e visualiza todas as OS | Rotas de OS |
| A pessoa responsável pela OS precisa ter cargo Comercial. O time vinculado indica quem vai executar o serviço. | `os.service.ts > validarResponsavel` |
| Produção e Software veem as novas OS pelo time vinculado e mantêm acesso às atribuições individuais anteriores | `listarOS`, `buscarOS` |
| Gestor e líder autorizado do time podem concluir ou reabrir uma OS | `editarOS`, `concluirOS` |

O trigger `trg_time_bi_exigir_responsavel` impede o cadastro de um time sem responsável.
A lista de times usa `fn_total_os_time` para mostrar a quantidade de OS vinculadas a cada time.

Na lista de OS, é possível filtrar por time, status, prioridade e intervalo de prazo.
No MySQL, `CALL sp_listar_os(NULL, 'aberta', NULL, NULL);` lista as OS abertas.
A API usa `sp_listar_os_app`, que também aceita prioridade e respeita o acesso do usuário.

## Rotas da API

O login cria uma sessão em memória no backend. O navegador envia o cookie de sessão
automaticamente nas rotas privadas. Ao reiniciar o backend, é preciso entrar de novo.
Se o frontend rodar em outro endereço, configure `FRONTEND_ORIGIN` no backend
com a origem completa, incluindo a porta.

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET/POST /usuarios`, `GET/PATCH/DELETE /usuarios/:id`
- `GET/POST /times`, `GET/PATCH/DELETE /times/:id`
- `POST /times/:id/membros`, `DELETE /times/:id/membros/:usuarioId`, `PUT /times/:id/responsavel`
- `GET/POST /os`, `GET/PATCH/DELETE /os/:id`, `POST /os/:id/concluir`
- `GET /os/:id/anexos`, `GET /os/:id/anexos/:anexoId`
