import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

const FanPortal = React.lazy(() => import('./modules/fan/FanPortal').then(m => ({ default: m.FanPortal })));
const VolunteerPortal = React.lazy(() => import('./modules/volunteer/VolunteerPortal').then(m => ({ default: m.VolunteerPortal })));
const AdminDashboard = React.lazy(() => import('./modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Chatbot = React.lazy(() => import('./components/ai/Chatbot').then(m => ({ default: m.Chatbot })));
const StadiumMap = React.lazy(() => import('./components/shared/StadiumMap').then(m => ({ default: m.StadiumMap })));
import { Button, Card, Input, Badge } from './components/ui/Primitives';
import { UserRole } from './services/db';
import { Globe, ShieldCheck, User, Users, AlertCircle, MapPin } from 'lucide-react';

function App() {
  const { currentUser, login, signup, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('hub');
  
  // Authentication states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('fan');
  const [isSignUp, setIsSignUp] = useState(false); // Toggle registration vs login for Fans
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showGuestMap, setShowGuestMap] = useState(false);

  // Sync active section when role changes or user logs in
  useEffect(() => {
    if (currentUser) {
      setAuthError(null);
      if (currentUser.role === 'fan') {
        setActiveSection('hub');
      } else if (currentUser.role === 'volunteer') {
        setActiveSection('shifts');
      } else if (currentUser.role === 'admin') {
        setActiveSection('dashboard');
      }
    }
  }, [currentUser]);

  // Reset states when changing tabs
  const handleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setIsSignUp(false);
    setEmail('');
    setName('');
    setPassword('');
    setAuthError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAuthIsLoading(true);
    setAuthError(null);
    try {
      if (selectedRole === 'fan') {
        if (isSignUp) {
          if (!name.trim()) {
            throw new Error('Please enter your full name to register.');
          }
          if (!password) {
            throw new Error('Please enter a password for your account.');
          }
          await signup(email, name, 'fan', password);
        } else {
          if (!password) {
            throw new Error('Password is required to sign in.');
          }
          await login(email, 'fan', password);
        }
      } else {
        await login(email, selectedRole, password);
      }
    } catch (err: any) {
      let friendlyMessage = err.message || 'Authentication failed. Please check credentials.';
      const msgStr = String(friendlyMessage).toLowerCase();
      if (msgStr.includes('auth/invalid-credential')) {
        friendlyMessage = "❌ Invalid email or password. If you haven't registered yet, click 'Sign Up' below first to register your account!";
      } else if (msgStr.includes('auth/email-already-in-use')) {
        friendlyMessage = "⚠️ This email is already registered. Please sign in instead.";
      } else if (msgStr.includes('auth/weak-password')) {
        friendlyMessage = "🔒 Password is too weak. Please use at least 6 characters.";
      } else if (msgStr.includes('auth/invalid-email')) {
        friendlyMessage = "📧 Please enter a valid email address.";
      } else if (msgStr.includes('auth/missing-password')) {
        friendlyMessage = "🔑 Please enter your password.";
      }
      setAuthError(friendlyMessage);
    } finally {
      setAuthIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fifa-dark flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-fifa-burgundy border-t-fifa-gold rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Loading Operations Hub...</span>
        </div>
      </div>
    );
  }

  // 1. LANDING PAGE / HERO AUTH
  if (!currentUser) {
    if (showGuestMap) {
      return (
        <div 
          className="min-h-screen relative overflow-hidden flex flex-col justify-between font-sans text-white bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(8, 10, 24, 0.8), rgba(8, 10, 24, 0.94)), url('/login-bg.jpg')" }}
        >
          {/* Background decorative blur meshes */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-fifa-burgundy/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-fifa-gold/10 blur-[120px] pointer-events-none" />

          {/* Top Header */}
          <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGradHeroGuest" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="burgundyGradHeroGuest" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#800020" />
                    <stop offset="100%" stopColor="#4A0010" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="40" r="30" fill="url(#burgundyGradHeroGuest)" stroke="url(#goldGradHeroGuest)" strokeWidth="2" strokeDasharray="4 2" />
                <path d="M42 90 H58 L54 70 L64 50 C68 42 66 30 50 30 C34 30 32 42 36 50 L46 70 Z" fill="url(#goldGradHeroGuest)" />
                <path d="M50 30 C58 30 60 22 50 22 C40 22 42 30 50 30 Z" fill="#FFFFFF" opacity="0.9" />
                <path d="M30 45 C40 38 60 38 70 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <path d="M25 55 C38 48 62 48 75 55" stroke="url(#goldGradHeroGuest)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <strong className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-fifa-gold bg-clip-text text-transparent uppercase block">FIFA World Cup</strong>
                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase block">Kolhapur 2026 Portal</span>
              </div>
            </div>
            <Button
              onClick={() => setShowGuestMap(false)}
              className="px-4 py-1.5 text-[10px] font-bold uppercase h-8 bg-fifa-burgundy hover:bg-fifa-burgundy-light"
            >
              Sign In Portal
            </Button>
          </header>

          {/* Main Map & Message Banner */}
          <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col space-y-6 z-10">
            {/* Guest Map Welcome Banner */}
            <div className="bg-gradient-to-r from-fifa-burgundy/60 to-fifa-dark/95 border border-fifa-gold/30 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h2 className="text-base font-extrabold text-fifa-gold-light uppercase tracking-wide">Stadium 3D Interactive Map Preview</h2>
                <p className="text-xs text-gray-300 font-semibold mt-1">Log in to get full access to all stadium features.</p>
              </div>
              <Button
                onClick={() => setShowGuestMap(false)}
                className="bg-fifa-gold hover:bg-fifa-gold-light text-fifa-dark font-black uppercase text-[10px] px-4 py-2 rounded-xl shadow-lg border border-white/20"
              >
                Log In
              </Button>
            </div>

            <div className="flex-1">
              <React.Suspense fallback={
                <div className="w-full h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-fifa-burgundy border-t-fifa-gold rounded-full animate-spin" />
                </div>
              }>
                <StadiumMap />
              </React.Suspense>
            </div>
          </main>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto w-full px-6 py-5 border-t border-gray-900/60 relative z-10 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider gap-3">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span>© FIFA WORLD CUP KOLHAPUR CHALLENGE. All rights reserved.</span>
              <span className="hidden md:inline text-gray-700">|</span>
              <span>LinkedIn :- <a href="https://www.linkedin.com/in/dhanraj-jadhav-9399b53b1" target="_blank" rel="noopener noreferrer" className="hover:text-fifa-gold text-fifa-gold-light transition-colors normal-case">Dhanraj Jadhav</a></span>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-fifa-gold transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-fifa-gold transition-colors">Terms of Service</a>
            </div>
          </footer>

          {/* Floating Chatbot */}
          <Chatbot />
        </div>
      );
    }

    return (
      <div 
        className="min-h-screen relative overflow-hidden flex flex-col justify-between font-sans bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(8, 10, 24, 0.78), rgba(8, 10, 24, 0.93)), url('/login-bg.jpg')" }}
      >
        {/* Background decorative blur meshes */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-fifa-burgundy/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-fifa-gold/10 blur-[120px] pointer-events-none" />

        {/* Top Header branding */}
        <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="goldGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="burgundyGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#800020" />
                  <stop offset="100%" stopColor="#4A0010" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="40" r="30" fill="url(#burgundyGradHero)" stroke="url(#goldGradHero)" strokeWidth="2" strokeDasharray="4 2" />
              <path d="M42 90 H58 L54 70 L64 50 C68 42 66 30 50 30 C34 30 32 42 36 50 L46 70 Z" fill="url(#goldGradHero)" />
              <path d="M50 30 C58 30 60 22 50 22 C40 22 42 30 50 30 Z" fill="#FFFFFF" opacity="0.9" />
              <path d="M30 45 C40 38 60 38 70 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M25 55 C38 48 62 48 75 55" stroke="url(#goldGradHero)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <strong className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-fifa-gold bg-clip-text text-transparent uppercase block">FIFA World Cup</strong>
              <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase block">Kolhapur 2026 Portal</span>
            </div>
          </div>
          

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">RBAC & Cloud Auth Secured</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1 py-6 relative z-10">
          
          {/* Hero Left Content */}
          <div id="about-hub" className="lg:col-span-7 space-y-6 text-left">
            <Badge variant="secondary" className="uppercase font-bold tracking-widest text-[9px] px-3 py-1">
              🏆 Operations & Fan Experience Portal
            </Badge>

            {/* Clear and descriptive H1 heading for the landing page */}
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase">
              Experience the Game. <br />
              <span className="bg-gradient-to-r from-fifa-gold-light via-white to-fifa-burgundy-light bg-clip-text text-transparent">
                Secure Stadium Command.
              </span>
            </h1>

            <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
              Log in to access your designated portal. Fan authentication is secured via Firebase Authentication and Firestore DB. Predefined credentials coordinate Volunteer shifts and Organizer dashboards.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowGuestMap(true)}
                className="bg-fifa-gold hover:bg-fifa-gold-light text-fifa-dark font-extrabold uppercase text-[10px] px-4 py-2 rounded-xl shadow-lg border border-white/10 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-fifa-dark" />
                <span>Explore Stadium Map</span>
              </Button>
            </div>

            {/* Feature preview cards structured with H3 headings */}
            <div id="features-overview" className="grid grid-cols-3 gap-3 max-w-lg pt-3">
              <div className="glass-card p-3 rounded-xl border border-gray-800/60 text-xs space-y-1">
                <h3 className="text-fifa-gold font-bold block">01. Fan Hub</h3>
                <span className="text-[10px] text-gray-500">Book seating blocks, order shawarmas directly to your seat code.</span>
              </div>
              <div className="glass-card p-3 rounded-xl border border-gray-800/60 text-xs space-y-1">
                <h3 className="text-emerald-400 font-bold block">02. Volunteers</h3>
                <span className="text-[10px] text-gray-500">Geofence attendance checks, dispatch gate incidents, view shift tasks.</span>
              </div>
              <div className="glass-card p-3 rounded-xl border border-gray-800/60 text-xs space-y-1">
                <h3 className="text-red-400 font-bold block">03. Organizers</h3>
                <span className="text-[10px] text-gray-500">Monitor live charts, manage scoring events, broadcast push notifications.</span>
              </div>
            </div>


          </div>

          {/* Hero Right Auth Panel */}
          <div id="portal-access" className="lg:col-span-5 flex flex-col space-y-4 items-center justify-center w-full">
            <Card hoverEffect={false} className="w-full max-w-md p-6 glass-panel border border-gray-800/80 shadow-2xl relative">
              
              {/* Separate Tabs for Roles */}
              <div className="flex border-b border-gray-850 mb-5 pb-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('fan')}
                  className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                    selectedRole === 'fan'
                      ? 'border-fifa-gold text-white font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5 inline mr-1.5" />
                  Fan Portal
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('volunteer')}
                  className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                    selectedRole === 'volunteer'
                      ? 'border-fifa-gold text-white font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1.5" />
                  Volunteer
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('admin')}
                  className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                    selectedRole === 'admin'
                      ? 'border-fifa-gold text-white font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" />
                  Organizer
                </button>
              </div>

              {/* Security Header Description */}
              <div className="flex items-center space-x-2 pb-2.5 mb-4 border-b border-gray-850">
                <Globe className="w-4 h-4 text-fifa-gold" />
                <h3 className="font-bold text-xs text-fifa-gold-light uppercase tracking-wider">
                  {selectedRole === 'fan' && (isSignUp ? 'Fan Registration' : 'Fan Sign In')}
                  {selectedRole === 'volunteer' && 'Volunteer Security Portal'}
                  {selectedRole === 'admin' && 'Organizer Command Center Access'}
                </h3>
              </div>

              {/* Error Alert Display */}
              {authError && (
                <div className="bg-red-500/10 border border-red-500/35 p-3 rounded-lg flex items-center space-x-2 text-xs text-red-400 mb-4 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Dynamic Forms */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                {selectedRole === 'fan' ? (
                  <>
                    {isSignUp && (
                      <Input
                        label="Your Full Name"
                        placeholder="E.g., Karan"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    )}
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="karan@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Staff Username / Email"
                      type="email"
                      placeholder={selectedRole === 'admin' ? 'admin@fifa.com' : 'volunteer@fifa.com'}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <Input
                      label="Security Access Key"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </>
                )}

                <Button
                  type="submit"
                  isLoading={authIsLoading}
                  className="w-full py-3 mt-4 text-xs font-black uppercase tracking-wider"
                >
                  {selectedRole === 'fan' 
                    ? (isSignUp ? 'Register & Sign Up' : 'Log In') 
                    : 'Verify Secure Credentials'}
                </Button>

                {/* Toggle registration vs login for Fans */}
                {selectedRole === 'fan' && (
                  <div className="text-center pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setAuthError(null);
                      }}
                      className="text-xs text-fifa-gold hover:text-fifa-gold-light hover:underline font-bold"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                )}
              </form>
            </Card>
          </div>

        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto w-full px-6 py-5 border-t border-gray-900/60 relative z-10 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider gap-3">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span>© FIFA WORLD CUP KOLHAPUR CHALLENGE. All rights reserved.</span>
            <span className="hidden md:inline text-gray-800">|</span>
            <span>LinkedIn :- <a href="https://www.linkedin.com/in/dhanraj-jadhav-9399b53b1" target="_blank" rel="noopener noreferrer" className="hover:text-fifa-gold text-fifa-gold-light transition-colors normal-case">Dhanraj Jadhav</a></span>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-fifa-gold transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-fifa-gold transition-colors">Terms of Service</a>
          </div>
        </footer>
      </div>
    );
  }

  // 2. DASHBOARD VIEW WITH STRICT Access Control
  return (
    <Layout activeSection={activeSection} setActiveSection={setActiveSection}>
      <React.Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-fifa-burgundy border-t-fifa-gold rounded-full animate-spin" />
        </div>
      }>
        {currentUser.role === 'fan' && <FanPortal activeSection={activeSection} />}
        {currentUser.role === 'volunteer' && <VolunteerPortal activeSection={activeSection} />}
        {currentUser.role === 'admin' && <AdminDashboard activeSection={activeSection} />}
      </React.Suspense>
      
      {/* Floating AI chatbot globally available */}
      <React.Suspense fallback={null}>
        <Chatbot />
      </React.Suspense>
    </Layout>
  );
}

export default App;
