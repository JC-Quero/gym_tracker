'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Tu URL de Render
  const API_URL = 'https://gym-tracker-mhcl.onrender.com';

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = () => {
    const userId = localStorage.getItem('user_id');
    
    // 1. SI NO HAY USUARIO, PARAMOS Y REDIRIGIMOS
    if (!userId) {
      setIsLoading(false);
      // Opcional: Si querés que los mande al login descomentá la línea de abajo
      // router.push('/login');
      return;
    }

    // 2. SI HAY USUARIO, BUSCAMOS
    fetch(`${API_URL}/workouts/user/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al buscar datos");
        return res.json();
      })
      .then((data) => {
        // Ordenamos para que el más reciente salga arriba
        const sorted = Array.isArray(data) ? data.sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
        setWorkouts(sorted);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false)); // ESTO APAGA EL "CARGANDO" SIEMPRE
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de borrar este entrenamiento? No hay vuelta atrás.')) return;

    try {
      const res = await fetch(`${API_URL}/workouts/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Lo sacamos de la lista visualmente para que sea instantáneo
        setWorkouts(prev => prev.filter(w => w.id !== id));
      } else {
        alert('Error al borrar');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-4 font-sans pb-24">
      
      {/* HEADER FIXED */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 border-b border-gray-800 z-10"
      >
        <div className="flex items-center gap-4">
            <Link href="/" className="h-10 w-10 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center text-xl hover:bg-gray-800 transition-colors">
            ⬅️
            </Link>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Historial
            </h1>
        </div>
      </motion.header>

      {/* LISTA DE ENTRENAMIENTOS */}
      <div className="space-y-6 relative border-l-2 border-gray-800/50 ml-4 pl-6">
        
        {isLoading && <p className="text-gray-500 animate-pulse">Cargando historial...</p>}
        
        {!isLoading && workouts.length === 0 && (
          <div className="text-gray-500 text-sm">
            <p className="mb-2">No hay entrenamientos guardados.</p>
            <p className="text-xs text-gray-600">(Si recién te logueaste, asegurate de haber cargado algo primero)</p>
          </div>
        )}

        <AnimatePresence>
        {workouts.map((workout, index) => (
          <motion.div 
            key={workout.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* PUNTITO DE TIEMPO */}
            <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-black box-content shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
            
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                    <span className="text-blue-400 font-bold text-lg capitalize">
                        {new Date(workout.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-gray-600 text-[10px] uppercase font-bold tracking-wider border border-gray-800 px-2 rounded-full">#{workout.id}</span>
                </div>
                
                {/* BOTÓN BORRAR */}
                <button 
                    onClick={() => handleDelete(workout.id)}
                    className="text-gray-600 hover:text-red-500 transition-colors p-2 bg-gray-900/50 rounded-lg hover:bg-red-900/20"
                >
                    🗑️
                </button>
            </div>

            {workout.notes && (
              <p className="text-gray-500 text-xs italic mb-3 ml-1">"{workout.notes}"</p>
            )}

            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-1 border border-gray-800/50 hover:border-blue-500/30 transition-colors">
              <ul className="divide-y divide-gray-800/50">
                {workout.sets.map((set) => (
                  <li key={set.id} className="flex justify-between items-center text-sm p-3">
                    <span className="text-gray-200 font-medium">
                      {set.exercise?.name || "Ejercicio"} 
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-white text-base font-bold">
                        {set.weight}<span className="text-xs text-gray-500 font-normal">kg</span>
                        </span>
                        <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs">
                            x{set.reps}
                        </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
}