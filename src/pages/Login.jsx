import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login/Sign Up
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // The key used to store the password for this specific email
    const storageKey = `auth_pwd_${email.toLowerCase().trim()}`;
    const savedPassword = localStorage.getItem(storageKey);

    setTimeout(() => {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        if (savedPassword) {
          setError('ACCOUNT ALREADY EXISTS. PLEASE LOGIN.');
        } else {
          localStorage.setItem(storageKey, password);
          onLogin({ name: email.split('@')[0], email: email });
        }
      } else {
        // --- LOGIN LOGIC ---
        if (!savedPassword) {
          setError('NO ACCOUNT FOUND. PLEASE SIGN UP FIRST.');
        } else if (savedPassword !== password) {
          setError('INCORRECT SECURITY KEY.');
        } else {
          onLogin({ name: email.split('@')[0], email: email });
        }
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter">Smart<span className="text-indigo-500">Attend</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
            {isSignUp ? 'Create Faculty Account' : 'Secure Faculty Gateway'}
          </p>
        </div>

        <div className="bg-[#161b2a]/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[45px] shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Official Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-[#0b0f1a]/50 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                {isSignUp ? 'Set Security Key' : 'Security Key'}
              </label>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className={`w-full bg-[#0b0f1a]/50 border ${error ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-slate-600 hover:text-indigo-400 font-bold text-[10px]"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest ml-1 animate-pulse">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full font-black py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all mt-4"
            >
              {isLoading ? 'VERIFYING...' : isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}
            </button>
          </form>

          {/* NEW USER / SIGN UP TOGGLE */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors"
            >
              {isSignUp ? '← Back to Login' : 'New Faculty? Create Account'}
            </button>
          </div>

      <div className="mt-8 pt-8 border-t border-slate-800/30 flex flex-col gap-4">
        {/* Professional Branding & Message */}
        <div className="text-center space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Developed by <span className="text-indigo-500">Pravalika K</span>
          </p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
            "We would be happy to hear from you"
          </p>
        </div>

        <div className="flex justify-between items-center">
          {/* THE REDIRECT BUTTON */}
          <a 
            href="https://mail.google.com/mail/u/0/?fs=1&tf=cm&source=mailto&to=pravalikak15036@gmail.com"
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/20 transition-all active:scale-95"
          >
            <span className="text-xs"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Contact Developer
            </span>
          </a>
          {/* Status Indicator */}
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500/80 uppercase tracking-widest text-[8px] font-black">
              V1.0 Live
            </span>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}