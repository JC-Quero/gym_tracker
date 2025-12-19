from pydantic import BaseModel, ConfigDict 
from typing import List, Optional
from datetime import date

# --- 1. Esquemas para Ejercicios ---
class ExerciseCreate(BaseModel):
    name: str
    category: str

class Exercise(ExerciseCreate):
    id: int

    class Config:
        from_attributes = True 

# --- 2. Esquemas para Usuarios ---
class UserCreate(BaseModel):
    username: str
    role: str = "alumno"

class User(UserCreate):
    id: int

    class Config:
        from_attributes = True 

# --- 3. Esquemas para Sets ---
class SetCreate(BaseModel):
    exercise_id: int
    reps: int
    weight: float
    rpe: int

class Set(SetCreate):
    id: int
    workout_id: int

    class Config:
        from_attributes = True 

# --- 4. Esquemas para Workouts ---
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