from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(String, default="alumno")
    hashed_password = Column(String) 

    # Relación: Un usuario tiene muchos workouts
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)

    # Relación: Un ejercicio aparece en muchos sets
    sets = relationship("Set", back_populates="exercise")

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="workouts")
    # Relación: Un workout tiene muchos sets
    # cascade="all, delete-orphan" significa que si borrás el workout, los sets se borran solos
    sets = relationship("Set", back_populates="workout", cascade="all, delete-orphan")

class Set(Base):
    __tablename__ = "sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    reps = Column(Integer)
    weight = Column(Float)
    rpe = Column(Integer)

    workout = relationship("Workout", back_populates="sets")
    exercise = relationship("Exercise", back_populates="sets")