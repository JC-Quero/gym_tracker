'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Set {
  id: number;
  reps: number;
  weight: number;
  rpe: number;
  exercise?: {
    name: string;
  };
}

interface Workout {
  id: number;
  date: string;
  notes: string;
  sets: Set[];
}

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const API_URL = 'https://gym-tracker-mhcl.onrender.com';

  useEffect(() => {
    const userId = localStorage.getItem('user_id');

    if (userId) {
      fetch(`${API_URL}/workouts/user/${userId}`)
        .then((res) => res.json())
        .then((data) => setWorkouts(data))
        .catch((err) => console.error(err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-24">
      <header className="flex items-center gap-4 mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 border-b border-gray-800 z-10">
        <Link href="/" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-xl hover:bg-gray-700 transition-colors">
          ⬅️
        </Link>
        <h1 className="text-xl font-bold">Historial de Entrenos</h1>
      </header>

      <div className="space-y-6 relative border-l-2 border-gray-800 ml-4 pl-6">
        {workouts.map((workout) => (
          <div key={workout.id} className="relative">
            <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-black box-content"></div>
            
            <div className="mb-1 flex items-baseline gap-3">
              <span className="text-blue-500 font-bold text-lg">
                {new Date(workout.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Workout #{workout.id}</span>
            </div>

            {workout.notes && (
              <p className="text-gray-400 text-sm italic mb-3">"{workout.notes}"</p>
            )}

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <ul className="space-y-3">
                {workout.sets.map((set) => (
                  <li key={set.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                    <span className="text-white font-medium">
                      {set.exercise?.name || "Ejercicio"} 
                    </span>
                    <span className="font-mono text-gray-300">
                      {set.weight}kg <span className="text-gray-600">x</span> {set.reps}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}