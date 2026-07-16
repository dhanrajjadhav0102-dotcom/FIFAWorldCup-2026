import React, { useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { Match, VolunteerShift, User, NotificationMessage } from '../../services/db';
import { Button, Card, Badge, Input, Modal } from '../../components/ui/Primitives';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  BarChart2, Users, ShieldAlert, PlusCircle, Bell, Edit, Coins, Calendar, UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  activeSection: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeSection }) => {
  const {
    matches, tickets, orders, incidents, shifts, notifications,
    updateIncidentStatus, broadcastNotification, updateMatch, addMatch,
    lostFoundItems, claimLostFound
  } = useAppData();  // Match management state
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editScoreHome, setEditScoreHome] = useState(0);
  const [editScoreAway, setEditScoreAway] = useState(0);
  const [editMinute, setEditMinute] = useState(0);
  const [editStatus, setEditStatus] = useState<Match['status']>('scheduled');
  const [newHighlight, setNewHighlight] = useState('');
  const [matchEditSuccess, setMatchEditSuccess] = useState(false);

  // New match form state
  const [newMatchHome, setNewMatchHome] = useState('');
  const [newMatchAway, setNewMatchAway] = useState('');
  const [newMatchHomeFlag, setNewMatchHomeFlag] = useState('⚽');
  const [newMatchAwayFlag, setNewMatchAwayFlag] = useState('⚽');
  const [newMatchDate, setNewMatchDate] = useState('2026-07-15');
  const [newMatchTime, setNewMatchTime] = useState('18:00');
  const [newMatchGroup, setNewMatchGroup] = useState('Group A');
  const [newMatchModalOpen, setNewMatchModalOpen] = useState(false);

  // New Shift form state
  const [newShiftTitle, setNewShiftTitle] = useState('');
  const [newShiftDesc, setNewShiftDesc] = useState('');
  const [newShiftLoc, setNewShiftLoc] = useState('Lusail Stadium - Gate A');
  const [newShiftDate, setNewShiftDate] = useState('2026-07-12');
  const [newShiftStart, setNewShiftStart] = useState('16:00');
  const [newShiftEnd, setNewShiftEnd] = useState('20:00');
  const [shiftSuccess, setShiftSuccess] = useState(false);

  // Dispatch Assign State
  const [dispatchingIncidentId, setDispatchingIncidentId] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');

  // Alerts Broadcast Form State
  const [alertTitle, setAlertTitle] = useState('');
  const [alertContent, setAlertContent] = useState('');
  const [alertType, setAlertType] = useState<NotificationMessage['type']>('info');
  const [alertTarget, setAlertTarget] = useState<NotificationMessage['targetRole']>('all');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Gather simulated stats
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0) + tickets.reduce((acc, t) => acc + t.price, 0);
  const ticketsCount = tickets.length;
  const activeIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;
  
  // Load mock users from localStorage to count volunteers
  const registeredUsers = JSON.parse(localStorage.getItem('fifa_users') || '[]') as User[];
  const checkedInVolunteersCount = registeredUsers.filter(u => u.role === 'volunteer' && u.checkedIn).length;

  // Recharts Chart Formatter
  const getTicketChartData = () => {
    const cats = { VIP: 0, 'Category 1': 0, 'Category 2': 0, 'Category 3': 0 };
    tickets.forEach(t => {
      if (t.seatCategory in cats) {
        cats[t.seatCategory as keyof typeof cats] += 1;
      }
    });
    return Object.keys(cats).map(key => ({
      name: key,
      tickets: cats[key as keyof typeof cats]
    }));
  };

  const getSalesChartData = () => {
    // Generate static historical timeline with current active order sums
    return [
      { hour: '12:00', revenue: 120 },
      { hour: '14:00', revenue: 340 },
      { hour: '16:00', revenue: 560 },
      { hour: '18:00', revenue: 890 },
      { hour: '20:00', revenue: 1420 + orders.reduce((acc, o) => acc + o.total, 0) }
    ];
  };

  // Open Edit Match Modal
  const handleOpenEditMatch = (m: Match) => {
    setEditingMatch(m);
    setEditScoreHome(m.homeScore);
    setEditScoreAway(m.awayScore);
    setEditMinute(m.minute || 0);
    setEditStatus(m.status);
    setNewHighlight('');
  };

  const handleSaveMatch = () => {
    if (!editingMatch) return;
    const highlights = editingMatch.highlights || [];
    if (newHighlight.trim()) {
      highlights.push(newHighlight.trim());
    }

    const updated: Match = {
      ...editingMatch,
      homeScore: editScoreHome,
      awayScore: editScoreAway,
      minute: editMinute,
      status: editStatus,
      highlights
    };

    updateMatch(updated);
    setEditingMatch(null);
    setMatchEditSuccess(true);
    setTimeout(() => setMatchEditSuccess(false), 3000);
  };

  // Create match
  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchHome.trim() || !newMatchAway.trim()) return;

    addMatch({
      homeTeam: newMatchHome,
      awayTeam: newMatchAway,
      homeFlag: newMatchHomeFlag,
      awayFlag: newMatchAwayFlag,
      stadiumId: 'stad-1',
      date: newMatchDate,
      time: newMatchTime,
      status: 'scheduled',
      homeScore: 0,
      awayScore: 0,
      group: newMatchGroup
    });

    setNewMatchHome('');
    setNewMatchAway('');
    setNewMatchModalOpen(false);
  };

  // Create shift
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftTitle.trim() || !newShiftDesc.trim()) return;

    const currentShifts = JSON.parse(localStorage.getItem('fifa_shifts') || '[]') as VolunteerShift[];
    const created: VolunteerShift = {
      id: `shift-${Date.now()}`,
      title: newShiftTitle,
      description: newShiftDesc,
      location: newShiftLoc,
      date: newShiftDate,
      startTime: newShiftStart,
      endTime: newShiftEnd,
      status: 'open'
    };

    const updated = [...currentShifts, created];
    localStorage.setItem('fifa_shifts', JSON.stringify(updated));
    // Trigger local state re-render by loading
    shifts.push(created);

    setNewShiftTitle('');
    setNewShiftDesc('');
    setShiftSuccess(true);
    setTimeout(() => setShiftSuccess(false), 3000);
  };

  // Dispatch assignment handler
  const handleDispatchIncident = (incId: string) => {
    if (!selectedVolunteerId) return;
    const volunteer = registeredUsers.find(u => u.id === selectedVolunteerId);
    updateIncidentStatus(incId, 'investigating', selectedVolunteerId, volunteer?.name || 'Assigned Agent');
    setDispatchingIncidentId(null);
    setSelectedVolunteerId('');
  };

  // Dispatch Broadcast message
  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertContent.trim()) return;

    broadcastNotification(alertTitle, alertContent, alertType, alertTarget);
    setAlertTitle('');
    setAlertContent('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. ANALYTICS COMMAND CENTER */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverEffect={false} className="p-4 flex items-center space-x-4 border-l-4 border-l-fifa-gold">
              <div className="w-10 h-10 rounded-xl bg-fifa-gold/10 text-fifa-gold flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Gross Turnover</span>
                <span className="text-lg font-black text-white">${totalRevenue.toFixed(2)}</span>
              </div>
            </Card>

            <Card hoverEffect={false} className="p-4 flex items-center space-x-4 border-l-4 border-l-fifa-burgundy">
              <div className="w-10 h-10 rounded-xl bg-fifa-burgundy/10 text-fifa-burgundy flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Tickets Sold</span>
                <span className="text-lg font-black text-white">{ticketsCount} bookings</span>
              </div>
            </Card>

            <Card hoverEffect={false} className="p-4 flex items-center space-x-4 border-l-4 border-l-emerald-500">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Active Turnout</span>
                <span className="text-lg font-black text-white">{checkedInVolunteersCount} on duty</span>
              </div>
            </Card>

            <Card hoverEffect={false} className="p-4 flex items-center space-x-4 border-l-4 border-l-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Queued Incidents</span>
                <span className="text-lg font-black text-white">{activeIncidentsCount} active</span>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket split */}
            <Card hoverEffect={false} className="p-5 flex flex-col space-y-4">
              <span className="text-xs font-bold text-fifa-gold-light uppercase tracking-wider">Ticketing Category Distribution</span>
              <div className="h-60 w-full text-xs">
                {tickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-20">No tickets purchased yet. Run fan stubs booking to generate metrics.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTicketChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#151b2c', border: '1px solid #374151' }} />
                      <Bar dataKey="tickets" fill="#8A1538" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Sales timelines */}
            <Card hoverEffect={false} className="p-5 flex flex-col space-y-4">
              <span className="text-xs font-bold text-fifa-gold-light uppercase tracking-wider">Hourly Revenue Progression</span>
              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSalesChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="hour" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#151b2c', border: '1px solid #374151' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#A98A48" fill="rgba(169, 138, 72, 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Active incidents summary */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-fifa-gold-light uppercase tracking-wider block">Crisis Feed Ticker</span>
            
            {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center bg-fifa-cardDark border border-gray-850 rounded-xl">No active crisis logs reported.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {incidents.filter(i => i.status !== 'resolved').map(inc => (
                  <div key={inc.id} className="bg-fifa-cardDark border border-gray-850 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <Badge variant={inc.severity === 'critical' ? 'danger' : 'warning'} className="uppercase text-[8px] font-bold">
                        {inc.severity}
                      </Badge>
                      <div>
                        <strong className="text-white block">{inc.category}</strong>
                        <span className="text-gray-400 text-[10px]">📍 {inc.location} • details: {inc.description}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-fifa-gold-light font-bold italic">Assignee: {inc.assignedVolunteerName || 'Unassigned'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. MATCH & STADIUM MANAGEMENT VIEW */}
      {activeSection === 'matches-mgr' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-fifa-gold" />
                <span>Match and Live Score Controller</span>
              </h2>
              <p className="text-xs text-gray-400">Initialize new tournament matches and tweak score clocks live.</p>
            </div>
            
            <Button variant="secondary" onClick={() => setNewMatchModalOpen(true)} className="text-xs font-bold flex items-center">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Schedule Match
            </Button>
          </div>

          {matchEditSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs font-bold text-emerald-400 text-center animate-bounce">
              ⚽ MATCH SCOREBOARD UPDATED SUCCESSFULLY!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(m => (
              <Card key={m.id} hoverEffect={false} className="p-4 space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-center pb-2 border-b border-gray-850 text-xs">
                  <span className="font-bold text-fifa-gold-light uppercase">{m.group}</span>
                  <Badge variant={
                    m.status === 'live' ? 'danger' : m.status === 'completed' ? 'success' : 'info'
                  } className="uppercase text-[8px]">
                    {m.status} {m.status === 'live' && `(${m.minute}')`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-center py-2">
                  <div className="w-1/3">
                    <span className="text-3xl block mb-1">{m.homeFlag}</span>
                    <span className="font-extrabold text-xs text-white">{m.homeTeam}</span>
                  </div>
                  <div className="w-1/3 text-xl font-black tracking-widest text-fifa-gold-light">
                    {m.homeScore} : {m.awayScore}
                  </div>
                  <div className="w-1/3">
                    <span className="text-3xl block mb-1">{m.awayFlag}</span>
                    <span className="font-extrabold text-xs text-white">{m.awayTeam}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-850 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Date: {m.date} | {m.time}</span>
                  <Button variant="outline" onClick={() => handleOpenEditMatch(m)} className="text-[10px] px-2.5 py-1 h-7">
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Modify Match
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. VOLUNTEER CONTROL VIEW */}
      {activeSection === 'volunteers-mgr' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-fifa-gold" />
                <span>Volunteer Roster Coordinator</span>
              </h2>
              <p className="text-xs text-gray-400">Manage shift templates and monitor geofenced attendance reports.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Shift Form */}
            <div>
              <Card className="p-5 flex flex-col space-y-4" hoverEffect={false}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800">Add Shift Template</h3>
                {shiftSuccess && (
                  <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold p-1.5 rounded text-center border border-emerald-500/30">
                    Shift Roster Created!
                  </div>
                )}
                <form onSubmit={handleCreateShift} className="space-y-3.5 text-left text-xs">
                  <Input
                    label="Shift Title"
                    placeholder="Gate ushering, VIP coordinator..."
                    value={newShiftTitle}
                    onChange={e => setNewShiftTitle(e.target.value)}
                    required
                  />
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="shift-desc-area" className="text-xs font-bold uppercase text-fifa-gold-light">Description</label>
                    <textarea
                      id="shift-desc-area"
                      rows={3}
                      value={newShiftDesc}
                      onChange={e => setNewShiftDesc(e.target.value)}
                      placeholder="Duties expected..."
                      required
                      className="bg-fifa-dark border border-gray-700/60 rounded px-2 py-1.5 text-white"
                    />
                  </div>
                  <Input
                    label="Location Venue"
                    value={newShiftLoc}
                    onChange={e => setNewShiftLoc(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Date" type="date" value={newShiftDate} onChange={e => setNewShiftDate(e.target.value)} required />
                    <Input label="Start" placeholder="16:00" value={newShiftStart} onChange={e => setNewShiftStart(e.target.value)} required />
                    <Input label="End" placeholder="20:00" value={newShiftEnd} onChange={e => setNewShiftEnd(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full font-bold py-2 mt-1">
                    Publish Shift
                  </Button>
                </form>
              </Card>
            </div>

            {/* Attendance list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Active Duty Registry</h3>
              
              <div className="bg-fifa-cardDark border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-fifa-dark/80 text-fifa-gold-light border-b border-gray-800 font-bold">
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Attendance Status</th>
                      <th className="p-3.5">GPS Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">No active volunteers logged in.</td>
                      </tr>
                    ) : (
                      registeredUsers.map(v => (
                        <tr key={v.id} className="border-b border-gray-850 hover:bg-fifa-dark/40">
                          <td className="p-3.5 font-bold text-white">{v.name}</td>
                          <td className="p-3.5 capitalize text-gray-400">{v.role}</td>
                          <td className="p-3.5">
                            <Badge variant={v.checkedIn ? 'success' : 'secondary'} className="uppercase text-[9px] font-bold">
                              {v.checkedIn ? 'ON DUTY' : 'OFF DUTY'}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-gray-500 font-mono text-[10px]">
                            {v.checkedIn ? `GEOFENCE: APPROVED (Lusail Area)` : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. INCIDENT MANAGER / DISPATCH VIEW */}
      {activeSection === 'incident-mgr' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-fifa-gold" />
              <span>Tactical Crisis Dispatch Center</span>
            </h2>
            <p className="text-xs text-gray-400 font-medium">Coordinate emergency responders and review reported crowd logistics.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {incidents.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center bg-fifa-cardDark border border-dashed border-gray-850 rounded-xl">No logs reported.</p>
            ) : (
              <div className="bg-fifa-cardDark border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-fifa-dark text-fifa-gold-light border-b border-gray-800 font-bold">
                      <th className="p-3.5">Incident ID</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Reporter</th>
                      <th className="p-3.5">Duty Agent</th>
                      <th className="p-3.5">Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id} className="border-b border-gray-850 text-gray-300 hover:bg-fifa-dark/30">
                        <td className="p-3.5 font-bold font-mono text-white">{inc.id.substring(4)}</td>
                        <td className="p-3.5 font-bold">{inc.category}</td>
                        <td className="p-3.5">
                          <Badge variant={inc.severity === 'critical' ? 'danger' : inc.severity === 'high' ? 'warning' : 'primary'} className="uppercase">
                            {inc.severity}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-semibold text-fifa-gold-light">{inc.location}</td>
                        <td className="p-3.5 text-gray-400">{inc.reporterName}</td>
                        <td className="p-3.5 text-gray-400">
                          {inc.assignedVolunteerName || <span className="text-red-500 font-bold italic">Unassigned</span>}
                        </td>
                        <td className="p-3.5">
                          {inc.status === 'resolved' ? (
                            <Badge variant="success">RESOLVED</Badge>
                          ) : dispatchingIncidentId === inc.id ? (
                            <div className="flex space-x-1.5">
                              <select
                                aria-label="Assign volunteer to incident"
                                value={selectedVolunteerId}
                                onChange={e => setSelectedVolunteerId(e.target.value)}
                                className="bg-fifa-dark border border-gray-700 text-[10px] rounded px-1 py-0.5 focus:outline-none"
                              >
                                <option value="">Select Volunteer</option>
                                {registeredUsers.filter(u => u.role === 'volunteer').map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDispatchIncident(inc.id)}
                                disabled={!selectedVolunteerId}
                                className="px-2 py-0.5 bg-fifa-burgundy text-white rounded text-[10px] hover:bg-fifa-burgundy-light"
                              >
                                Go
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setDispatchingIncidentId(inc.id)}
                                className="px-2.5 py-1 bg-fifa-gold hover:bg-fifa-gold-light text-fifa-dark rounded font-bold text-[10px]"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={() => updateIncidentStatus(inc.id, 'resolved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ALERTS BROADCAST VIEW */}
      {activeSection === 'alerts-mgr' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Bell className="w-5 h-5 text-fifa-gold" />
                <span>Security Broadcast Center</span>
              </h2>
              <p className="text-xs text-gray-400">Broadcast warning alerts and evacuation messages to operational channels.</p>
            </div>
            
            {broadcastSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 animate-bounce">
                📢 SYSTEM BROADCAST DISPATCHED INSTANTLY!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Alert Form */}
            <div className="lg:col-span-1">
              <Card className="p-5" hoverEffect={false}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800 mb-4">Broadcast System Warning</h3>
                
                <form onSubmit={handleBroadcastAlert} className="space-y-3.5 text-left text-xs">
                  <Input
                    label="Alert Title / Headline"
                    placeholder="Evacuation warning, metro delayed..."
                    value={alertTitle}
                    onChange={e => setAlertTitle(e.target.value)}
                    required
                  />

                  <div className="flex flex-col space-y-1">
                    <label htmlFor="broadcast-body-area" className="text-xs font-bold uppercase text-fifa-gold-light">Alert Body details</label>
                    <textarea
                      id="broadcast-body-area"
                      rows={4}
                      value={alertContent}
                      onChange={e => setAlertContent(e.target.value)}
                      placeholder="Type guidance details..."
                      required
                      className="bg-fifa-dark border border-gray-700/60 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label htmlFor="broadcast-severity-select" className="text-xs font-bold uppercase text-fifa-gold-light">Type / Severity</label>
                      <select
                        id="broadcast-severity-select"
                        value={alertType}
                        onChange={e => setAlertType(e.target.value as any)}
                        className="bg-fifa-dark border border-gray-700 rounded px-2.5 py-2 text-xs"
                      >
                        <option value="info">Info (Default Blue)</option>
                        <option value="warning">Warning (Yellow Glow)</option>
                        <option value="emergency">Emergency (Red Flash)</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label htmlFor="broadcast-target-select" className="text-xs font-bold uppercase text-fifa-gold-light">Target Audience</label>
                      <select
                        id="broadcast-target-select"
                        value={alertTarget}
                        onChange={e => setAlertTarget(e.target.value as any)}
                        className="bg-fifa-dark border border-gray-700 rounded px-2.5 py-2 text-xs"
                      >
                        <option value="all">All Fans & Volunteers</option>
                        <option value="fan">Fans Only</option>
                        <option value="volunteer">Volunteers Only</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-bold py-2.5 mt-2 bg-fifa-burgundy hover:bg-fifa-burgundy-light shadow-lg">
                    Send Broadcast Alert
                  </Button>
                </form>
              </Card>
            </div>

            {/* Broadcast lists */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Historical Dispatch log</h3>
              
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                {notifications.map(n => (
                  <Card key={n.id} hoverEffect={false} className={`p-4 flex flex-col justify-between border-l-4 ${
                    n.type === 'emergency' ? 'border-l-red-650 bg-red-950/5' : n.type === 'warning' ? 'border-l-yellow-600 bg-yellow-950/5' : 'border-l-fifa-gold bg-fifa-cardDark'
                  }`}>
                    <div className="flex justify-between items-center pb-1.5 border-b border-gray-850 text-xs">
                      <strong className="text-white">{n.title}</strong>
                      <Badge variant={n.type === 'emergency' ? 'danger' : n.type === 'warning' ? 'warning' : 'primary'} className="uppercase text-[8px]">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal pt-2">{n.content}</p>
                    
                    <div className="pt-2 text-[9px] text-gray-500 font-semibold border-t border-gray-850/60 mt-2 flex items-center justify-between">
                      <span>Recipient Channel: {n.targetRole.toUpperCase()}</span>
                      <span>{new Date(n.timestamp).toLocaleString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. LOST & FOUND VIEW */}
      {activeSection === 'lostfound' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-fifa-gold" />
              <span>Lost & Found Central Registry</span>
            </h2>
            <p className="text-xs text-gray-400">Review reported items from fans and process recovered/claimed handovers.</p>
          </div>

          <div className="bg-fifa-cardDark border border-gray-800 rounded-xl overflow-hidden">
            {lostFoundItems.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">No lost items currently reported in the database.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-fifa-dark text-fifa-gold-light border-b border-gray-800 font-bold">
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Location Found</th>
                      <th className="p-3.5">Date Reported</th>
                      <th className="p-3.5">Contact Email</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lostFoundItems.map(item => (
                      <tr key={item.id} className="border-b border-gray-850 text-gray-300 hover:bg-fifa-dark/30">
                        <td className="p-3.5 font-bold text-white">{item.name}</td>
                        <td className="p-3.5 text-gray-400 max-w-xs truncate" title={item.description}>{item.description}</td>
                        <td className="p-3.5 font-semibold text-fifa-gold-light">{item.locationFound}</td>
                        <td className="p-3.5 text-gray-500">{item.dateFound}</td>
                        <td className="p-3.5 text-gray-400">{item.contactEmail}</td>
                        <td className="p-3.5">
                          <Badge variant={item.status === 'claimed' ? 'success' : 'warning'} className="uppercase">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          {item.status === 'lost' ? (
                            <Button
                              variant="secondary"
                              onClick={() => claimLostFound(item.id)}
                              className="px-2.5 py-1 text-[10px] font-bold h-7 animate-pulse"
                            >
                              Mark Claimed
                            </Button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold">Handed Over</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODIFY MATCH DETAILS MODAL */}
      {editingMatch && (
        <Modal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          title={`Modify Match: ${editingMatch.homeTeam} vs ${editingMatch.awayTeam}`}
          footer={
            <div className="flex justify-end space-x-2 w-full">
              <Button variant="ghost" onClick={() => setEditingMatch(null)} className="text-xs">Cancel</Button>
              <Button variant="secondary" onClick={handleSaveMatch} className="text-xs font-bold">
                Save Adjustments
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`${editingMatch.homeTeam} Score`}
                type="number"
                value={editScoreHome}
                onChange={e => setEditScoreHome(Number(e.target.value))}
              />
              <Input
                label={`${editingMatch.awayTeam} Score`}
                type="number"
                value={editScoreAway}
                onChange={e => setEditScoreAway(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Elapsed Minute"
                type="number"
                value={editMinute}
                onChange={e => setEditMinute(Number(e.target.value))}
              />
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="match-status-select" className="text-xs font-bold uppercase text-fifa-gold-light">Match Status</label>
                <select
                  id="match-status-select"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="bg-fifa-dark border border-gray-700 rounded px-2.5 py-2 text-xs"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <Input
              label="Log Goal / Event Event highlight"
              placeholder="E.g., Messi goal penalty kick - 23'"
              value={newHighlight}
              onChange={e => setNewHighlight(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {/* SCHEDULE NEW FIXTURE MODAL */}
      {newMatchModalOpen && (
        <Modal
          isOpen={newMatchModalOpen}
          onClose={() => setNewMatchModalOpen(false)}
          title="Schedule New Tournament Match"
        >
          <form onSubmit={handleCreateMatch} className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Home Team"
                placeholder="E.g., Brazil, USA"
                value={newMatchHome}
                onChange={e => setNewMatchHome(e.target.value)}
                required
              />
              <Input
                label="Home Flag Emoji"
                placeholder="E.g., 🇧🇷, 🇺🇸"
                value={newMatchHomeFlag}
                onChange={e => setNewMatchHomeFlag(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Away Team"
                placeholder="E.g., Spain, Japan"
                value={newMatchAway}
                onChange={e => setNewMatchAway(e.target.value)}
                required
              />
              <Input
                label="Away Flag Emoji"
                placeholder="E.g., 🇪🇸, 🇯🇵"
                value={newMatchAwayFlag}
                onChange={e => setNewMatchAwayFlag(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input label="Date" type="date" value={newMatchDate} onChange={e => setNewMatchDate(e.target.value)} required />
              <Input label="Time" type="time" value={newMatchTime} onChange={e => setNewMatchTime(e.target.value)} required />
              <div className="flex flex-col space-y-1 w-full">
                <label htmlFor="match-group-select" className="text-[10px] uppercase font-bold text-fifa-gold-light block">Group Stage</label>
                <select
                  id="match-group-select"
                  value={newMatchGroup}
                  onChange={e => setNewMatchGroup(e.target.value)}
                  className="bg-fifa-dark border border-gray-700/60 rounded text-xs px-2.5 py-2.5 focus:outline-none"
                >
                  <option value="Group A">Group A</option>
                  <option value="Group B">Group B</option>
                  <option value="Group C">Group C</option>
                  <option value="Group D">Group D</option>
                  <option value="Round of 16">Round of 16</option>
                  <option value="Quarter Final">Quarter Final</option>
                  <option value="Semi Final">Semi Final</option>
                  <option value="Final">Final Match</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-850">
              <Button type="button" variant="ghost" onClick={() => setNewMatchModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="secondary">Create Fixture</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
