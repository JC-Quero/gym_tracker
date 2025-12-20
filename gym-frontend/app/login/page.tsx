'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 👇 TU URL DE RENDER
  const API_URL = 'https://gym-tracker-mhcl.onrender.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Los login de OAuth2 piden datos como "Form Data", no como JSON normal
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Usuario o contraseña incorrectos');

      const data = await res.json();
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('user_id', data.user_id);

      // Redirigimos al inicio
      router.push('/');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-white font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Gym Manager</h1>
          <p className="text-gray-400">Iniciá sesión para entrenar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: Matias"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all ${isLoading ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
          >
            {isLoading ? 'Entrando...' : 'Ingresar 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}