import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Buscamos la variable de entorno (la que pondremos en Render)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Lógica de selección
if SQLALCHEMY_DATABASE_URL:
    # ESTAMOS EN LA NUBE (RENDER + NEON)
    # Corrección: SQLAlchemy necesita que empiece con postgresql://
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # ESTAMOS EN CASA (LOCAL) -> Seguimos usando SQLite para pruebas
    SQLALCHEMY_DATABASE_URL = "sqlite:///./gym.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()