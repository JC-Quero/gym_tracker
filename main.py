from sqlalchemy import desc
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database import engine, SessionLocal
import models
import schemas
import auth

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

    hashed_pwd = auth.get_password_hash(user.password)

    db_user = models.User(
        username=user.username, 
        role=user.role,
        hashed_password=hashed_pwd
    )
    
    db.add(db_user)
    db.commit()
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

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.username, "id": user.id, "role": user.role}
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,       
        "username": user.username 
    }

@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    
    if not workout:
        raise HTTPException(status_code=404, detail="Entrenamiento no encontrado")
    
    sets_to_delete = db.query(models.Set).filter(models.Set.workout_id == workout_id).all()
    
    for s in sets_to_delete:
        db.delete(s)
    
    db.delete(workout)
    db.commit()
    
    return {"message": "Eliminado con éxito"}