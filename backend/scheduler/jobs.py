from apscheduler.schedulers.background import BackgroundScheduler
from meta.insights import sincronizar_todos
from config import INTERVALO_SYNC_HORAS


def iniciar_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sincronizar_todos, "interval", hours=INTERVALO_SYNC_HORAS, id="sync_meta")
    scheduler.start()
    print(f"[SCHEDULER] Sync a cada {INTERVALO_SYNC_HORAS}h")
    return scheduler
