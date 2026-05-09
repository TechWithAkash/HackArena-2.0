import Link from 'next/link';

export default function Signup() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center selection:bg-blue-200 selection:text-blue-900 p-6 relative">
      
      <Link href="/" className="absolute top-8 left-8 text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
        ← Return Home
      </Link>

      <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 z-10 relative overflow-hidden mt-12 md:mt-0">
        
        {/* Soft background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none"></div>

        <div className="mb-10 relative z-10 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Register Patient Node</h2>
          <p className="text-sm text-gray-500">Create a secure profile for twin integration.</p>
        </div>

        <form className="flex flex-col gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700">Patient Full Name</label>
            <input 
              type="text" 
              placeholder="E.g. Jane Doe" 
              className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl w-full text-gray-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700">Primary Email</label>
            <input 
              type="email" 
              placeholder="patient@contact.org" 
              className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl w-full text-gray-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700">Secure Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl w-full text-gray-900 tracking-widest"
            />
          </div>

          <button type="button" className="w-full bg-blue-600 text-white font-bold text-sm py-4 rounded-xl hover:bg-blue-700 transition-colors mt-2 shadow-md shadow-blue-600/20">
            Initialize Twin Profile
          </button>
        </form>

        <div className="mt-8 text-center relative z-10 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500">
            Existing Patient? <Link href="/login" className="text-blue-600 font-bold hover:underline underline-offset-4 decoration-blue-200">Access Portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
