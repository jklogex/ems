'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Sign in error:', result.error);
        }
        setError('Credenciales inválidas');
      } else if (result?.ok) {
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError('Error al iniciar sesión. Por favor, intente nuevamente.');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign in exception:', err);
      }
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="LogeX"
              width={280}
              height={84}
              className="h-20 w-auto"
              priority
            />
          </div>
          
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Equipment<br />Management<br />System -- EMS
          </h1>
          
          <p className="text-slate-400 text-lg max-w-md">
            Gestión integral de equipos, mantenimiento preventivo y correctivo para optimizar sus operaciones.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            {[
              'Control de inventario en tiempo real',
              'Órdenes de trabajo digitales',
              'Reportes y análisis de KPIs',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="flex justify-center mb-3">
              <Image
                src="/logo.png"
                alt="LogeX"
                width={220}
                height={66}
                className="h-16 w-auto"
                priority
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Equipment Management System</p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Bienvenido
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Ingrese sus credenciales para continuar
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 transition-colors placeholder:text-slate-400"
                    placeholder="usuario@empresa.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 transition-colors placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} LogeX. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
