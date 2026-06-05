# 🀄 MandaRim

Plataforma de aprendizado de **Mandarim** construída como projeto de **Técnicas de
Integração de Sistemas**. Composta por **3 sistemas integrados** — frontend, backend e
um serviço de IA — que se comunicam via REST.

> Aprenda vocabulário do HSK com flashcards, exercícios gerados por IA (Gemini),
> pronúncia nativa (zh-CN) e acompanhamento de progresso com repetição espaçada.

---

## 🧩 Arquitetura

```
                  HTTP/REST                      HTTP/REST
  ┌───────────┐   (JWT)      ┌───────────┐      (interno)     ┌──────────────┐
  │  Frontend │ ───────────► │  Backend  │ ─────────────────► │  Serviço IA  │
  │  React/TS │ ◄─────────── │  Node/    │ ◄───────────────── │  Python/     │
  │  (Vercel) │              │  Express  │                    │  FastAPI     │
  └───────────┘              │  + SQLite │                    │  + Gemini    │
                             └───────────┘                    └──────────────┘
        :5173                     :3001                             :8000
   (Vercel)                  (Render)                          (Render)
```

1. **Frontend** (React + TypeScript + Vite) — interface; consome o backend via REST.
2. **Backend** (Node + Express + SQLite) — autenticação JWT, usuários, progresso,
   vocabulário HSK e **orquestração** das chamadas ao Serviço de IA.
3. **Serviço de IA** (Python + FastAPI) — recebe vocabulário e chama o **Gemini**
   para gerar exercícios e frases de exemplo (com _fallback_ mock sem chave).

---

## 🛠️ Tecnologias

| Sistema      | Stack                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite 6, TTS de pronúncia zh-CN, tema claro/escuro |
| Backend      | Node.js 22+, Express 4, `node:sqlite` (embutido), JWT, bcryptjs         |
| Serviço IA   | Python 3.12, FastAPI, Uvicorn, google-genai (Gemini)                    |
| Orquestração | Docker, docker-compose                                                  |

---

## 📂 Estrutura

```
TesteItegra-o/
├── docker-compose.yml      # sobe os 3 serviços
├── .env.example            # variáveis do compose
├── frontend/               # React + TypeScript + Vite
├── backend/                # Node + Express + SQLite
└── ia-service/             # Python + FastAPI + Gemini
```

Cada serviço tem seu próprio `README.md` com detalhes.

---

## 🚀 Execução local

### Opção A — Docker (tudo de uma vez)

```bash
cp .env.example .env        # adicione GEMINI_API_KEY e JWT_SECRET
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend → http://localhost:3001
- IA → http://localhost:8000/docs

> Sem `GEMINI_API_KEY`, os exercícios usam o gerador mock — tudo continua funcional.

### Opção B — Manual (3 terminais)

```bash
# 1) Serviço de IA
cd ia-service && python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt && uvicorn main:app --port 8000

# 2) Backend  (crie backend/.env com IA_SERVICE_URL=http://localhost:8000)
cd backend && npm install && npm run dev

# 3) Frontend (crie frontend/.env com VITE_API_URL=http://localhost:3001)
cd frontend && npm install && npm run dev
```

---

## 🔌 Endpoints

### Backend (Node/Express) — `:3001`

| Método | Rota                  | Auth | Descrição                                     |
| ------ | --------------------- | :--: | --------------------------------------------- |
| POST   | `/auth/register`      |  —   | Cadastro → `{ token, user }`                  |
| POST   | `/auth/login`         |  —   | Login → `{ token, user }`                     |
| GET    | `/user/profile`       |  ✅  | Perfil + estatísticas                         |
| GET    | `/user/progress`      |  ✅  | Progresso por nível, revisões, streak         |
| POST   | `/user/progress`      |  ✅  | Salva resultado `{ vocabularyId, correct }`   |
| GET    | `/lessons`            |  —   | Visão geral dos níveis HSK 1–6                |
| GET    | `/vocabulary?level=1` |  —   | Vocabulário do nível                          |
| POST   | `/exercise/generate`  |  —   | Exercício (orquestra IA, com fallback)        |
| POST   | `/flashcard/example`  |  —   | Frase de exemplo (orquestra IA)               |
| GET    | `/tts?text=…&lang=…`  |  —   | Áudio de pronúncia (proxy TTS) → `audio/mpeg` |
| GET    | `/health`             |  —   | Status do serviço + URL da IA configurada     |

### Serviço de IA (Python/FastAPI) — `:8000`

| Método | Rota                  | Corpo                       | Descrição                               |
| ------ | --------------------- | --------------------------- | --------------------------------------- |
| POST   | `/generate/exercise`  | `{ word, pinyin, meaning }` | Múltipla escolha (Gemini ou mock)       |
| POST   | `/generate/flashcard` | `{ word }`                  | Frase de exemplo (hanzi, pinyin, trad.) |

---

## ⚙️ Variáveis de ambiente

| Serviço    | Variável         | Descrição                                |
| ---------- | ---------------- | ---------------------------------------- |
| Backend    | `JWT_SECRET`     | Segredo para assinar tokens JWT          |
| Backend    | `IA_SERVICE_URL` | URL do Serviço de IA (vazio → fallback)  |
| Serviço IA | `GEMINI_API_KEY` | Chave do Google AI Studio (vazio → mock) |
| Frontend   | `VITE_API_URL`   | URL do backend                           |

---

## 🗂️ Funcionalidades

- **Aprendizado:** flashcards (caractere → pinyin → tradução), múltipla escolha
  (gerada por IA), escrever o pinyin, pronúncia em mandarim (TTS via backend,
  com fallback para a Web Speech API nativa).
- **Progresso:** níveis HSK 1–6, repetição espaçada (Leitner — palavras erradas
  voltam mais cedo), dashboard com aprendidas/pendentes e streak de dias.
- **Usuário:** cadastro e login com JWT, perfil com nível HSK e estatísticas.
- **Interface:** tema claro/escuro (alternável), layout responsivo.

O backend já vem com **seed do HSK 1 (150 palavras)** populado na primeira execução.

---

## ☁️ Deploy

| Sistema    | Plataforma | Configuração                                                                                                          |
| ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend   | Vercel     | preset Vite · build `npm run build` · env `VITE_API_URL`                                                              |
| Backend    | Render     | build `npm install` · start `npm start` · env `JWT_SECRET`, `IA_SERVICE_URL`                                          |
| Serviço IA | Render     | build `pip install -r requirements.txt` · start `uvicorn main:app --host 0.0.0.0 --port $PORT` · env `GEMINI_API_KEY` |

**Links do deploy:**

- Frontend: https://mandarim-seven.vercel.app
- Backend: https://mandarim-backend.onrender.com
- Serviço IA: https://mandarim-ia-service.onrender.com

---

## 🎥 Vídeo

`https://youtu.be/2NBhedKWIUo?si=LqQkgKq6HUr8ncqI`
