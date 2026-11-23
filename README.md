# Altave OS

Gestão de Ordens de Serviço (OS) da Altave. Node, TypeScript, Express 5 e MySQL no backend; Vite, TypeScript e Tailwind v4 no frontend.

## Estrutura

```
assets/          imagens e materiais do projeto (README, apresentação)
backend/         API Express + MySQL
  migrations/    scripts SQL versionados
  src/           config, middlewares, modules (auth, usuarios, times, os), scripts
docs/            documentação (modelos, dicionário de dados)
frontend/        Vite + Tailwind
  public/img/    imagens estáticas
  src/           main.ts, api.ts, style.css
script.sql       DDL do banco (mesmo conteúdo de backend/migrations/001_schema.sql)
instrucoes.txt   passo a passo para rodar
```

## Como rodar

Veja `instrucoes.txt`. Resumo:

```bash
npm run install:all
mysql -u root -p < script.sql
# copiar backend/.env.example -> backend/.env e frontend/.env.example -> frontend/.env
npm run seed:admin -- admin@altave.com.br SenhaForte123 "Admin"
npm run dev:backend    # http://localhost:3000
npm run dev:frontend   # http://localhost:5173
```

## Regras de negócio

| Regra | Onde é aplicada |
|---|---|
| Usuário pode ser criado sem time (`time_id` opcional) | `usuarios.service.ts` |
| Time só nasce com pelo menos 1 usuário (em transação) | `times.service.ts › criarTime` |
| O responsável (líder) do time é um dos membros | `criarTime`, `trocarResponsavel` |
| Líder não pode ser removido do time nem apagado | `removerMembro`, `removerUsuario` |
| Membros do time responsável editam a OS livremente | `os.service.ts › editarOS` |
| Só o líder conclui (ou reabre) uma OS | `editarOS`, `concluirOS` |

## Rotas da API

Todas, exceto o login, exigem `Authorization: Bearer <token>`.

- `POST /auth/login`
- `GET/POST /usuarios`, `GET/PATCH/DELETE /usuarios/:id`
- `GET/POST /times`, `GET/PATCH /times/:id`
- `POST /times/:id/membros`, `DELETE /times/:id/membros/:usuarioId`, `PUT /times/:id/responsavel`
- `GET/POST /os`, `GET/PATCH /os/:id`, `POST /os/:id/concluir`
