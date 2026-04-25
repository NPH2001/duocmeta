from sqlalchemy.orm import Session

from app.core.db import SessionLocal, engine, get_db_session


def test_engine_uses_postgresql_driver() -> None:
    assert engine.url.drivername == "postgresql+psycopg"
    assert engine.url.database == "duocmeta"


def test_session_factory_returns_session_and_generator_closes() -> None:
    session = SessionLocal()
    assert isinstance(session, Session)
    session.close()

    session_generator = get_db_session()
    yielded_session = next(session_generator)

    assert isinstance(yielded_session, Session)

    yielded_session.close()

    try:
        next(session_generator)
    except StopIteration:
        pass
    else:
        raise AssertionError("Session generator should stop after closing the session.")
