from apscheduler.schedulers.background import BackgroundScheduler
from meta.insights import sincronizar_todos
from alertas.checker import verificar_todos_clientes
from config import INTERVALO_SYNC_HORAS


def iniciar_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sincronizar_todos, "interval", hours=INTERVALO_SYNC_HORAS, id="sync_meta")
    scheduler.add_job(verificar_todos_clientes, "cron", hour=8, minute=0, id="alertas_diarios")
    scheduler.start()
    print(f"[SCHEDULER] Sync a cada {INTERVALO_SYNC_HORAS}h · Alertas diários às 08:00")
    return scheduler
