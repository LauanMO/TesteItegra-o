# 🀄 MandaRim — Frontend

Interface web da plataforma MandaRim (aprendizado de Mandarim). Consome a API REST
do backend (Node/Express).

## Tecnologias

- **React 18** + **TypeScript**
- **Vite 6** (dev server e build)
- CSS puro — tema "tinta sobre papel" (papel de arroz, tinta nanquim, vermelho-cinábrio)
- Fontes: Fraunces (display), Noto Serif SC (hanzi), Newsreader (corpo)
- **Web Speech API** nativa para pronúncia (voz `zh-CN`)

## Funcionalidades

- Login e cadastro (JWT, token salvo no `localStorage`)
- **Flashcards**: caractere → pinyin → tradução, com pronúncia
- **Exercício**: múltipla escolha (gerado pelo backend/IA) e "escrever o pinyin"
- **Painel**: aprendidas / aprendendo / pendentes / a revisar, sequência (streak),
  progresso por nível HSK e palavras a revisar

## Como rodar localmente

> Requer o **backend** rodando (porta 3001). Veja `../backend/README.md`.

```bash
cd frontend
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Variáveis de ambiente

| Variável       | Descrição                              | Padrão                  |
| -------------- | -------------------------------------- | ----------------------- |
| `VITE_API_URL` | URL do backend (Node/Express)          | `http://localhost:3001` |

## Deploy (Vercel)

- Framework preset: **Vite**
- Build Command: `npm run build` · Output: `dist`
- Variável de ambiente: `VITE_API_URL` apontando para o backend no Render
