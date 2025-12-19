'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Exercise {
  id: number;
  name: string;
  category: string;
}

interface WorkoutSet {
  exercise_id: number;
  exercise_name: string;
  weight: number;
  reps: number;
  rpe: number;
}

// NUEVO: Interfaz para el historial
interface HistoryData {
  found: boolean;
  weight?: number;
  reps?: number;
  rpe?: number;
  date?: string;
}

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<WorkoutSet[]>([]); 
  const [isSaving, setIsSaving] = useState(false);

  // Estados del Modal
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  
  const [history, setHistory] = useState<HistoryData | null>(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch('https://gym-tracker-mhcl.onrender.com/exercices')
      .then((res) => res.json())
      .then((data) => setExercises(data))
      .catch((error) => console.error("Error:", error));
  }, []);

  const openModal = (ex: Exercise) => {
    setSelectedExercise(ex);
    setWeight('');
    setReps('');
    setRpe('');
    setHistory(null); // Reseteamos historial mientras carga

    fetch(`https://gym-tracker-mhcl.onrender.com/history/1/${ex.id}`)
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("No se pudo cargar historial", err));
  };

  const addSetToCart = () => {
    if (!selectedExercise) return;
    const newSet: WorkoutSet = {
      exercise_id: selectedExercise.id,
      exercise_name: selectedExercise.name,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      rpe: parseInt(rpe) || 0,
    };
    setCart([...cart, newSet]);
    setSelectedExercise(null);
  };

  const finishWorkout = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        user_id: 1,
        notes: "Entrenamiento Web",
        sets: cart.map(item => ({
          exercise_id: item.exercise_id,
          reps: item.reps,
          weight: item.weight,
          rpe: item.rpe
        }))
      };
      const response = await fetch('https://gym-tracker-mhcl.onrender.com/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert("¡Guardado! 💪");
        setCart([]);
      } else {
        alert("Error al guardar");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const copyHistory = () => {
    if (history && history.found) {
      setWeight(history.weight?.toString() || '');
      setReps(history.reps?.toString() || '');
      setRpe(history.rpe?.toString() || '');
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-black text-white p-10">Cargando Gym Manager...</div>;
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans relative">
      <main className="max-w-md mx-auto pb-32">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-blue-500">Gym Manager</h1>
            <p className="text-gray-400 text-xs">Modo Alumno</p>
          </div>
          
          {/* Bloque derecho: Calendario + Contador */}
          <div className="flex items-center gap-4">
            
            {/* BOTÓN AL HISTORIAL */}
            <Link href="/history" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700">
              📅
            </Link>

            {/* CONTADOR DE SERIES (Lo mantenemos porque es útil) */}
            <div className="text-right border-l border-gray-700 pl-4">
               <span className="text-2xl font-bold block leading-none">{cart.length}</span>
               <span className="text-[10px] text-gray-500 uppercase">Series</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3">
          {exercises.map((ex) => (
            <div key={ex.id} onClick={() => openModal(ex)} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center active:scale-95 transition-transform cursor-pointer hover:border-blue-500/30">
              <div>
                <h3 className="font-bold text-white">{ex.name}</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase border border-gray-700 px-2 py-0.5 rounded-full">
                  {ex.category}
                </span>
              </div>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">+</div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="mt-8 border-t border-gray-800 pt-4">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">Resumen de hoy</h3>
            <div className="space-y-2">
              {cart.map((set, index) => (
                <div key={index} className="bg-gray-800/50 p-3 rounded flex justify-between text-sm items-center border-l-4 border-blue-500">
                  <span className="text-gray-300 font-medium">{set.exercise_name}</span>
                  <div className="text-right">
                     <span className="block font-mono text-white">{set.weight}kg x {set.reps}</span>
                     <span className="text-xs text-gray-500">RPE {set.rpe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedExercise && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="bg-gray-900 w-full max-w-md rounded-t-3xl p-6 border-t border-gray-700 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedExercise.name}</h2>
              <button onClick={() => setSelectedExercise(null)} className="text-gray-400 text-sm py-2 px-4">Cancelar</button>
            </div>

            {/* NUEVO: Tarjeta de historial dentro del modal */}
            {history && history.found ? (
              <div onClick={copyHistory} className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-lg mb-6 cursor-pointer hover:bg-yellow-900/50 transition-colors flex justify-between items-center group">
                <div>
                  <p className="text-yellow-500 text-xs font-bold uppercase mb-1">Última vez ({new Date(history.date!).toLocaleDateString()})</p>
                  <p className="text-white font-mono text-sm">
                    {history.weight}kg x {history.reps} reps <span className="text-gray-400 ml-2">RPE {history.rpe}</span>
                  </p>
                </div>
                <div className="text-yellow-500 text-xs font-bold bg-yellow-900/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  USAR ESTO
                </div>
              </div>
            ) : (
              <div className="mb-6 text-gray-500 text-xs italic text-center py-2">
                Primer registro de este ejercicio 🚀
              </div>
            )}

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Peso (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-800 text-white text-3xl font-bold p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" placeholder="0" autoFocus />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Reps</label>
                <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-gray-800 text-white text-3xl font-bold p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" placeholder="0" />
              </div>
            </div>
            
            <div className="mb-8">
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Esfuerzo (RPE)</label>
                <div className="flex justify-between bg-gray-800 rounded-xl p-1 overflow-hidden">
                  {[...Array(10)].map((_, i) => (
                    <button key={i} onClick={() => setRpe((i + 1).toString())} className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${parseInt(rpe) === i + 1 ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-gray-700'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
            </div>

            <button onClick={addSetToCart} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">✅ Agregar Serie</button>
          </div>
        </div>
      )}
      
      {cart.length > 0 && !selectedExercise && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-40">
          <button 
            onClick={finishWorkout}
            disabled={isSaving}
            className={`w-full max-w-md mx-auto font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex justify-center items-center gap-2 ${isSaving ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 text-black'}`}
          >
            {isSaving ? 'Guardando...' : `🏁 Finalizar Entrenamiento (${cart.length})`}
          </button>
        </div>
      )}
    </div>
  );
}