'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// 👇 IMPORTAMOS LA MAGIA DE LAS ANIMACIONES
import { motion, AnimatePresence } from 'framer-motion';

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

// --- CONFIGURACIÓN DE ANIMACIONES ---
// Esto define cómo aparecen los elementos de la lista uno por uno
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Retraso de 0.1s entre cada elemento
    }
  }
};

// Esto define cómo aparece CADA tarjeta individual
const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Empieza invisible y 20px más abajo
  show: { opacity: 1, y: 0 }    // Termina visible y en su lugar
};
// ------------------------------------


export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [cart, setCart] = useState<WorkoutSet[]>([]); 
  const [isSaving, setIsSaving] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  
  const [history, setHistory] = useState<HistoryData | null>(null);

  const API_URL = 'https://gym-tracker-mhcl.onrender.com'; 

  useEffect(() => {
    setMounted(true);

    fetch(`${API_URL}/exercises/`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setExercises(data);
        } else {
          console.error("Datos recibidos no son una lista:", data);
          setErrorMsg("El servidor no devolvió una lista de ejercicios.");
        }
      })
      .catch((error) => {
        console.error("Error cargando ejercicios:", error);
        setErrorMsg(`Error de conexión. Render puede estar 'durmiendo', espera 1 minuto y recarga.`);
      });
  }, []);

  const openModal = (ex: Exercise) => {
    setSelectedExercise(ex);
    setWeight('');
    setReps('');
    setRpe('');
    setHistory(null);

    fetch(`${API_URL}/history/1/${ex.id}`)
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

  const copyHistory = () => {
    if (history && history.found) {
      setWeight(history.weight?.toString() || '');
      setReps(history.reps?.toString() || '');
      setRpe(history.rpe?.toString() || '');
    }
  }

  if (!mounted) return <div className="min-h-screen bg-black text-white p-10 flex justify-center items-center">Cargando App...</div>;

  return (
    // Usamos un fondo con un degradado muy sutil para que no sea negro plano aburrido
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-4 font-sans relative overflow-hidden">
      <main className="max-w-md mx-auto pb-32 z-10 relative">
        
        {/* HEADER ANIMADO */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-end mb-8"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Gym Manager <span className="text-white">⚡️</span>
            </h1>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-gray-900/80 text-[10px] font-bold text-gray-400 border border-gray-800/50 uppercase tracking-wider backdrop-blur-sm">
              Modo Alumno
            </span>
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

        {/* LISTA DE EJERCICIOS EN CASCADA */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3"
        >
          {exercises.map((ex) => (
            // Usamos motion.div para cada tarjeta
            <motion.div 
              key={ex.id} 
              variants={itemVariants} // Aplica la animación individual
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 64, 175, 0.1)' }} // Efecto al pasar el mouse
              whileTap={{ scale: 0.98 }} // Efecto al clickear
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
              <h3 className="text-lg font-bold text-white mb-2">Servidor Dormido</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Esperando a que Render se despierte...
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* BOTÓN FINALIZAR ANIMADO */}
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

      {/* --- MODAL (POPUP) CON ANIMACIONES FLUIDAS --- */}
      {/* AnimatePresence permite animar cuando el componente se DESMONTA (se cierra) */}
      <AnimatePresence>
        {selectedExercise && (
          <>
            {/* FONDO NEGRO SEMITRANSPARENTE (FADE IN/OUT) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
              onClick={() => setSelectedExercise(null)} // Cierra al tocar el fondo
            />
            
            {/* EL PANEL DESLIZANTE (SLIDE UP/DOWN) */}
            <motion.div 
              initial={{ y: "100%" }} // Empieza 100% abajo (fuera de pantalla)
              animate={{ y: 0 }}      // Sube a su posición normal
              exit={{ y: "100%" }}    // Se va para abajo al cerrar
              transition={{ type: "spring", damping: 25, stiffness: 300 }} // Efecto resorte suave
              className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
            >
              <div className="bg-gray-950 w-full max-w-md rounded-t-[2.5rem] p-6 border-t border-gray-800 shadow-2xl shadow-blue-900/20 pointer-events-auto relative">
                {/* Pequeña barra gris para indicar que se desliza */}
                <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-6 opacity-50"></div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedExercise.name}</h2>
                   {/* Botón cerrar con pequeño efecto */}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedExercise(null)} className="bg-gray-900 rounded-full h-8 w-8 flex items-center justify-center text-gray-400 font-bold text-xl">
                    ×
                  </motion.button>
                </div>

                {/* TARJETA HISTORIAL (Animada al aparecer) */}
                <AnimatePresence>
                {history && history.found && (
                  <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} onClick={copyHistory} className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-700/30 p-4 rounded-2xl mb-6 cursor-pointer flex justify-between items-center group active:scale-95 transition-all">
                    <div>
                      <p className="text-yellow-500 text-[10px] font-bold uppercase mb-1 tracking-wider">Última sesión</p>
                      <p className="text-white font-mono text-lg font-bold">
                        {history.weight}<span className="text-sm text-gray-400 font-normal mx-1">kg</span> 
                        <span className="text-gray-600 mx-2">x</span> 
                        {history.reps}<span className="text-sm text-gray-400 font-normal ml-1">reps</span>
                      </p>
                    </div>
                    <div className="text-yellow-500 text-xs font-bold bg-yellow-900/40 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      COPIAR ⚡
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* INPUTS GRANDES */}
                <div className="flex gap-4 mb-8">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block tracking-wider">Peso (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-800 text-white text-4xl font-black p-5 rounded-2xl focus:outline-none focus:border-blue-500 text-center transition-colors" placeholder="0" autoFocus />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block tracking-wider">Reps</label>
                    <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-800 text-white text-4xl font-black p-5 rounded-2xl focus:outline-none focus:border-blue-500 text-center transition-colors" placeholder="0" />
                  </div>
                </div>
                
                {/* SELECTOR RPE */}
                <div className="mb-8">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2 tracking-wider">Esfuerzo (RPE)</label>
                    <div className="flex justify-between bg-gray-900 rounded-2xl p-1.5 border border-gray-800">
                      {[...Array(10)].map((_, i) => {
                        const val = (i + 1).toString();
                        const isActive = rpe === val;
                        let colorClass = isActive ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white';
                        // RPEs altos en rojo/naranja
                        if (isActive && i >= 8) colorClass = 'bg-red-500 text-white';
                        if (isActive && i >= 6 && i < 8) colorClass = 'bg-amber-500 text-white';
                        
                        return (
                        <motion.button key={i} whileTap={{ scale: 1.1 }} onClick={() => setRpe(val)} className={`flex-1 h-11 rounded-xl text-sm font-bold transition-all relative ${colorClass} ${isActive ? 'shadow-lg' : ''}`}>
                          {i + 1}
                          {isActive && <motion.div layoutId="rpe-indicator" className="absolute inset-0 border-2 border-white/20 rounded-xl" />}
                        </motion.button>
                      )})}
                    </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.95 }} 
                  onClick={addSetToCart} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-5 rounded-[1.5rem] text-xl shadow-xl shadow-blue-900/30 mb-4 relative overflow-hidden group"
                >
                  <span className="relative z-10">AGREGAR SERIE</span>
                  {/* Un brillo sutil al pasar el mouse */}
                  <div className="absolute inset-0 h-full w-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}