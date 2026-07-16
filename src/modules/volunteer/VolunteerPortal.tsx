import React, { useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Incident, VolunteerShift } from '../../services/db';
import { Button, Card, Badge, Input } from '../../components/ui/Primitives';
import { StadiumMap } from '../../components/shared/StadiumMap';
import {
  Calendar, ShieldAlert, List, MapPin, CheckCircle, Navigation, Clock, FileText, AlertTriangle, Play, HelpCircle
} from 'lucide-react';

interface VolunteerPortalProps {
  activeSection: string;
}

export const VolunteerPortal: React.FC<VolunteerPortalProps> = ({ activeSection }) => {
  const { currentUser, updateProfile } = useAuth();
  const {
    incidents, shifts, reportIncident, updateIncidentStatus, signUpForShift,
    lostFoundItems, claimLostFound
  } = useAppData();

  // Shift Check-in states
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkingInSuccess, setCheckingInSuccess] = useState<string | null>(null);

  // Incident report states
  const [incCategory, setIncCategory] = useState<'Crowd Control' | 'Medical Emergency' | 'Facilities Issue' | 'Security Alert' | 'Other'>('Crowd Control');
  const [incSeverity, setIncSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [incLoc, setIncLoc] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incSuccess, setIncSuccess] = useState(false);

  // Geofence simulated shift check-in
  const handleCheckIn = (shiftId: string) => {
    setCheckingInId(shiftId);
    
    // Simulate GPS coordinates calculation
    setTimeout(() => {
      setCheckingInId(null);
      setCheckingInSuccess(shiftId);
      
      // Update volunteer profile state
      updateProfile({
        checkedIn: true,
        checkInTime: new Date().toISOString()
      });

      // Update shift status to completed or active in LocalStorage
      const shiftsDb = JSON.parse(localStorage.getItem('fifa_shifts') || '[]') as VolunteerShift[];
      const updatedShifts = shiftsDb.map(s => s.id === shiftId ? { ...s, status: 'completed' as const } : s);
      localStorage.setItem('fifa_shifts', JSON.stringify(updatedShifts));
      
      setTimeout(() => setCheckingInSuccess(null), 3000);
    }, 1200);
  };

  const handleCheckOut = () => {
    updateProfile({
      checkedIn: false,
      checkInTime: undefined
    });
  };

  // Report incident form submission
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incLoc.trim() || !incDesc.trim()) return;

    await reportIncident(incCategory, incSeverity, incLoc, incDesc);
    setIncLoc('');
    setIncDesc('');
    setIncSuccess(true);
    setTimeout(() => setIncSuccess(false), 4000);
  };

  // Assign volunteer to incident
  const handleClaimIncident = (incId: string) => {
    updateIncidentStatus(incId, 'investigating', currentUser?.id, currentUser?.name);
  };

  // Resolve incident
  const handleResolveIncident = (incId: string) => {
    updateIncidentStatus(incId, 'resolved');
  };

  // Filter volunteer specific shifts
  const myShifts = shifts.filter(s => s.volunteerId === currentUser?.id);
  const openShifts = shifts.filter(s => !s.volunteerId);

  return (
    <div className="space-y-6">
      
      {/* 1. SHIFTS MANAGEMENT & ATTENDANCE VIEW */}
      {activeSection === 'shifts' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-fifa-gold" />
                <span>Roster & Shift Attendance</span>
              </h2>
              <p className="text-xs text-gray-400 font-medium">Verify coordinates, sign up for matches, and geofence check-in.</p>
            </div>

            {currentUser?.checkedIn && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 flex items-center space-x-2 animate-pulse">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span>ON DUTY (Checked-in: {new Date(currentUser.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                <button onClick={handleCheckOut} className="ml-3 underline text-[10px] text-red-400 hover:text-red-300">Check Out</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: My Shifts */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">My Roster</h3>

              {myShifts.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center bg-fifa-cardDark/50 border border-dashed border-gray-850 rounded-2xl">
                  No shifts signed up. View open schedules on the right panel to join the operational squad.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myShifts.map(s => {
                    const completed = s.status === 'completed';
                    const active = currentUser?.checkedIn && !completed;
                    
                    return (
                      <Card key={s.id} hoverEffect={false} className="flex flex-col justify-between p-4 space-y-3 relative overflow-hidden">
                        {completed && (
                          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-lg">
                            COMPLETED
                          </div>
                        )}
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-white">{s.title}</h4>
                          <span className="text-[10px] text-fifa-gold-light font-semibold block">{s.location}</span>
                          <p className="text-[11px] text-gray-400 leading-normal pt-1">{s.description}</p>
                        </div>

                        {/* Roster details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-semibold border-t border-gray-850 pt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-fifa-burgundy-light" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-fifa-burgundy-light" />
                            <span>{s.date}</span>
                          </div>
                        </div>

                        {/* Shift Attendance Checkin controls */}
                        <div className="pt-2 border-t border-gray-850/60">
                          {completed ? (
                            <div className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Attendance Verified</span>
                            </div>
                          ) : checkingInSuccess === s.id ? (
                            <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold p-1.5 rounded text-center border border-emerald-500/30 animate-pulse">
                              📡 Geofence Verified! Welcome to duty.
                            </div>
                          ) : (
                            <Button
                              variant={active ? 'ghost' : 'outline'}
                              disabled={!!checkingInId || currentUser?.checkedIn}
                              isLoading={checkingInId === s.id}
                              onClick={() => handleCheckIn(s.id)}
                              className="w-full text-xs font-bold py-1.5 h-8 flex items-center justify-center space-x-1"
                            >
                              <Play className="w-3 h-3 text-fifa-gold mr-1" />
                              {currentUser?.checkedIn ? 'Another Shift Active' : 'Start Duty Check-in'}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Open shifts */}
            <div>
              <Card className="p-4 flex flex-col space-y-4" hoverEffect={false}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-850 mb-1">Open Shifts Sign-up</h3>
                <p className="text-[11px] text-gray-400">Join empty rosters needing support around the stadiums.</p>
                
                {openShifts.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No open shifts available.</p>
                ) : (
                  <div className="space-y-3">
                    {openShifts.map(s => (
                      <div key={s.id} className="bg-fifa-dark/70 border border-gray-850 p-3 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white block">{s.title}</span>
                          <span className="text-[9px] text-gray-500">{s.date}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal">{s.description}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] font-semibold text-fifa-gold-light">📍 {s.location.split(' - ')[1]}</span>
                          <Button
                            variant="secondary"
                            onClick={() => signUpForShift(s.id)}
                            className="px-2 py-0.5 text-[9px] font-bold h-6 rounded"
                          >
                            Sign Up
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT INCIDENT VIEW */}
      {activeSection === 'incidents' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-fifa-gold" />
                <span>Log Stadium Incident</span>
              </h2>
              <p className="text-xs text-gray-400">Report facility failures, safety issues, medical hazards, or crowd congestion.</p>
            </div>

            {incSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 animate-bounce">
                🚨 INCIDENT DISPATCHED TO COMMAND DASHBOARD CENTER!
              </div>
            )}
          </div>

          <div className="max-w-xl mx-auto">
            <Card className="p-6" hoverEffect={false}>
              <form onSubmit={handleReportIncident} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="incident-category-select" className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light">Category</label>
                    <select
                      id="incident-category-select"
                      value={incCategory}
                      onChange={e => setIncCategory(e.target.value as any)}
                      className="bg-fifa-dark border border-gray-700/60 rounded-lg text-xs px-3.5 py-2.5 text-white focus:outline-none focus:border-fifa-gold"
                    >
                      <option value="Crowd Control">Crowd Control</option>
                      <option value="Medical Emergency">Medical Emergency</option>
                      <option value="Facilities Issue">Facilities Issue</option>
                      <option value="Security Alert">Security Alert</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="incident-severity-select" className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light">Severity Rating</label>
                    <select
                      id="incident-severity-select"
                      value={incSeverity}
                      onChange={e => setIncSeverity(e.target.value as any)}
                      className="bg-fifa-dark border border-gray-700/60 rounded-lg text-xs px-3.5 py-2.5 text-white focus:outline-none focus:border-fifa-gold"
                    >
                      <option value="low">Low (Debris, info)</option>
                      <option value="medium">Medium (Seat issue)</option>
                      <option value="high">High (Queue congestion)</option>
                      <option value="critical">Critical (Fights, Medical SOS)</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Exact Location in Stadium"
                  placeholder="E.g., Block B Row 10, Gate C escalator"
                  value={incLoc}
                  onChange={e => setIncLoc(e.target.value)}
                  required
                />

                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="incident-details-area" className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light">Incident Details</label>
                  <textarea
                    id="incident-details-area"
                    rows={4}
                    value={incDesc}
                    onChange={e => setIncDesc(e.target.value)}
                    placeholder="Describe details: symptoms of patient, specific damage, gate blockages..."
                    required
                    className="bg-fifa-dark border border-gray-700/60 rounded-lg text-xs px-3.5 py-2.5 text-white focus:outline-none focus:border-fifa-gold"
                  />
                </div>

                <Button type="submit" className="w-full font-bold py-2.5 mt-2 bg-fifa-burgundy hover:bg-fifa-burgundy-light shadow-lg">
                  Submit Tactical Alert
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* 3. ACTIVE INCIDENTS LIST VIEW */}
      {activeSection === 'incident-list' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <List className="w-5 h-5 text-fifa-gold" />
              <span>Active Tactical Dispatch List</span>
            </h2>
            <p className="text-xs text-gray-400">Investigate nearby incidents and flag them as resolved once sorted.</p>
          </div>

          {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
            <div className="bg-fifa-cardDark/50 border border-dashed border-gray-850 p-12 rounded-2xl text-center text-xs text-gray-500">
              🎉 ALL QUIET. No active incidents requiring volunteer dispatch.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incidents.filter(i => i.status !== 'resolved').map(inc => {
                const isClaimedByMe = inc.assignedVolunteerId === currentUser?.id;
                const isClaimedByOther = inc.assignedVolunteerId && !isClaimedByMe;

                return (
                  <Card key={inc.id} hoverEffect={false} className={`p-4 flex flex-col justify-between border-l-4 ${
                    inc.severity === 'critical' ? 'border-l-red-600 bg-red-950/5' : inc.severity === 'high' ? 'border-l-yellow-600 bg-yellow-950/5' : 'border-l-fifa-gold bg-fifa-cardDark'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={inc.severity === 'critical' ? 'danger' : 'warning'} className="uppercase text-[8px] font-bold">
                            {inc.severity} Severity
                          </Badge>
                          <h4 className="font-extrabold text-sm text-white mt-1">{inc.category}</h4>
                        </div>
                        <Badge variant={
                          inc.status === 'investigating' ? 'warning' : 'primary'
                        } className="capitalize text-[8px]">
                          {inc.status}
                        </Badge>
                      </div>

                      <span className="text-[10px] text-fifa-gold-light font-bold block">📍 Location: {inc.location}</span>
                      <p className="text-xs text-gray-400 leading-normal">{inc.description}</p>
                      
                      <div className="text-[9px] text-gray-500 pt-1.5 border-t border-gray-850 flex items-center justify-between">
                        <span>Reported by: {inc.reporterName}</span>
                        <span>{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-850/60 flex items-center justify-end space-x-2">
                      {inc.status === 'reported' ? (
                        <Button
                          variant="secondary"
                          onClick={() => handleClaimIncident(inc.id)}
                          className="text-[10px] px-3 py-1 font-bold h-7 rounded"
                        >
                          Claim / Investigate
                        </Button>
                      ) : isClaimedByMe ? (
                        <Button
                          variant="emerald"
                          onClick={() => handleResolveIncident(inc.id)}
                          className="text-[10px] px-3 py-1 font-bold h-7 rounded"
                        >
                          Mark Resolved
                        </Button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-semibold italic">
                          Assigned: {inc.assignedVolunteerName}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. LOST & FOUND VIEW */}
      {activeSection === 'lostfound' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-fifa-gold" />
              <span>Lost & Found Registry</span>
            </h2>
            <p className="text-xs text-gray-400">Review lost items reported by fans. Coordinate recoveries and mark items as claimed.</p>
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
                              className="px-2.5 py-1 text-[10px] font-bold h-7"
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

      {/* 5. NAVIGATION VIEW */}
      {activeSection === 'navigation' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-fifa-gold" />
              <span>Stadium Operational Map</span>
            </h2>
            <p className="text-xs text-gray-400">View safety exits, restroom coordinates, and food courts to redirect confused fans.</p>
          </div>

          <StadiumMap />
        </div>
      )}

    </div>
  );
};
