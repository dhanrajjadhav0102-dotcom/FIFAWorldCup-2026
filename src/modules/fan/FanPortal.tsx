import React, { useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Match, Ticket, FoodItem, MerchandiseItem, Order, LostFoundItem } from '../../services/db';
import { Button, Card, Badge, Input, Modal } from '../../components/ui/Primitives';
import { SeatMap } from '../../components/shared/SeatMap';
import { StadiumMap } from '../../components/shared/StadiumMap';
import {
  Calendar, Ticket as TktIcon, Coffee, ShoppingBag, MapPin, HelpCircle, MessageSquare,
  ChevronRight, ShoppingCart, Trash2, QrCode, Plus, Minus, Send, Star, AlertTriangle, AlertCircle
} from 'lucide-react';

interface FanPortalProps {
  activeSection: string;
}

export const FanPortal: React.FC<FanPortalProps> = ({ activeSection }) => {
  const { currentUser } = useAuth();
  const {
    matches, tickets, foodItems, merchandise, orders, lostFoundItems, feedback,
    buyTicket, placeOrder, reportLostFound, submitFeedback
  } = useAppData();

  // Selected match for ticket purchase
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState<{ category: string; seat: string; price: number } | null>(null);

  // Cart state for Food
  const [foodCart, setFoodCart] = useState<{ item: FoodItem; quantity: number }[]>([]);
  const [deliverySeat, setDeliverySeat] = useState('');
  const [foodOrderingSuccess, setFoodOrderingSuccess] = useState(false);

  // Cart state for Merch
  const [merchCart, setMerchCart] = useState<{ item: MerchandiseItem; quantity: number; size?: string }[]>([]);
  const [merchOrderingSuccess, setMerchOrderingSuccess] = useState(false);

  // Lost & Found form
  const [lostName, setLostName] = useState('');
  const [lostDesc, setLostDesc] = useState('');
  const [lostLoc, setLostLoc] = useState('');
  const [lostEmail, setLostEmail] = useState('');
  const [lfSuccess, setLfSuccess] = useState(false);

  // Feedback form
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Filter match status
  const [matchFilter, setMatchFilter] = useState<'all' | 'live' | 'scheduled' | 'completed'>('all');

  // Interactive Ticket purchase triggers
  const handleOpenTicketBooking = (match: Match) => {
    setSelectedMatch(match);
    setSelectedSeatDetails(null);
    setTicketModalOpen(true);
  };

  const handleSeatSelected = (category: 'VIP' | 'Category 1' | 'Category 2' | 'Category 3', seatCode: string, price: number) => {
    setSelectedSeatDetails({ category, seat: seatCode, price });
  };

  const handleConfirmTicketPurchase = async () => {
    if (!selectedMatch || !selectedSeatDetails) return;
    await buyTicket(
      selectedMatch.id,
      selectedSeatDetails.category as Ticket['seatCategory'],
      selectedSeatDetails.seat,
      selectedSeatDetails.price
    );
    setTicketModalOpen(false);
    setSelectedMatch(null);
    setSelectedSeatDetails(null);
  };

  // Food Cart Operations
  const addToFoodCart = (item: FoodItem) => {
    setFoodCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateFoodQty = (itemId: string, diff: number) => {
    setFoodCart(prev => prev.map(i => {
      if (i.item.id === itemId) {
        const newQty = i.quantity + diff;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleFoodCheckout = async () => {
    if (foodCart.length === 0 || !deliverySeat.trim()) return;
    const items = foodCart.map(c => ({
      itemId: c.item.id,
      name: c.item.name,
      quantity: c.quantity,
      price: c.item.price
    }));
    const total = foodCart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);

    await placeOrder('food', items, total, deliverySeat);
    setFoodCart([]);
    setDeliverySeat('');
    setFoodOrderingSuccess(true);
    setTimeout(() => setFoodOrderingSuccess(false), 4000);
  };

  // Merch Cart Operations
  const addToMerchCart = (item: MerchandiseItem, size?: string) => {
    setMerchCart(prev => {
      const existing = prev.find(i => i.item.id === item.id && i.size === size);
      if (existing) {
        return prev.map(i => i.item.id === item.id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1, size }];
    });
  };

  const updateMerchQty = (itemId: string, size: string | undefined, diff: number) => {
    setMerchCart(prev => prev.map(i => {
      if (i.item.id === itemId && i.size === size) {
        const newQty = i.quantity + diff;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleMerchCheckout = async () => {
    if (merchCart.length === 0) return;
    const items = merchCart.map(c => ({
      itemId: c.item.id,
      name: c.item.name,
      quantity: c.quantity,
      price: c.item.price,
      size: c.size
    }));
    const total = merchCart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);

    await placeOrder('merch', items, total);
    setMerchCart([]);
    setMerchOrderingSuccess(true);
    setTimeout(() => setMerchOrderingSuccess(false), 4000);
  };

  // Lost & Found report handler
  const handleReportLostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostName.trim() || !lostDesc.trim() || !lostLoc.trim() || !lostEmail.trim()) return;
    reportLostFound(lostName, lostDesc, lostLoc, lostEmail);
    setLostName('');
    setLostDesc('');
    setLostLoc('');
    setLostEmail('');
    setLfSuccess(true);
    setTimeout(() => setLfSuccess(false), 4000);
  };

  // Feedback submit handler
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    submitFeedback(feedbackRating, feedbackComment);
    setFeedbackComment('');
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 4000);
  };

  // Filtered matches
  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'all') return true;
    return m.status === matchFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. MATCH SCHEDULE / HUB VIEW */}
      {activeSection === 'hub' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-fifa-gold" />
                <span>Kolhapur Tournament Schedule & Standing</span>
              </h2>
              <p className="text-xs text-gray-400">View live match details, events tickers, and buy stadium tickets.</p>
            </div>
            
            {/* Status filters */}
            <div className="flex space-x-1.5 bg-fifa-cardDark p-1 rounded-xl border border-gray-800 self-start">
              {(['all', 'live', 'scheduled', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMatchFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${
                    matchFilter === f
                      ? 'bg-fifa-burgundy text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Matches' : `${f} matches`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(m => (
              <Card key={m.id} hoverEffect={false} className="flex flex-col space-y-4">
                {/* Header: Stage, Venue & Status badge */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-850">
                  <span className="text-[10px] font-bold text-fifa-gold-light uppercase tracking-wider">{m.group}</span>
                  <div className="flex items-center space-x-2">
                    {m.status === 'live' && (
                      <Badge variant="danger" className="animate-pulse flex items-center space-x-1 text-[9px] font-bold">
                        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                        LIVE {m.minute}'
                      </Badge>
                    )}
                    {m.status === 'completed' && <Badge variant="success">Final Score</Badge>}
                    {m.status === 'scheduled' && <Badge variant="info">Scheduled</Badge>}
                  </div>
                </div>

                {/* Main: Teams flag and Score info */}
                <div className="flex items-center justify-between py-2 px-4">
                  {/* Home Team */}
                  <div className="flex flex-col items-center space-y-1.5 w-1/3 text-center">
                    <span className="text-4xl filter drop-shadow">{m.homeFlag}</span>
                    <span className="text-xs font-bold text-white truncate max-w-full">{m.homeTeam}</span>
                  </div>

                  {/* Score or Time */}
                  <div className="flex flex-col items-center justify-center w-1/3">
                    {m.status === 'scheduled' ? (
                      <div className="text-center space-y-1">
                        <div className="text-sm font-black text-fifa-gold-light">{m.time}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{new Date(m.date).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <div className="text-2xl font-black tracking-widest text-white">
                        {m.homeScore} : {m.awayScore}
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center space-y-1.5 w-1/3 text-center">
                    <span className="text-4xl filter drop-shadow">{m.awayFlag}</span>
                    <span className="text-xs font-bold text-white truncate max-w-full">{m.awayTeam}</span>
                  </div>
                </div>

                {/* Footer: Tickets trigger & highlights details */}
                <div className="pt-3 border-t border-gray-850 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center text-[10px] uppercase font-bold text-gray-500">
                    <MapPin className="w-3 h-3 text-fifa-gold mr-1" />
                    Lusail Arena
                  </span>

                  {m.status === 'scheduled' ? (
                    <Button variant="secondary" onClick={() => handleOpenTicketBooking(m)} className="px-3.5 py-1.5 text-xs font-bold">
                      Book Tickets
                    </Button>
                  ) : m.highlights && m.highlights.length > 0 ? (
                    <div className="w-full text-[10px] text-left pt-2 space-y-1 border-t border-gray-800/40">
                      <span className="font-bold text-fifa-gold-light uppercase tracking-wider block">Match Events Ticker</span>
                      <ul className="list-disc pl-3 text-gray-400 space-y-0.5">
                        {m.highlights.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500">Waiting kickoff...</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2. MY TICKETS / BUY TICKETS VIEW */}
      {activeSection === 'tickets' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <TktIcon className="w-5 h-5 text-fifa-gold" />
              <span>Ticket Wallet & Interactive Booking</span>
            </h2>
            <p className="text-xs text-gray-400">Scan QR codes for stadium access or book tickets for upcoming matches.</p>
          </div>

          {/* Ticket Booking section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle: Ticket Wallet */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Active Entry Tickets</h3>
              
              {tickets.length === 0 ? (
                <div className="bg-fifa-cardDark/50 border border-dashed border-gray-800 rounded-xl p-8 text-center text-gray-500 text-xs">
                  No purchased tickets found. Go to the <button onClick={() => {}} className="text-fifa-gold font-bold hover:underline">Match Hub</button> to book an upcoming fixture.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tickets.map(t => {
                    const match = matches.find(m => m.id === t.matchId);
                    return (
                      <Card key={t.id} hoverEffect={false} className="border-l-4 border-l-fifa-gold bg-fifa-cardDark relative overflow-hidden flex flex-col p-4">
                        {/* Cutout overlays for retro ticket look */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-fifa-dark border border-gray-850" />
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-fifa-dark border border-gray-850" />

                        <div className="flex justify-between items-start pb-2 border-b border-dashed border-gray-800">
                          <div>
                            <h4 className="font-extrabold text-sm text-white">
                              {match?.homeFlag} {match?.homeTeam} vs {match?.awayTeam} {match?.awayFlag}
                            </h4>
                            <span className="text-[10px] text-gray-500 font-semibold">{match?.date} | {match?.time}</span>
                          </div>
                          <Badge variant={t.status === 'valid' ? 'success' : 'secondary'} className="uppercase text-[9px] font-bold">
                            {t.status}
                          </Badge>
                        </div>

                        {/* Ticket meta info */}
                        <div className="grid grid-cols-3 gap-2 py-3 text-[10px] text-gray-400 font-semibold">
                          <div>
                            <span className="text-gray-500 uppercase tracking-wider block text-[8px]">Seating Category</span>
                            <span className="text-fifa-gold-light">{t.seatCategory}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase tracking-wider block text-[8px]">Seat Code</span>
                            <span className="text-white font-bold">{t.seatCode}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase tracking-wider block text-[8px]">Paid Amount</span>
                            <span className="text-white">${t.price}</span>
                          </div>
                        </div>

                        {/* QR Code expansion */}
                        <div className="pt-3 border-t border-gray-800/40 flex items-center justify-between text-xs bg-fifa-dark/30 p-2 rounded-lg border border-gray-850">
                          <div className="flex items-center space-x-1.5">
                            <QrCode className="w-4 h-4 text-fifa-gold-light" />
                            <span className="font-mono text-[9px] text-gray-400">{t.qrCode.substring(0, 16)}...</span>
                          </div>
                          {t.status === 'valid' ? (
                            <Badge variant="primary" className="text-[9px] font-bold py-0.5 cursor-pointer hover:bg-fifa-burgundy-light">
                              View QR Stub
                            </Badge>
                          ) : (
                            <span className="text-[9px] text-gray-500">Checked In</span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Booking Form shortcut */}
            <div>
              <Card className="p-5 flex flex-col space-y-4" hoverEffect={false}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800">Quick Reservation</h3>
                <p className="text-xs text-gray-400">Select an upcoming match to initiate ticket seat mapping and instant booking checkout.</p>
                <div className="space-y-3 pt-2">
                  {matches.filter(m => m.status === 'scheduled').map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleOpenTicketBooking(m)}
                      className="w-full flex items-center justify-between bg-fifa-dark/65 border border-gray-800 hover:border-fifa-gold/30 p-3 rounded-xl transition-all text-left text-xs font-semibold"
                    >
                      <div>
                        <span className="text-white font-bold block">{m.homeTeam} vs {m.awayTeam}</span>
                        <span className="text-gray-500 text-[10px]">{m.date} | {m.time}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-fifa-gold" />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 3. FOOD ORDERING VIEW */}
      {activeSection === 'food' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Coffee className="w-5 h-5 text-fifa-gold" />
                <span>Food & Beverage Delivery Service</span>
              </h2>
              <p className="text-xs text-gray-400">Order hot stadium concessions directly to your ticketed seat code.</p>
            </div>
            
            {foodOrderingSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 animate-bounce">
                🍔 ORDER PLACED SUCCESSFULLY! DELIVERING TO SEAT CODE.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Food Menu Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Stadium Concession Menu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foodItems.map(f => (
                  <Card key={f.id} hoverEffect={false} className="flex space-x-4 p-4">
                    <div className="w-16 h-16 rounded-xl bg-fifa-dark border border-gray-800 flex items-center justify-center text-3xl flex-shrink-0">
                      {f.image}
                    </div>
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-white truncate mr-2">{f.name}</h4>
                          <span className="text-xs font-black text-fifa-gold-light">${f.price}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal mt-0.5 line-clamp-2">{f.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-850">
                        <Badge variant="primary" className="text-[9px] uppercase">{f.category}</Badge>
                        <Button
                          variant="outline"
                          onClick={() => addToFoodCart(f)}
                          className="px-2.5 py-1 text-[10px] font-bold h-7"
                        >
                          Add to Basket
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right: Cart and Orders tracker */}
            <div className="space-y-4">
              {/* Basket */}
              <Card className="p-4 flex flex-col space-y-4" hoverEffect={false}>
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-1.5 text-fifa-gold" />
                    My Order Basket
                  </span>
                  {foodCart.length > 0 && (
                    <button onClick={() => setFoodCart([])} className="text-[10px] text-red-400 hover:underline">Clear</button>
                  )}
                </div>

                {foodCart.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">Your food basket is empty.</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {foodCart.map(c => (
                        <div key={c.item.id} className="flex justify-between items-center text-xs">
                          <div className="overflow-hidden mr-2">
                            <span className="font-bold text-white truncate block">{c.item.name}</span>
                            <span className="text-[10px] text-gray-500">${c.item.price} each</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateFoodQty(c.item.id, -1)} className="p-1 bg-fifa-dark hover:bg-gray-800 rounded border border-gray-850"><Minus className="w-3 h-3 text-fifa-gold" /></button>
                            <span className="font-bold text-xs w-4 text-center">{c.quantity}</span>
                            <button onClick={() => updateFoodQty(c.item.id, 1)} className="p-1 bg-fifa-dark hover:bg-gray-800 rounded border border-gray-850"><Plus className="w-3 h-3 text-fifa-gold" /></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Meta seat order info */}
                    <div className="border-t border-gray-800 pt-3 space-y-3">
                      <Input
                        label="Seat Code for Delivery"
                        placeholder="E.g., VIP-A1 or C1-B12"
                        value={deliverySeat}
                        onChange={e => setDeliverySeat(e.target.value)}
                        className="py-1.5 text-xs"
                      />
                      
                      <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-gray-800/40">
                        <span>Grand Total:</span>
                        <span className="text-fifa-gold-light">
                          ${foodCart.reduce((acc, c) => acc + c.item.price * c.quantity, 0).toFixed(2)}
                        </span>
                      </div>

                      <Button
                        onClick={handleFoodCheckout}
                        disabled={!deliverySeat.trim()}
                        className="w-full text-xs font-bold py-2"
                      >
                        Order Concessions
                      </Button>
                    </div>
                  </>
                )}
              </Card>

              {/* Order Tracking logs */}
              <Card className="p-4" hoverEffect={false}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800 mb-3">Live Order Tracker</h3>
                
                {orders.filter(o => o.type === 'food').length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-4">No active food orders.</p>
                ) : (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {orders.filter(o => o.type === 'food').slice().reverse().map(o => (
                      <div key={o.id} className="bg-fifa-dark/70 border border-gray-850 p-2.5 rounded-xl text-[10px] space-y-1.5">
                        <div className="flex justify-between items-center font-bold">
                          <span>Seat: {o.deliverySeat}</span>
                          <Badge variant={
                            o.status === 'delivered' ? 'success' : o.status === 'preparing' ? 'warning' : 'primary'
                          } className="text-[8px] px-2 py-0">
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 truncate">
                          {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 4. MERCHANDISE VIEW */}
      {activeSection === 'merch' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-fifa-gold" />
                <span>FIFA Merchandise Store</span>
              </h2>
              <p className="text-xs text-gray-400">Order authentic accessories and official World Cup merchandise.</p>
            </div>
            
            {merchOrderingSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 animate-bounce">
                🎉 ORDER PLACED! COLLECT ITEMS AT NEAREST SOUVENIR STAND.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Merch Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Product Collections</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchandise.map(m => (
                  <Card key={m.id} hoverEffect={false} className="flex space-x-4 p-4">
                    <div className="w-20 h-20 rounded-xl bg-fifa-dark border border-gray-800 flex items-center justify-center text-4xl flex-shrink-0">
                      {m.image}
                    </div>
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-white truncate mr-2">{m.name}</h4>
                          <span className="text-xs font-black text-fifa-gold-light">${m.price}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal mt-0.5 line-clamp-2">{m.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-850">
                        <Badge variant="secondary" className="text-[9px] uppercase">{m.category}</Badge>
                        <div className="flex items-center space-x-1">
                          {m.sizes && (
                            <span className="text-[9px] text-gray-500 font-bold mr-1">Sizes: S/M/L</span>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => addToMerchCart(m, m.sizes ? 'M' : undefined)}
                            className="px-2.5 py-1 text-[10px] font-bold h-7"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart & History */}
            <div className="space-y-4">
              {/* Basket */}
              <Card className="p-4 flex flex-col space-y-4" hoverEffect={false}>
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-1.5 text-fifa-gold" />
                    Souvenir Cart
                  </span>
                  {merchCart.length > 0 && (
                    <button onClick={() => setMerchCart([])} className="text-[10px] text-red-400 hover:underline">Clear</button>
                  )}
                </div>

                {merchCart.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">Your shopping cart is empty.</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {merchCart.map((c, idx) => (
                        <div key={`${c.item.id}-${idx}`} className="flex justify-between items-center text-xs">
                          <div className="overflow-hidden mr-2">
                            <span className="font-bold text-white truncate block">{c.item.name}</span>
                            <span className="text-[10px] text-gray-500">${c.item.price} each {c.size && `• Size: ${c.size}`}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateMerchQty(c.item.id, c.size, -1)} className="p-1 bg-fifa-dark hover:bg-gray-800 rounded border border-gray-850"><Minus className="w-3 h-3 text-fifa-gold" /></button>
                            <span className="font-bold text-xs w-4 text-center">{c.quantity}</span>
                            <button onClick={() => updateMerchQty(c.item.id, c.size, 1)} className="p-1 bg-fifa-dark hover:bg-gray-800 rounded border border-gray-850"><Plus className="w-3 h-3 text-fifa-gold" /></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-800 pt-3">
                      <div className="flex justify-between text-xs font-bold pb-3">
                        <span>Total Price:</span>
                        <span className="text-fifa-gold-light">
                          ${merchCart.reduce((acc, c) => acc + c.item.price * c.quantity, 0).toFixed(2)}
                        </span>
                      </div>

                      <Button
                        onClick={handleMerchCheckout}
                        className="w-full text-xs font-bold py-2"
                      >
                        Confirm Purchase
                      </Button>
                    </div>
                  </>
                )}
              </Card>

              {/* Order history */}
              <Card className="p-4" hoverEffect={false}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800 mb-3">Order History</h3>
                {orders.filter(o => o.type === 'merch').length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-4">No past purchases.</p>
                ) : (
                  <div className="space-y-2.5 max-h-40 overflow-y-auto">
                    {orders.filter(o => o.type === 'merch').slice().reverse().map(o => (
                      <div key={o.id} className="bg-fifa-dark/70 border border-gray-850 p-2 text-[10px] flex justify-between items-center">
                        <div>
                          <span className="font-semibold block text-gray-300">Invoice: {o.id.substring(4)}</span>
                          <span className="text-gray-500">{new Date(o.orderDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-fifa-gold-light block">${o.total.toFixed(2)}</span>
                          <Badge variant="success" className="text-[8px] py-0">Completed</Badge>
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

      {/* 5. STADIUM NAVIGATION VIEW */}
      {activeSection === 'navigation' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-fifa-gold" />
              <span>Stadium Navigation & Crowd Planner</span>
            </h2>
            <p className="text-xs text-gray-400">Optimize entry pathways and locate restrooms, food courts, and medical bays inside the arena.</p>
          </div>

          <StadiumMap />
        </div>
      )}

      {/* 6. LOST & FOUND VIEW */}
      {activeSection === 'lostfound' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-fifa-gold" />
                <span>Stadium Lost & Found Registry</span>
              </h2>
              <p className="text-xs text-gray-400">Report an item you misplaced or view a real-time list of items recovered by staff volunteers.</p>
            </div>

            {lfSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 animate-bounce">
                📝 REPORT LOGGED SUCCESSFULLY! VOLUNTEERS WILL EMAIL UPON MATCH.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Report Form */}
            <div>
              <Card className="p-5" hoverEffect={false}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800 mb-4">Report Lost Item</h3>
                
                <form onSubmit={handleReportLostItem} className="space-y-3 text-left">
                  <Input
                    label="Item Name / Tag"
                    placeholder="E.g., Leather wallet, iPhone 14"
                    value={lostName}
                    onChange={e => setLostName(e.target.value)}
                    required
                  />
                  <Input
                    label="Description details"
                    placeholder="Color, brand, keychains, contents..."
                    value={lostDesc}
                    onChange={e => setLostDesc(e.target.value)}
                    required
                  />
                  <Input
                    label="Approximate Location Lost"
                    placeholder="Block A row 12, Gate B entrance"
                    value={lostLoc}
                    onChange={e => setLostLoc(e.target.value)}
                    required
                  />
                  <Input
                    label="Your Contact Email"
                    type="email"
                    placeholder="karan@example.com"
                    value={lostEmail}
                    onChange={e => setLostEmail(e.target.value)}
                    required
                  />

                  <Button type="submit" className="w-full font-bold py-2 mt-2">
                    Submit Report
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right: Recovered list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Recovered Items Log</h3>
              
              {lostFoundItems.length === 0 ? (
                <div className="bg-fifa-cardDark/50 border border-dashed border-gray-850 p-8 rounded-2xl text-center text-xs text-gray-500">
                  No items currently cataloged in the recovered database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lostFoundItems.map(item => (
                    <Card key={item.id} hoverEffect={false} className="p-4 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-white">{item.name}</h4>
                          <Badge variant={item.status === 'claimed' ? 'success' : 'warning'} className="text-[9px] uppercase">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 leading-normal">{item.description}</p>
                      </div>

                      <div className="border-t border-gray-850 pt-2 mt-3 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                        <span>📍 Found: {item.locationFound}</span>
                        <span>🗓️ {item.dateFound}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. FAN FEEDBACK VIEW */}
      {activeSection === 'feedback' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-fifa-gold" />
                <span>Tournament Feedback System</span>
              </h2>
              <p className="text-xs text-gray-400">Share your experiences and report suggestions to organizers to improve logistics.</p>
            </div>

            {feedbackSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 animate-bounce">
                💖 THANK YOU FOR YOUR FEEDBACK! REVIEWED BY FIFA AUDITORS.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Feedback Form */}
            <div>
              <Card className="p-5 space-y-4" hoverEffect={false}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light pb-2 border-b border-gray-800">Submit Review</h3>
                
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light">Rating out of 5</label>
                    <div className="flex space-x-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="text-2xl transition-transform hover:scale-110"
                        >
                          <Star className={`w-6 h-6 ${star <= feedbackRating ? 'fill-fifa-gold text-fifa-gold' : 'text-gray-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-fifa-gold-light">Comments</label>
                    <textarea
                      rows={4}
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts about stadium accessibility, volunteer guidance, or catering..."
                      required
                      className="bg-fifa-cardDark border border-gray-700/60 rounded-lg text-sm px-3.5 py-2.5 text-white focus:outline-none focus:border-fifa-gold focus:ring-0"
                    />
                  </div>

                  <Button type="submit" className="w-full font-bold py-2.5">
                    Submit Feedback
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right: Feedback Board summary */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifa-gold-light">Fan Reviews Wall</h3>
              
              {feedback.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center bg-fifa-cardDark/50 border border-dashed border-gray-850 rounded-2xl">
                  No public reviews posted yet. Be the first to leave feedback!
                </p>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1.5">
                  {feedback.map(fb => (
                    <Card key={fb.id} hoverEffect={false} className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-fifa-burgundy flex items-center justify-center text-[10px] font-bold text-white capitalize">
                            {fb.userName[0]}
                          </div>
                          <span className="text-xs font-bold text-white">{fb.userName}</span>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map(st => (
                            <Star key={st} className={`w-3.5 h-3.5 ${st <= fb.rating ? 'fill-fifa-gold text-fifa-gold' : 'text-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 italic">"{fb.comment}"</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TICKET SELECTION & RESERVATION MODAL */}
      {selectedMatch && (
        <Modal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          title={`Reserve Seats: ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="text-left text-xs font-semibold">
                {selectedSeatDetails ? (
                  <div>
                    <span className="text-gray-500 uppercase text-[8px] block">Selected Seat</span>
                    <span className="text-white font-bold">{selectedSeatDetails.seat} ({selectedSeatDetails.category})</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Pick a seat on map...</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={() => setTicketModalOpen(false)} className="text-xs">Cancel</Button>
                <Button
                  variant="secondary"
                  disabled={!selectedSeatDetails}
                  onClick={handleConfirmTicketPurchase}
                  className="text-xs font-bold"
                >
                  Pay ${selectedSeatDetails?.price.toFixed(2)}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-fifa-dark border border-gray-850 p-3.5 rounded-xl text-xs space-y-1 text-gray-300">
              <span className="text-[9px] uppercase font-bold text-fifa-gold-light block">Fixture Details</span>
              <p className="font-extrabold text-white">🏆 {selectedMatch.group}: {selectedMatch.homeFlag} {selectedMatch.homeTeam} vs {selectedMatch.awayTeam} {selectedMatch.awayFlag}</p>
              <p className="text-gray-400">📅 {new Date(selectedMatch.date).toLocaleDateString()} at {selectedMatch.time}</p>
            </div>
            
            <SeatMap onSelectSeat={handleSeatSelected} />
          </div>
        </Modal>
      )}

    </div>
  );
};
