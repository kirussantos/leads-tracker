from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scheduler.jobs import iniciar_scheduler
from meta.insights import sincronizar_todos
from api.routes import clientes, links, leads, sync, insights, ai, meta, setup, alertas

app = FastAPI(title="Leads Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clientes.router)
app.include_router(links.router)
app.include_router(leads.router)
app.include_router(sync.router)
app.include_router(insights.router)
app.include_router(ai.router)
app.include_router(meta.router)
app.include_router(setup.router)
app.include_router(alertas.router)


@app.on_event("startup")
def startup():
    sincronizar_todos()
    iniciar_scheduler()


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "alive"}
