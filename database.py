import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Buscamos la variable de entorno
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Lógica de selección
if SQLALCHEMY_DATABASE_URL:
    # --- ESTAMOS EN LA NUBE (RENDER + NEON) ---
    
    # Fix para el prefijo de postgres
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    # AQUÍ ESTÁ LA MAGIA:
    # pool_pre_ping=True -> Revisa si la conexión vive antes de usarla.
    # pool_recycle=300   -> Renueva las conexiones cada 5 minutos para que no se venzan.
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True, 
        pool_recycle=300
    )
else:
    # --- ESTAMOS EN CASA (LOCAL) ---
    SQLALCHEMY_DATABASE_URL = "sqlite:///./gym.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()