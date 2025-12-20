from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# ==========================================
# 1. PARTE DE USUARIOS (El arreglo clave)
# ==========================================

# Base: Datos que comparten tanto la creación como la lectura
class UserBase(BaseModel):
    username: str
    role: str = "alumno"

# Create: Lo que necesitamos para crearlo (LLEVA PASSWORD)
class UserCreate(UserBase):
    password: str

# Read: Lo que devolvemos al frontend (NO LLEVA PASSWORD)
class User(UserBase):
    id: int
    # Al no heredar de UserCreate, no pide password.
    # Y al no poner hashed_password acá, tampoco la mostramos. ¡Seguridad total!
    
    class Config:
        from_attributes = True

# ==========================================
# 2. PARTE DE EJERCICIOS
# ==========================================

class ExerciseCreate(BaseModel):
    name: str
    category: str

class Exercise(ExerciseCreate):
    id: int

    class Config:
        from_attributes = True

# ==========================================
# 3. PARTE DE SETS Y WORKOUTS
# ==========================================

class SetCreate(BaseModel):
    exercise_id: int
    reps: int
    weight: float
    rpe: int

class Set(SetCreate):
    id: int
    workout_id: int
    exercise: Optional[Exercise] = None 

    class Config:
        from_attributes = True

class WorkoutCreate(BaseModel):
    user_id: int
    notes: Optional[str] = None
    sets: List[SetCreate] = []

class Workout(BaseModel):
    id: int
    user_id: int
    date: date
    notes: Optional[str]
    sets: List[Set] = []

    class Config:
        from_attributes = True