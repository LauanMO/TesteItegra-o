# 🀄 MandaRim — Serviço de IA

Microsserviço em **Python + FastAPI** que gera exercícios dinâmicos e frases de
exemplo chamando o **Gemini** (free tier). É consumido pelo backend Node, que
orquestra as chamadas.

## Tecnologias

- **Python 3.11+** · **FastAPI** · **Uvicorn**
- **google-genai** (SDK unificado do Gemini)
- Sem chave (`GEMINI_API_KEY` vazio) → responde com **gerador mock**

## Como rodar localmente

```bash
cd ia-service
python -m venv .venv
.venv\Scripts\activate         # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env             # opcional — adicione GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

Docs interativas (Swagger) em `http://localhost:8000/docs`.

Para o backend usar este serviço, defina no `backend/.env`:
```
IA_SERVICE_URL=http://localhost:8000
```

## Variáveis de ambiente

| Variável         | Descrição                                          | Padrão             |
| ---------------- | -------------------------------------------------- | ------------------ |
| `GEMINI_API_KEY` | Chave do Google AI Studio. Vazio → gerador mock.   | (vazio)            |
| `GEMINI_MODEL`   | Modelo do Gemini                                   | `gemini-2.5-flash` |
| `PORT`           | Porta do servidor                                  | `8000`             |

## Endpoints

| Método | Rota                  | Corpo                          | Retorno |
| ------ | --------------------- | ------------------------------ | ------- |
| GET    | `/health`             | —                              | status + se o Gemini está ativo |
| POST   | `/generate/exercise`  | `{ word, pinyin, meaning }`    | exercício de múltipla escolha |
| POST   | `/generate/flashcard` | `{ word }`                     | frase de exemplo (hanzi, pinyin, tradução) |

Cada resposta inclui `source`: `"gemini"` (gerado pelo modelo) ou `"mock"`.

## Deploy (Render)

- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Variável: `GEMINI_API_KEY`
