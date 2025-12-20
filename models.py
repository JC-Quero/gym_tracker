from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(String, default="alumno")
    hashed_password = Column(String)
    
    workouts = relationship("Workout", back_populates="user")

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    # Ejemplo: "Piernas", "Empuje"
    category = Column(String) 

class Workout(Base):
    __tablename__ = "workouts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, default=datetime.utcnow)
    notes = Column(String, nullable=True) # "Me sentí cansado"
    
    user = relationship("User", back_populates="workouts")
    sets = relationship("WorkoutSet", back_populates="workout")

class WorkoutSet(Base):
    __tablename__ = "workout_sets"
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    
    reps = Column(Integer)
    weight = Column(Float)
    rpe = Column(Integer) # El famoso Esfuerzo Percibido (1-10)
    
    workout = relationship("Workout", back_populates="sets")
    exercise = relationship("Exercise")