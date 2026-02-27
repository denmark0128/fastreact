from app.auth.service import seed_default_accounts
from app.database import SessionLocal


def run() -> None:
    db = SessionLocal()
    try:
        seed_default_accounts(db)
    finally:
        db.close()


if __name__ == "__main__":
    run()
