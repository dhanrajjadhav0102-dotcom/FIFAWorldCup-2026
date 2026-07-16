import React, { useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge } from '../ui/Primitives';
import { ShieldCheck, ShieldAlert, QrCode, User, CheckCircle } from 'lucide-react';

export const QRVerifier: React.FC = () => {
  const { tickets, matches, updateIncidentStatus } = useAppData();
  const { currentUser } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'scanning' | 'success' | 'fraud' | 'not_found';
    message?: string;
    details?: {
      seat: string;
      match: string;
      purchaser: string;
      category: string;
    };
  }>({ status: 'idle' });

  // Load ticket options
  const handleVerify = () => {
    if (!selectedTicketId) return;

    setScanResult({ status: 'scanning' });

    setTimeout(() => {
      const ticketsDb = JSON.parse(localStorage.getItem('fifa_tickets') || '[]') as any[];
      const ticket = ticketsDb.find((t: any) => t.id === selectedTicketId || t.qrCode === selectedTicketId);

      if (!ticket) {
        setScanResult({
          status: 'not_found',
          message: 'TICKET NOT FOUND: The scanned QR code does not correspond to any active reservation.'
        });
        return;
      }

      if (ticket.status === 'used') {
        setScanResult({
          status: 'fraud',
          message: 'WARNING: DUPED TICKET ATTEMPT. This QR code has already been scanned and verified at Gate A. Ticket status is flagged as USED.',
        });
        return;
      }

      // Retrieve match details
      const match = matches.find(m => m.id === ticket.matchId);
      const matchName = match ? `${match.homeTeam} vs ${match.awayTeam}` : 'World Cup Match';

      // Update ticket status to used in LocalStorage & local state
      const updatedTickets = ticketsDb.map(t => t.id === ticket.id ? { ...t, status: 'used' } : t);
      localStorage.setItem('fifa_tickets', JSON.stringify(updatedTickets));

      setScanResult({
        status: 'success',
        message: 'TICKET VERIFIED SUCCESSFULLY: Access Granted.',
        details: {
          seat: ticket.seatCode,
          match: matchName,
          purchaser: 'Verified Holder',
          category: ticket.seatCategory
        }
      });
    }, 800);
  };

  return (
    <Card className="p-5 max-w-md mx-auto space-y-4" hoverEffect={false}>
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-800">
        <QrCode className="w-5 h-5 text-fifa-gold" />
        <h3 className="font-bold text-sm text-fifa-gold-light uppercase tracking-wider">Gate QR Verification Scanner</h3>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase text-gray-400 block">Select active Ticket QR for Verification Preview</label>
        <div className="flex space-x-2">
          <select
            value={selectedTicketId}
            onChange={e => {
              setSelectedTicketId(e.target.value);
              setScanResult({ status: 'idle' });
            }}
            className="flex-1 bg-fifa-dark border border-gray-800 text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-fifa-gold text-white"
          >
            <option value="">-- Choose Ticket Code --</option>
            {tickets.map(t => (
              <option key={t.id} value={t.id}>
                {t.qrCode} ({t.seatCode} - {t.status})
              </option>
            ))}
          </select>
          <Button onClick={handleVerify} disabled={!selectedTicketId} className="text-xs">
            Verify QR
          </Button>
        </div>
      </div>

      {/* Verify Display panel */}
      {scanResult.status === 'scanning' && (
        <div className="h-40 bg-fifa-dark/50 border border-gray-800 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <span className="w-6 h-6 border-2 border-fifa-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Decrypting Secure QR Token...</span>
          </div>
        </div>
      )}

      {scanResult.status === 'success' && scanResult.details && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-3 text-center animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">{scanResult.message}</h4>
            <span className="text-[10px] text-gray-500">Authenticated Gate Entry</span>
          </div>

          <div className="bg-fifa-dark/60 p-3 rounded-lg border border-emerald-500/15 text-left text-xs grid grid-cols-2 gap-2 text-gray-300">
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Match Event</span>
              <span className="font-semibold">{scanResult.details.match}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Seat Code</span>
              <span className="font-semibold">{scanResult.details.seat}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Category</span>
              <span className="font-semibold text-fifa-gold-light">{scanResult.details.category}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Security Log</span>
              <span className="text-emerald-400">PASSED</span>
            </div>
          </div>
        </div>
      )}

      {scanResult.status === 'fraud' && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-3 text-center animate-shake">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">FRAUD ALERT: ENTRY DENIED</h4>
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{scanResult.message}</p>
          </div>
          <div className="border border-red-500/15 bg-fifa-dark/60 p-2.5 rounded text-left text-[10px] text-red-300">
            <strong>Security Action Checklist:</strong> Log incident report immediately, confiscate fake stub, and escort individual to security gate.
          </div>
        </div>
      )}

      {scanResult.status === 'not_found' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl space-y-2 text-center">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto border border-yellow-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">CODE SCAN ERROR</h4>
          <p className="text-[10px] text-gray-400">{scanResult.message}</p>
        </div>
      )}
    </Card>
  );
};
