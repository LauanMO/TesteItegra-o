# 🀄 MandaRim — Backend

API REST da plataforma MandaRim (aprendizado de Mandarim). Cuida de autenticação,
usuários, progresso, vocabulário HSK e da orquestração das chamadas ao Serviço de IA.

## Tecnologias

- **Node.js** (>= 22) + **Express 4**
- **SQLite** via módulo nativo `node:sqlite` (sem dependências nativas / sem build)
- **JWT** (`jsonwebtoken`) para autenticação
- **bcryptjs** para hash de senhas

> O SQLite usa o driver embutido do Node (`node:sqlite`), por isso o projeto exige
> **Node 22+** e não precisa de `better-sqlite3` nem de ferramentas de compilação.

## Como rodar localmente

```bash
cd backend
cp .env.example .env      # ajuste JWT_SECRET (Windows: copy .env.example .env)
npm install
npm run seed              # opcional — cria o schema e popula o HSK 1
npm run dev               # inicia com hot-reload (node --watch)
# ou: npm start
```

O servidor sobe em `http://localhost:3001`. Na primeira execução o banco é criado em
`backend/data/mandarim.db` e populado com as **150 palavras do HSK 1** automaticamente.

## Variáveis de ambiente

| Variável         | Descrição                                                        | Padrão                 |
| ---------------- | ---------------------------------------------------------------- | ---------------------- |
| `PORT`           | Porta do servidor                                                | `3001`                 |
| `JWT_SECRET`     | Segredo para assinar os tokens JWT                               | (dev secret)           |
| `JWT_EXPIRES_IN` | Validade do token                                                | `7d`                   |
| `IA_SERVICE_URL` | URL do Serviço de IA. Vazio → usa gerador local de exercícios.   | (vazio)                |
| `DB_PATH`        | Caminho do arquivo SQLite                                        | `backend/data/mandarim.db` |

## Endpoints

### Saúde
| Método | Rota      | Descrição                |
| ------ | --------- | ------------------------ |
| GET    | `/`       | Info da API              |
| GET    | `/health` | Status / horário do servidor |

### Autenticação
| Método | Rota             | Corpo                          | Descrição                         |
| ------ | ---------------- | ------------------------------ | --------------------------------- |
| POST   | `/auth/register` | `{ name, email, password }`    | Cadastro. Retorna `{ token, user }` |
| POST   | `/auth/login`    | `{ email, password }`          | Login. Retorna `{ token, user }`  |

### Usuário (requer `Authorization: Bearer <token>`)
| Método | Rota             | Corpo                          | Descrição                                  |
| ------ | ---------------- | ------------------------------ | ------------------------------------------ |
| GET    | `/user/profile`  | —                              | Perfil + estatísticas                      |
| GET    | `/user/progress` | —                              | Progresso por nível, palavras a revisar, streak |
| POST   | `/user/progress` | `{ vocabularyId, correct }`    | Salva resultado de um exercício            |

### Conteúdo (público)
| Método | Rota                    | Descrição                                            |
| ------ | ----------------------- | ---------------------------------------------------- |
| GET    | `/lessons`              | Visão geral dos níveis HSK 1–6                       |
| GET    | `/lessons?level=1`      | Lições do nível (palavras em blocos de 10)           |
| GET    | `/vocabulary?level=1`   | Vocabulário do nível (com progresso, se autenticado) |

### IA (orquestração — fallback local quando `IA_SERVICE_URL` está vazio)
| Método | Rota                   | Corpo                                          | Descrição                          |
| ------ | ---------------------- | ---------------------------------------------- | ---------------------------------- |
| POST   | `/exercise/generate`   | `{ vocabularyId }` ou `{ word, pinyin, meaning }` | Exercício de múltipla escolha   |
| POST   | `/flashcard/example`   | `{ vocabularyId }` ou `{ word }`               | Frase de exemplo em mandarim       |

## Repetição espaçada

Cada palavra tem um *box* de Leitner (0–5). Acertar sobe de box e adia a próxima
revisão (intervalos: 0, 1, 2, 4, 7, 15 dias); errar desce de box, fazendo a palavra
**voltar mais cedo**. No box 5 a palavra é marcada como `learned`.

## Deploy (Render)

- Build Command: `npm install`
- Start Command: `npm start`
- Variáveis: `JWT_SECRET`, `IA_SERVICE_URL` (Node 22+ é selecionado via `engines`)
