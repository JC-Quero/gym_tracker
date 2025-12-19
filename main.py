from sqlalchemy import desc
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
import models
import schemas

# Crea las tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI()


origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependencia: Esto nos da una sesión de base de datos por cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RUTAS DE USUARIOS ---

@app.get("/history/{user_id}/{exercise_id}")
def get_exercise_history(user_id: int, exercise_id: int, db: Session = Depends(get_db)):
    last_set = (
        db.query(models.WorkoutSet)
        .join(models.Workout)
        .filter(models.Workout.user_id == user_id)
        .filter(models.WorkoutSet.exercise_id == exercise_id)
        .order_by(desc(models.Workout.date), desc(models.Workout.id))
        .first()
    )

    if not last_set:
        return{"found": False}

    return{
        "found": True,
        "weight": last_set.weight,
        "reps": last_set.reps,
        "rpe": last_set.rpe,
        "date": last_set.workout.date
    }


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Crear el objeto modelo
    db_user = models.User(username=user.username, role=user.role)
    # 2. Agregarlo a la sesión
    db.add(db_user)
    # 3. Guardar cambios (commit)
    db.commit()
    # 4. Refrescar para obtener el ID generado
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# --- RUTAS DE EJERCICIOS ---

@app.post("/exercises/", response_model=schemas.Exercise)
def create_exercise(exercise: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    db_exercise = models.Exercise(name=exercise.name, category=exercise.category)
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise

@app.get("/exercises/", response_model=List[schemas.Exercise])
def read_exercises(db: Session = Depends(get_db)):
    return db.query(models.Exercise).all()


# --- RUTAS DE ENTRENAMIENTOS (WORKOUTS) ---

@app.post("/workouts/", response_model=schemas.Workout)
def create_workout(workout: schemas.WorkoutCreate, db: Session = Depends(get_db)):
    # 1. Crear la "Carpeta" del entrenamiento (La sesión)
    db_workout = models.Workout(user_id=workout.user_id, notes=workout.notes)
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout) # Obtenemos el ID nuevo (ej: Workout #1)

    # 2. Guardar cada serie (Set) dentro de esa carpeta
    for set_data in workout.sets:
        db_set = models.WorkoutSet(
            workout_id=db_workout.id, # Vinculamos al ID del paso 1
            exercise_id=set_data.exercise_id,
            reps=set_data.reps,
            weight=set_data.weight,
            rpe=set_data.rpe
        )
        db.add(db_set)
    
    # 3. Guardar todas las series de una
    db.commit()
    db.refresh(db_workout)
    
    return db_workout

@app.get("/workouts/", response_model=List[schemas.Workout])
def read_workouts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Traemos los workouts (SQLAlchemy se encarga de traer los sets anidados gracias al ORM)
    return db.query(models.Workout).offset(skip).limit(limit).all()

@app.get("/workouts/user/{user_id}", response_model=List[schemas.Workout])
def read_user_workouts(user_id: int, db: Session = Depends(get_db)):
    workouts = (
        db.query(models.Workout)
        .filter(models.Workout.user_id == user_id)
        .order_by(desc(models.Workout.date), desc(models.Workout.id))
        .all()
    )
    return workouts