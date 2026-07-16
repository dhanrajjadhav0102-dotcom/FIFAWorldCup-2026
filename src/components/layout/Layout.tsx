import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppContext';
import { Badge, Button } from '../ui/Primitives';
import { NotificationMessage } from '../../services/db';
import {
  Calendar,
  Ticket,
  Coffee,
  ShoppingBag,
  MapPin,
  HelpCircle,
  MessageSquare,
  LayoutDashboard,
  ShieldCheck,
  CalendarDays,
  ShieldAlert,
  Bell,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

// Custom inline SVG logo inspired by the FIFA World Cup brand emblem
const Logo: React.FC = () => (
  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="burgundyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#800020" />
        <stop offset="100%" stopColor="#4A0010" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="40" r="30" fill="url(#burgundyGrad)" stroke="url(#goldGrad)" strokeWidth="2" strokeDasharray="4 2" />
    <path d="M42 90 H58 L54 70 L64 50 C68 42 66 30 50 30 C34 30 32 42 36 50 L46 70 Z" fill="url(#goldGrad)" />
    <path d="M50 30 C58 30 60 22 50 22 C40 22 42 30 50 30 Z" fill="#FFFFFF" opacity="0.9" />
    <path d="M30 45 C40 38 60 38 70 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M25 55 C38 48 62 48 75 55" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const { notifications, reportIncident, broadcastNotification } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [_sosSuccess, setSosSuccess] = useState(false);
  
  // Real-time SOS Emergency modal alert trigger for operational staff
  const [activeSos, setActiveSos] = useState<NotificationMessage | null>(null);

  // Monitor incoming alerts for real-time SOS dispatches
  useEffect(() => {
    const latestEmergency = notifications.find(n => n.type === 'emergency');
    if (latestEmergency) {
      if (currentUser?.role === 'admin' || currentUser?.role === 'volunteer') {
        const acknowledgedSosId = localStorage.getItem('acknowledged_sos_id');
        if (acknowledgedSosId !== latestEmergency.id) {
          setActiveSos(latestEmergency);
        }
      }
    } else {
      setActiveSos(null);
    }
  }, [notifications, currentUser]);

  // Role details
  const roleColors = {
    fan: 'secondary' as const,
    volunteer: 'success' as const,
    admin: 'danger' as const
  };
  // Nav items based on role
  const navItems = {
    fan: [
      { id: 'hub', label: 'Match Hub', icon: Calendar },
      { id: 'tickets', label: 'My Tickets', icon: Ticket },
      { id: 'food', label: 'Food Ordering', icon: Coffee },
      { id: 'merch', label: 'Merchandise', icon: ShoppingBag },
      { id: 'navigation', label: 'Stadium Guide', icon: MapPin },
      { id: 'lostfound', label: 'Lost & Found', icon: HelpCircle },
      { id: 'feedback', label: 'Fan Feedback', icon: MessageSquare }
    ],
    volunteer: [
      { id: 'shifts', label: 'Duty Shifts', icon: CalendarDays },
      { id: 'incidents', label: 'Report Incident', icon: ShieldAlert },
      { id: 'navigation', label: 'Stadium Navigation', icon: MapPin },
      { id: 'lostfound', label: 'Lost & Found', icon: HelpCircle }
    ],
    admin: [
      { id: 'dashboard', label: 'Analytics Panel', icon: LayoutDashboard },
      { id: 'matches-mgr', label: 'Match & Stadiums', icon: Calendar },
      { id: 'volunteer-mgr', label: 'Volunteer Control', icon: ShieldCheck },
      { id: 'incident-mgr', label: 'Incident Dispatch', icon: ShieldAlert },
      { id: 'lostfound', label: 'Lost & Found', icon: HelpCircle },
      { id: 'alerts-mgr', label: 'Broadcast Center', icon: Bell }
    ]
  };
  const handleTriggerSOS = () => {
    setSosSending(true);
    // Log emergency in incidents collection
    reportIncident(
      'Medical Emergency',
      'critical',
      'Seat G-42 (Default SOS Trigger)',
      'EMERGENCY: Panic button triggered by user. Device location coordinates dispatched.'
    );
    
    // Broadcast warning to all dashboards in Firestore
    broadcastNotification(
      '🚨 SOS Emergency Triggered',
      `An emergency alarm has been activated by a user in Lusail Stadium. Medical personnel dispatching to Seat G-42.`,
      'emergency',
      'all'
    );
    
    setSosSending(false);
    setSosSuccess(true);
    setTimeout(() => {
      setSosSuccess(false);
      setSosModalOpen(false);
    }, 3000);
  };

  // Filtered notifications
  const userNotifications = notifications.filter(n => {
    if (n.targetRole === 'all') return true;
    if (currentUser?.role === 'admin') return true;
    return n.targetRole === currentUser?.role;
  });

  // Dynamic themes matching all three dashboards
  const getRoleThemeStyles = (role: string) => {
    switch (role) {
      case 'fan':
        return {
          backgroundImage: "linear-gradient(to bottom, rgba(8, 10, 24, 0.88), rgba(8, 10, 24, 0.96)), url('/dashboard-bg.jpg')",
          glowClass: 'hover:shadow-[0_0_15px_rgba(169,138,72,0.25)] hover:border-fifa-gold/40 hover:bg-fifa-gold/5 transition-all duration-300',
          activeNav: 'bg-fifa-gold text-fifa-dark font-extrabold shadow-[0_0_15px_rgba(169,138,72,0.3)] border-l-4 border-white',
          navIconActive: 'text-fifa-dark'
        };
      case 'volunteer':
        return {
          backgroundImage: "linear-gradient(to bottom, rgba(8, 20, 16, 0.88), rgba(8, 12, 10, 0.96)), url('/dashboard-bg.jpg')",
          glowClass: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:border-fifa-emerald/40 hover:bg-fifa-emerald/5 transition-all duration-300',
          activeNav: 'bg-fifa-emerald text-white font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)] border-l-4 border-fifa-gold',
          navIconActive: 'text-white'
        };
      case 'admin':
      default:
        return {
          backgroundImage: "linear-gradient(to bottom, rgba(16, 8, 14, 0.88), rgba(10, 8, 12, 0.96)), url('/dashboard-bg.jpg')",
          glowClass: 'hover:shadow-[0_0_15px_rgba(138,21,56,0.25)] hover:border-fifa-burgundy/40 hover:bg-fifa-burgundy/5 transition-all duration-300',
          activeNav: 'bg-fifa-burgundy text-white font-extrabold shadow-[0_0_15px_rgba(138,21,56,0.3)] border-l-4 border-fifa-gold',
          navIconActive: 'text-fifa-gold'
        };
    }
  };

  const theme = getRoleThemeStyles(currentUser?.role || 'fan');

  // Set CSS Variables on document root for Primitives Card hover/glow colors
  useEffect(() => {
    if (currentUser?.role) {
      document.documentElement.style.setProperty('--role-glow-color', 
        currentUser.role === 'fan' ? 'rgba(169, 138, 72, 0.5)' : 
        currentUser.role === 'volunteer' ? 'rgba(16, 185, 129, 0.5)' : 
        'rgba(138, 21, 56, 0.5)'
      );
      document.documentElement.style.setProperty('--role-border-color', 
        currentUser.role === 'fan' ? 'rgba(169, 138, 72, 0.45)' : 
        currentUser.role === 'volunteer' ? 'rgba(16, 185, 129, 0.45)' : 
        'rgba(138, 21, 56, 0.45)'
      );
    }
  }, [currentUser]);

  return (
    <div 
      className="min-h-screen flex text-white font-sans bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{ backgroundImage: theme.backgroundImage }}
    >
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-fifa-dark/45 backdrop-blur-md border-r border-gray-800/40 p-6 space-y-6 flex-shrink-0">
        {/* Branding */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-0.5 bg-fifa-burgundy/10 rounded-xl border border-fifa-gold-light/40 shadow-lg">
            <Logo />
          </div>
          <div>
            <h1 className="text-md font-bold bg-gradient-to-r from-white to-fifa-gold-light bg-clip-text text-transparent uppercase tracking-wider leading-tight">FIFA World Cup</h1>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Operations Hub</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-fifa-dark/60 rounded-xl p-4 border border-gray-800/80 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-fifa-burgundy flex items-center justify-center font-bold text-white text-lg">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-sm truncate">{currentUser?.name || 'Guest'}</h3>
              <Badge variant={roleColors[currentUser?.role || 'fan']} className="capitalize">
                {currentUser?.role || 'fan'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems[currentUser?.role || 'fan'].map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                  active
                    ? theme.activeNav
                    : 'text-gray-400 hover:text-white ' + theme.glowClass
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? theme.navIconActive : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Log Out */}
        <Button variant="ghost" onClick={logout} className="justify-start w-full text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="bg-fifa-dark/25 backdrop-blur-md border-b border-gray-850/30 h-16 px-6 flex items-center justify-between z-20 flex-shrink-0">
          {/* Left: Mobile Menu Toggle */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white p-1 hover:bg-gray-800/50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-3 font-bold text-sm bg-gradient-to-r from-fifa-burgundy-light to-fifa-gold-light bg-clip-text text-transparent">WC PORTAL</span>
          </div>

          {/* Center Title for Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <Badge variant="primary" className="text-[10px] uppercase font-bold tracking-widest">Live Operations</Badge>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-400">Match Day Dashboard</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* SOS panic button */}
            <Button
              variant="danger"
              onClick={() => setSosModalOpen(true)}
              className="animate-pulse flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 hover:animate-none border border-red-500 shadow-lg shadow-red-600/30"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS EMERGENCY</span>
            </Button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-800/50 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {userNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border border-fifa-cardDark rounded-full" />
                )}
              </button>

              {/* Dropdown Notifications */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-fifa-cardDark border border-gray-800 rounded-xl shadow-2xl p-4 z-30 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                    <h3 className="font-bold text-sm text-fifa-gold-light">Broadcast Alerts</h3>
                    <button onClick={() => setNotifOpen(false)} className="text-xs text-gray-500 hover:text-white">Close</button>
                  </div>
                  {userNotifications.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No new alerts.</p>
                  ) : (
                    <div className="space-y-3">
                      {userNotifications.map(n => (
                        <div key={n.id} className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                          n.type === 'emergency'
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : n.type === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                            : 'bg-fifa-dark border-gray-800/60 text-gray-300'
                        }`}>
                          <div className="font-bold flex items-center justify-between mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[9px] text-gray-500">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p>{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Emergency Banner Alert at top of body if critical status exists */}
        {userNotifications.some(n => n.type === 'emergency') && (
          <div className="bg-red-600/90 text-white text-xs px-6 py-2 flex items-center justify-between z-10 animate-pulse border-b border-red-700 font-bold">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>ACTIVE SYSTEM EMERGENCY: SOS incident reported. Operations team dispatched. Stay alert.</span>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent relative">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-72 max-w-xs bg-fifa-dark/75 backdrop-blur-md border-r border-gray-800/60 p-5 z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3 mb-6 mt-2">
              <Logo />
              <div>
                <h2 className="text-md font-bold text-white tracking-wide leading-tight">FIFA World Cup</h2>
                <span className="text-[10px] text-gray-500 font-bold tracking-wider block">MOBILE HUB</span>
              </div>
            </div>

            {/* Profile Detail */}
            <div className="bg-fifa-dark/60 rounded-xl p-3 border border-gray-800 mb-6 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-fifa-burgundy flex items-center justify-center font-bold text-white text-sm">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-xs truncate w-32">{currentUser?.name}</h4>
                  <Badge variant={roleColors[currentUser?.role || 'fan']} className="text-[9px] px-2 py-0">
                    {currentUser?.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems[currentUser?.role || 'fan'].map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs transition-all duration-300 ${
                      active
                        ? theme.activeNav
                        : 'text-gray-400 hover:text-white ' + theme.glowClass
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? theme.navIconActive : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Log Out */}
            <Button variant="ghost" onClick={logout} className="justify-start w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-4 text-xs h-9">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      )}

      {/* SOS CONFIRMATION TRIGGER MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fifa-cardDark border border-red-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-red-600 px-5 py-3 text-white font-extrabold text-xs tracking-wider uppercase flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>Confirm SOS Medical/Security Alert</span>
            </div>
            <div className="p-5 text-left text-xs space-y-4">
              <p className="text-gray-300 leading-relaxed font-medium">
                Warning: Triggering the panic alarm dispatches stadium security, paramedics, and volunteers immediately to your seat location.
              </p>
              
              <div className="flex space-x-2 pt-2 border-t border-gray-850">
                <Button variant="ghost" onClick={() => setSosModalOpen(false)} className="flex-1 py-2 text-xs">
                  Cancel
                </Button>
                <Button variant="danger" isLoading={sosSending} onClick={handleTriggerSOS} className="flex-1 py-2 text-xs font-bold uppercase">
                  Trigger SOS Alarm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time SOS Critical Alarm Overlay Dispatcher popup for Admins and Volunteers */}
      {activeSos && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-fifa-cardDark border-2 border-red-500 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-red-650 px-6 py-4 flex items-center space-x-3 text-white">
              <AlertTriangle className="w-8 h-8 animate-pulse text-white flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm tracking-wide uppercase">🚨 EMERGENCY ALARM TRIGGERED</h3>
                <span className="text-[10px] text-red-100 font-bold uppercase tracking-wider">Immediate Dispatch Coordinates</span>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-left">
              <div className="bg-fifa-dark p-4 rounded-xl border border-red-500/20 space-y-2">
                <span className="text-[9px] uppercase font-bold text-red-400 block">Incident Location Details</span>
                <p className="font-bold text-xs text-white">{activeSos.title}</p>
                <p className="text-xs text-gray-300 leading-normal">{activeSos.content}</p>
              </div>

              <div className="text-[10px] text-gray-500 font-semibold flex items-center justify-between">
                <span>Time Received: {new Date(activeSos.timestamp).toLocaleTimeString()}</span>
                <span className="text-red-400 font-bold uppercase">Action Status: Urgent Dispatch</span>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="danger"
                  className="flex-1 py-2.5 font-bold uppercase text-xs"
                  onClick={() => {
                    localStorage.setItem('acknowledged_sos_id', activeSos.id);
                    setActiveSos(null);
                  }}
                >
                  Acknowledge & Clear Alarm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
