'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  function handleDemoLogin() {
    sessionStorage.setItem('darpan_user_id', 'user_demo_001');
    sessionStorage.setItem('darpan_user_name', 'Roshan');
    router.push('/dashboard');
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center selection:bg-blue-200 selection:text-blue-900 p-6 relative">
      
      <Link href="/" className="absolute top-8 left-8 text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
        ← Return Home
      </Link>

      <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 z-10 relative overflow-hidden">
        
        {/* Soft background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none"></div>

        <div className="mb-10 relative z-10 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Access</h2>
          <p className="text-sm text-gray-500">Sign in to review your clinical telemetry.</p>
        </div>

        {/* Demo Login Banner */}
        <button
          onClick={handleDemoLogin}
          className="w-full mb-6 relative z-10 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25 group"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="text-white font-black text-sm tracking-wide">Try Demo — Login as Roshan</span>
          <svg className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>

        <div className="relative z-10 flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-100" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">or sign in manually</p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <form className="flex flex-col gap-5 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700">Provider Email</label>
            <input 
              type="email" 
              placeholder="dr.smith@hospital.org" 
              className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl w-full text-gray-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">Security Key</label>
              <span className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline">Forgot?</span>
            </div>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl w-full text-gray-900 tracking-widest"
            />
          </div>

          <button type="button" className="w-full bg-gray-900 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-colors mt-1 shadow-sm">
            Sign In Securely
          </button>
        </form>

        <div className="mt-8 text-center relative z-10 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500">
            New Provider? <Link href="/signup" className="text-blue-600 font-bold hover:underline underline-offset-4 decoration-blue-200">Register Identity</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
