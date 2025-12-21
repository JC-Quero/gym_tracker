'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// --- INTERFACES ---
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

interface HistoryData {
  found: boolean;
  weight?: number;
  reps?: number;
  rpe?: number;
  date?: string;
}

// --- ANIMACIONES ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  
  // Datos principales
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [cart, setCart] = useState<WorkoutSet[]>([]); 
  const [isSaving, setIsSaving] = useState(false);

  // Estados del Modal "Cargar Serie"
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [history, setHistory] = useState<HistoryData | null>(null);

  // Estados del Modal "Crear Ejercicio" (NUEVO)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Piernas');
  const [isCreating, setIsCreating] = useState(false);

  const API_URL = 'https://gym-tracker-mhcl.onrender.com'; 

  // --- CARGA INICIAL ---
  useEffect(() => {
    setMounted(true);
    fetchExercises();
  }, []);

  const fetchExercises = () => {
    fetch(`${API_URL}/exercises/`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setExercises(data);
        else setErrorMsg("Error de datos.");
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg("Servidor dormido o sin conexión.");
      });
  };

  // --- FUNCIONES DE LÓGICA ---

  const openModal = (ex: Exercise) => {
    setSelectedExercise(ex);
    setWeight('');
    setReps('');
    setRpe('');
    setHistory(null);

    // Buscamos historial del usuario logueado
    const userId = localStorage.getItem('user_id') || '1';
    fetch(`${API_URL}/history/${userId}/${ex.id}`)
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("No hay historial", err));
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
    const userId = localStorage.getItem('user_id');
    
    try {
      const payload = {
        user_id: parseInt(userId || '1'), // Fallback a 1 si falla
        notes: "Entrenamiento App",
        sets: cart.map(item => ({
          exercise_id: item.exercise_id,
          reps: item.reps,
          weight: item.weight,
          rpe: item.rpe
        }))
      };
      const response = await fetch(`${API_URL}/workouts/`, {
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

  // --- NUEVA FUNCIÓN: CREAR EJERCICIO ---
  const handleCreateExercise = async () => {
    if (!newExName) return;
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/exercises/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExName,
          category: newExCategory
        })
      });

      if (response.ok) {
        // Recargamos la lista para ver el nuevo
        fetchExercises();
        setShowCreateModal(false);
        setNewExName('');
      } else {
        alert("Error al crear ejercicio");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsCreating(false);
    }
  };

  const copyHistory = () => {
    if (history && history.found) {
      setWeight(history.weight?.toString() || '');
      setReps(history.reps?.toString() || '');
      setRpe(history.rpe?.toString() || '');
    }
  }

  if (!mounted) return <div className="min-h-screen bg-black text-white p-10 flex justify-center items-center">Cargando App...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-4 font-sans relative overflow-hidden">
      <main className="max-w-md mx-auto pb-32 z-10 relative">
        
        {/* HEADER ANIMADO */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Gym Manager <span className="text-white">⚡️</span>
            </h1>
            
            {/* NUEVO BOTÓN PARA CREAR EJERCICIO */}
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-700 px-3 py-1 rounded-full text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 transition-colors flex items-center gap-1"
            >
              <span>+ Nuevo Ejercicio</span>
            </button>
          </div>
          
          <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-2xl border border-gray-800/50 backdrop-blur-md cursor-pointer hover:border-blue-500/30 transition-colors">
            <Link href="/history" className="h-10 w-10 bg-black/50 rounded-xl flex items-center justify-center text-xl">
              📅
            </Link>
            <div className="text-right border-l border-gray-800/50 pl-3 pr-2">
               <span className="text-xl font-black block leading-none text-white">{cart.length}</span>
               <span className="text-[9px] text-gray-500 uppercase font-bold">Series</span>
            </div>
          </motion.div>
        </motion.header>

        {/* LISTA DE EJERCICIOS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3"
        >
          {exercises.map((ex) => (
            <motion.div 
              key={ex.id} 
              variants={itemVariants}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 64, 175, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal(ex)} 
              className="group bg-gray-900/40 p-5 rounded-2xl border border-gray-800/50 flex justify-between items-center cursor-pointer backdrop-blur-sm transition-colors border-l-4 border-l-transparent hover:border-l-blue-500"
            >
              <div>
                <h3 className="font-bold text-lg text-gray-100 group-hover:text-white transition-colors">{ex.name}</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase bg-black/30 px-3 py-1 rounded-full tracking-wider">
                  {ex.category}
                </span>
              </div>
              <div className="h-10 w-10 bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                +
              </div>
            </motion.div>
          ))}
          
          {!errorMsg && exercises.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-800/50 rounded-2xl bg-gray-900/20">
              <span className="text-4xl mb-4 animate-pulse">😴</span>
              <h3 className="text-lg font-bold text-white mb-2">Lista Vacía</h3>
              <p className="text-sm text-gray-500 max-w-xs mb-4">
                No hay ejercicios. ¡Creá el primero!
              </p>
              <button onClick={() => setShowCreateModal(true)} className="text-blue-400 text-sm font-bold underline">Crear Ejercicio</button>
            </motion.div>
          )}
        </motion.div>

        {/* BOTÓN FINALIZAR */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="mt-8 border-t border-gray-800 pt-4 mb-20"
            >
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">Resumen de hoy</h3>
              <div className="space-y-2 mb-6">
                {cart.map((set, index) => (
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={index} className="bg-gray-800/50 p-3 rounded flex justify-between text-sm items-center border-l-4 border-blue-500">
                    <span className="text-gray-300 font-medium">{set.exercise_name}</span>
                    <div className="text-right">
                       <span className="block font-mono text-white">{set.weight}kg x {set.reps}</span>
                       <span className="text-xs text-gray-500">RPE {set.rpe}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
               <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={finishWorkout}
                  disabled={isSaving}
                  className={`w-full font-bold py-4 rounded-2xl shadow-xl flex justify-center items-center gap-2 ${isSaving ? 'bg-gray-700 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/30'}`}
                >
                  {isSaving ? 'Guardando...' : `🏁 Finalizar Entrenamiento (${cart.length})`}
                </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- MODAL 1: CARGAR SERIE --- */}
      <AnimatePresence>
        {selectedExercise && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
              onClick={() => setSelectedExercise(null)}
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
            >
              <div className="bg-gray-950 w-full max-w-md rounded-t-[2.5rem] p-6 border-t border-gray-800 shadow-2xl shadow-blue-900/20 pointer-events-auto relative">
                <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-6 opacity-50"></div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedExercise.name}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedExercise(null)} className="bg-gray-900 rounded-full h-8 w-8 flex items-center justify-center text-gray-400 font-bold text-xl">×</motion.button>
                </div>

                <AnimatePresence>
                {history && history.found && (
                  <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} onClick={copyHistory} className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-700/30 p-4 rounded-2xl mb-6 cursor-pointer flex justify-between items-center group active:scale-95 transition-all">
                    <div>
                      <p className="text-yellow-500 text-[10px] font-bold uppercase mb-1 tracking-wider">Última sesión</p>
                      <p className="text-white font-mono text-lg font-bold">
                        {history.weight}kg <span className="text-gray-600 mx-2">x</span> {history.reps}reps
                      </p>
                    </div>
                    <div className="text-yellow-500 text-xs font-bold bg-yellow-900/40 px-3 py-1.5 rounded-full">COPIAR</div>
                  </motion.div>
                )}
                </AnimatePresence>

                <div className="flex gap-4 mb-8">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block tracking-wider">Peso (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-800 text-white text-4xl font-black p-5 rounded-2xl focus:outline-none focus:border-blue-500 text-center" placeholder="0" autoFocus />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block tracking-wider">Reps</label>
                    <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-800 text-white text-4xl font-black p-5 rounded-2xl focus:outline-none focus:border-blue-500 text-center" placeholder="0" />
                  </div>
                </div>
                
                <div className="mb-8">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2 tracking-wider">Esfuerzo (RPE)</label>
                    <div className="flex justify-between bg-gray-900 rounded-2xl p-1.5 border border-gray-800">
                      {[...Array(10)].map((_, i) => (
                        <motion.button key={i} whileTap={{ scale: 1.1 }} onClick={() => setRpe((i + 1).toString())} className={`flex-1 h-11 rounded-xl text-sm font-bold transition-all ${rpe === (i + 1).toString() ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}>
                          {i + 1}
                        </motion.button>
                      ))}
                    </div>
                </div>

                <motion.button whileTap={{ scale: 0.95 }} onClick={addSetToCart} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-5 rounded-[1.5rem] text-xl shadow-xl shadow-blue-900/30 mb-4">
                  AGREGAR SERIE
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: CREAR EJERCICIO (NUEVO) --- */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
            >
              <div className="bg-gray-950 w-full max-w-md rounded-t-[2.5rem] p-6 border-t border-gray-800 shadow-2xl shadow-emerald-900/20 pointer-events-auto relative">
                <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-6 opacity-50"></div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight">Nuevo Ejercicio</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreateModal(false)} className="bg-gray-900 rounded-full h-8 w-8 flex items-center justify-center text-gray-400 font-bold text-xl">×</motion.button>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block tracking-wider">Nombre del ejercicio</label>
                    <input 
                      type="text" 
                      value={newExName} 
                      onChange={e => setNewExName(e.target.value)} 
                      className="w-full bg-gray-900 border-2 border-gray-800 text-white text-xl font-bold p-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors" 
                      placeholder="Ej: Dominadas" 
                      autoFocus 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block tracking-wider">Categoría</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['Piernas', 'Empuje', 'Tracción', 'Cardio', 'Core'].map(cat => (
                         <button 
                            key={cat}
                            onClick={() => setNewExCategory(cat)}
                            className={`p-3 rounded-xl text-sm font-bold border-2 transition-all ${newExCategory === cat ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                         >
                            {cat}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.95 }} 
                  onClick={handleCreateExercise} 
                  disabled={!newExName || isCreating}
                  className={`w-full font-bold py-5 rounded-[1.5rem] text-xl shadow-xl flex justify-center items-center gap-2 ${!newExName ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/30'}`}
                >
                  {isCreating ? 'Guardando...' : 'CREAR EJERCICIO ✨'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}