import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../db';
import { Mail, Lock, User, LogIn, UserPlus, AlertCircle, Sparkles, Car } from 'lucide-react';

interface LoginProps {
  onAuthSuccess: (user: any) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      setLoading(false);
      return;
    }

    if (isRegistering && !displayName) {
      setError('Por favor indica tu nombre.');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        const user = await signUpWithEmail(email, password, displayName);
        onAuthSuccess(user);
      } else {
        const user = await signInWithEmail(email, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      const errMessage = err?.code || err?.message || '';
      if (errMessage && (errMessage.includes('auth/') || errMessage.includes('email-already-in-use'))) {
        if (errMessage.includes('auth/invalid-credential') || errMessage.includes('auth/wrong-password')) {
          setError('Credenciales inválidas. Comprueba tu correo y contraseña.');
        } else if (errMessage.includes('auth/email-already-in-use') || errMessage.includes('email-already-in-use')) {
          setError(
            <span>
              Este correo electrónico ya está registrado.{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                }}
                className="underline font-bold text-red-950 hover:text-red-700 focus:outline-hidden"
              >
                ¿Haga clic aquí para iniciar sesión?
              </button>
            </span>
          );
        } else if (errMessage.includes('auth/weak-password')) {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else {
          setError('Ocurrió un error en la autenticación. Intenta de nuevo.');
        }
      } else {
        setError('Error al conectar. Verifica tus datos de acceso.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo completar el acceso con Google.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 pt-12 pb-8">
      {/* Visual Header Logo */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-xl flex items-center justify-center mb-4">
          <Car className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">DriverX</h1>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          Control financiero total para conductores de coches, viajes, gastos y mantenimiento.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 w-full max-w-md">
        <div className="flex border-b border-gray-100 pb-4 mb-6">
          <button
            onClick={() => { setIsRegistering(false); setError(null); }}
            className={`flex-1 pb-2 text-sm font-bold border-b-2 text-center transition-colors ${
              !isRegistering ? 'border-gray-900 text-gray-950 font-black' : 'border-transparent text-gray-400'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(null); }}
            className={`flex-1 pb-2 text-sm font-bold border-b-2 text-center transition-colors ${
              isRegistering ? 'border-gray-900 text-gray-950 font-black' : 'border-transparent text-gray-400'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5 flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Tu Nombre</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900 text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="conductor@ejemplo.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900 text-sm transition-all"
              />
            </div>
            {!isRegistering && (
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                ¿Primera vez? Puedes escribir cualquier clave para crear tu usuario de prueba local.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2.5xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 active:scale-95 transition-all disabled:opacity-55"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegistering ? (
              <>
                <UserPlus className="h-4 w-4" />
                Registrar y Acceder
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-gray-400">O ingresa con</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2.5xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.61 5.61 0 01-2.45 3.71v3.08h3.94c2.31-2.13 3.64-5.27 3.64-8.64z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.94-3.08c-1.12.75-2.54 1.21-4.02 1.21-3.11 0-5.74-2.1-6.68-4.93H1.27v3.18A11.996 11.996 0 0012 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.32 14.3c-.24-.7-.38-1.45-.38-2.3 0-.85.14-1.61.38-2.3V6.52H1.27A11.996 11.996 0 000 12c0 2.01.5 3.91 1.27 5.48l4.05-3.18z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.39 0 3.44 2.65 1.27 6.52l4.05 3.18c.94-2.83 3.57-4.95 6.68-4.95z"
            />
          </svg>
          Google Sign-In
        </button>
      </div>

      <div className="mt-8 text-center text-[11px] text-gray-400">
        DriverX v1.0 • Seguro • Optimizador de Negocio
      </div>
    </div>
  );
}
