
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, UserCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (remember: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin2025') {
      onLogin(remember);
    } else {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-indigo-500/10 text-indigo-400">
            <UserCircle size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">TrainerPro</h1>
          <p className="mt-2 text-slate-400">Panel de Instructor</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="block w-full py-3 pl-10 pr-12 text-slate-100 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Recordar sesión</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transform transition active:scale-95"
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
