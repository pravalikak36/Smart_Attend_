import React, { useState, useEffect } from 'react';

export default function Profile({ teacher, onUpdateProfile }) {
  const [profile, setProfile] = useState({
    name: teacher.name || '',
    email: teacher.email || '',
    phone: '',
    dept: 'Department of Science',
    avatar: null
  });

  const [isEditing, setIsEditing] = useState(false);

  // Load profile specific to this email on mount
  useEffect(() => {
    const saved = localStorage.getItem(`profile_v1_${teacher.email}`);
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, [teacher.email]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...profile, avatar: reader.result };
        setProfile(updated);
        localStorage.setItem(`profile_v1_${teacher.email}`, JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    localStorage.setItem(`profile_v1_${teacher.email}`, JSON.stringify(profile));
    setIsEditing(false);
    if (onUpdateProfile) onUpdateProfile(profile); // Updates the Dashboard/Navbar name
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-white p-8 md:p-20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <h1 className="text-6xl font-black uppercase tracking-tighter">Profile</h1>
          <p className="text-indigo-500 font-bold uppercase tracking-[0.3em] text-xs mt-4">Faculty Management</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: AVATAR CARD */}
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="relative group">
              <div className="w-48 h-48 rounded-[40px] bg-indigo-600/20 border-2 border-white/5 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/50">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-7xl font-black text-indigo-500 uppercase">
                    {profile.name?.charAt(0) || profile.email?.charAt(0)}
                  </span>
                )}
              </div>
              <label className="absolute bottom-[-10px] right-[-10px] bg-indigo-600 p-3 rounded-2xl cursor-pointer hover:bg-indigo-500 transition-all shadow-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            </div>
          </div>

          {/* RIGHT: DETAILS CARD */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[50px] p-10 backdrop-blur-xl">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 disabled:opacity-50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Department</label>
                  <input 
                    disabled={!isEditing}
                    value={profile.dept}
                    onChange={(e) => setProfile({...profile, dept: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Official Email</label>
                <input 
                  disabled
                  value={profile.email}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-white/40 cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Contact Number</label>
                <input 
                  disabled={!isEditing}
                  value={profile.phone}
                  placeholder="+91 XXXXX XXXXX"
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 disabled:opacity-50 transition-all"
                />
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-4">
                {isEditing ? (
                  <button onClick={saveProfile} className="px-8 py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95">
                    Save Changes
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}