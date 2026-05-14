# Leads Tracker

Dashboard pessoal fullstack para gestão de tráfego pago — Meta Ads + Firebase + React.

## Stack

- **Frontend:** React + Vite + Tailwind CSS → deploy Vercel
- **Backend:** FastAPI + Firebase Admin SDK → deploy Render.com
- **Banco:** Firebase Firestore
- **Custo:** R$0/mês

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# preencher variáveis no .env
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# preencher variáveis no .env.local
npm install
npm run dev
```

## Deploy

- **Frontend:** Vercel → Root Directory: `frontend`
- **Backend:** Render.com → Root Directory: `backend`
- **Keep-alive:** UptimeRobot → `https://seu-app.onrender.com/health` a cada 5min
