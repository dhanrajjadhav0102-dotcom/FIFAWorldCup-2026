import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppContext';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const { currentUser } = useAuth();
  const { tickets, matches } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: '👋 Ahlan! Welcome to the FIFA World Cup AI Assistant. Ask me anything about matches, stadium navigation, food ordering, ticket policies, or volunteer check-ins!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'When is the Final match?',
    'How do I buy a ticket?',
    'Can I order food to my seat?',
    'What do volunteers do?',
    'Where is Lusail Stadium?'
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    
    // User seating / Route request
    if (q.includes('seat') || q.includes('route') || q.includes('my ticket') || q.includes('direction') || q.includes('gate') || q.includes('how to get to') || q.includes('where is my')) {
      const userTickets = tickets.filter(t => t.userId === currentUser?.id);
      if (userTickets.length === 0) {
        return '🎟️ Seating Route Guide: I could not find any active tickets booked under your account. To book a ticket and view your seat navigation, go to the "My Tickets" or "Match Hub" tab, select a match, and pick a seat on the interactive stadium map. Once booked, ask me about your seat route and I will give you the exact gate entry and custom directions!';
      }
      
      const activeTicket = userTickets[0]; // grab first ticket
      const match = matches.find(m => m.id === activeTicket.matchId);
      const matchLabel = match ? `${match.homeTeam} vs ${match.awayTeam}` : 'World Cup Match';
      const category = activeTicket.seatCategory;
      const seat = activeTicket.seatCode;
      
      // Determine route based on Category and Seat Code
      let gate = 'Gate A (North)';
      let routeDescription = '';
      
      if (category === 'VIP' || seat.startsWith('V') || seat.startsWith('A')) {
        gate = 'Gate 1 (VVIP)';
        routeDescription = 'Enter via Gate 1 (VVIP). Take the gold elevator up to Level 3, go left past the VVIP Lounge, and proceed directly to VIP Box Row A, Seat ' + seat + '.';
      } else if (category === 'Category 1' || seat.startsWith('B') || seat.startsWith('C')) {
        gate = 'Gate A (North)';
        routeDescription = 'Enter via Gate A (North). Scan your ticket, head left past the central concession court, and take escalator 2A up to Level 1. Locate Section 102, Row B, Seat ' + seat + '.';
      } else if (category === 'Category 2' || seat.startsWith('D')) {
        gate = 'Gate B (East)';
        routeDescription = 'Enter via Gate B (East). Head straight past the supporter merch stand, go up ramp 3B to the upper tier level, and locate Block E section 4, Seat ' + seat + '.';
      } else {
        gate = 'Gate C (South)';
        routeDescription = 'Enter via Gate C (South). Head right, take the general stairwell up to tier 2, and enter Block G section 8, Row E, Seat ' + seat + '.';
      }
      
      return `🎫 **Active Ticket Seat Information**:\n• **Match**: ${matchLabel}\n• **Seating Tier**: ${category}\n• **Seat Number**: ${seat}\n\n🧭 **Custom Stadium Route Guide**:\n1. Arrive at **${gate}** (closest entry point).\n2. Scan your secure QR Ticket at the turnstile.\n3. **Navigation**: ${routeDescription}\n4. If you get lost, ask any Volunteer wearing a green badge for guidance!`;
    }

    // Greetings
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('good morning') || q.includes('good afternoon') || q.includes('good evening') || q.includes('greetings')) {
      return '👋 Ahlan! Hello there! I am your FIFA World Cup Assistant. How can I help you today? You can select one of the common questions or ask me about match schedules, ticket bookings, food orders, or volunteer tasks!';
    }
    
    // Identity/Who are you
    if (q.includes('who are you') || q.includes('your name') || q.includes('what are you') || q.includes('introduce')) {
      return '🤖 I am the official FIFA Kolhapur 2026 AI Operations & Match Assistant. I help fans navigate the stadium, book tickets, and order food, and help volunteers check in for shifts and track incidents.';
    }

    // Help / Capabilities
    if (q === 'help' || q.includes('what can you do') || q.includes('capabilities') || q.includes('features') || q.includes('how to use')) {
      return '💡 Here is what I can help you with:\n\n• 📅 **Schedules**: Ask when matches are or check the Match Hub.\n• 🎟️ **Tickets**: Ask how to buy stubs or view secure QR stubs.\n• 🍔 **Food Delivery**: Order hot concessions (Shawarmas, Burgers) delivered to your seat code.\n• 📍 **Stadium Map**: Ask for gates direction, safety exits, or optimized routes.\n• 🤝 **Volunteers**: Register for shifts, geofence check-in, and report incidents.\n• 🚨 **Evacuations & SOS**: Learn about emergency alerts and the SOS trigger.';
    }

    // Match Schedules
    if (q.includes('final') || q.includes('schedule') || q.includes('when') || q.includes('match') || q.includes('game') || q.includes('play') || q.includes('fixture') || q.includes('time')) {
      return '📅 The FIFA World Cup Final between Argentina and France is scheduled for July 12th, 2026 at 18:00, hosted at the Lusail Stadium. Other fixtures like Brazil vs Germany (Group B) are listed in the Match Hub!';
    }

    // Ticket Reservation / Seats
    if (q.includes('ticket') || q.includes('buy') || q.includes('seat') || q.includes('book') || q.includes('price') || q.includes('pricing') || q.includes('cost')) {
      return '🎟️ Tickets can be booked under the "My Tickets" or "Match Hub" tab. Select your match, pick your tier (VIP box: $299, Cat 1: $149, Cat 2: $99, Cat 3: $59) on the SeatMap, and pay. A secure QR Ticket is instantly generated!';
    }

    // Food Concessions
    if (q.includes('food') || q.includes('eat') || q.includes('shawarma') || q.includes('order') || q.includes('burger') || q.includes('hungry') || q.includes('drink') || q.includes('soda') || q.includes('snack') || q.includes('churros') || q.includes('menu')) {
      return '🍔 Hungry at the arena? Go to "Food Ordering" and add mains like Champion Shawarmas ($12.99), Stadium Premium Burgers ($15.50), or Nachos ($9.99) to your basket. Enter your seat code, and we will deliver it directly to your seat!';
    }

    // Merchandise Store
    if (q.includes('merch') || q.includes('shop') || q.includes('buy jersey') || q.includes('ball') || q.includes('plush') || q.includes('scarf') || q.includes('souvenir') || q.includes('tshirt') || q.includes('shirt')) {
      return '👕 The official Merch Store features the Al Rihla Match Ball ($139.99), Retro Jerseys ($79.99), Mascot Plushies ($24.99), and Supporters Scarves ($19.99). Order in-app and collect them at any stadium souvenir booth!';
    }

    // Volunteer / Shift duty
    if (q.includes('volunteer') || q.includes('shift') || q.includes('check-in') || q.includes('duty') || q.includes('roster') || q.includes('check in')) {
      return '🤝 Volunteers play a key role. Switch your sandbox role to "Volunteer" in the sidebar to access shifts. Sign up for rosters, complete a geofenced attendance check-in, and log gate incidents directly to dispatch command.';
    }

    // Stadium navigation / Maps
    if (q.includes('lusail') || q.includes('stadium') || q.includes('where') || q.includes('navigat') || q.includes('map') || q.includes('gate') || q.includes('block') || q.includes('exit') || q.includes('direction') || q.includes('route')) {
      return '📍 Navigating is simple: open the "Stadium Guide" or "Stadium Navigation" tab. We display interactive layouts of entry gates (A-D), restrooms, medical rooms, safety exits, and offer an optimized Route Planner.';
    }

    // Transport / Metro
    if (q.includes('metro') || q.includes('bus') || q.includes('transport') || q.includes('parking') || q.includes('traffic') || q.includes('car')) {
      return '🚇 Transport Info: The Lusail Metro red line drops you directly at the stadium plaza. Expect moderate transit congestion near Gate B after match hours. Check the "Stadium Guide" for live density alerts!';
    }

    // Emergency / SOS
    if (q.includes('emergency') || q.includes('sos') || q.includes('accident') || q.includes('hurt') || q.includes('danger') || q.includes('medical') || q.includes('police') || q.includes('evacuat')) {
      return '🚨 SAFETY ALERT: If there is an active danger, fire, or medical crisis, please tap the red "SOS EMERGENCY" button in the top navigation header. This sends your exact coordinates to security dispatches and alerts nearby crew.';
    }

    // Lost & Found
    if (q.includes('lost') || q.includes('found') || q.includes('missing') || q.includes('wallet') || q.includes('phone') || q.includes('bag')) {
      return '🎒 Lost something? Check out the "Lost & Found" section under Fan Portal. You can report a missing item (with title, descriptions, and contact email) or view items cataloged as recovered by our team.';
    }

    // Incident Dispatch / Command
    if (q.includes('incident') || q.includes('broken') || q.includes('crowd') || q.includes('leak') || q.includes('report') || q.includes('dispatch') || q.includes('command')) {
      return '⚠️ Volunteers can report facility or crowd problems in the "Report Incident" form. Admins can view these in the Command Center dashboard, assign active volunteers, or trigger emergency warning bulletins.';
    }

    // Feedback
    if (q.includes('feedback') || q.includes('rate') || q.includes('review') || q.includes('comment') || q.includes('opinion')) {
      return '💬 Let us know how we did! Submit ratings and comments under the "Fan Feedback" tab to help FIFA auditors improve stadium operations.';
    }

    // Football trivia / Players
    if (q.includes('messi') || q.includes('mbappe') || q.includes('argentina') || q.includes('france') || q.includes('brazil') || q.includes('germany') || q.includes('score') || q.includes('winner') || q.includes('trivia')) {
      return '⚽ Tournament Trivia: Argentina and France are competing in the final match, which is currently live! Spain and Portugal tied in an epic 2-2 group stage draw. View live scoring stats in the Match Hub.';
    }

    return "⚽ I'm your dedicated FIFA Match Assistant. I can help you purchase tickets, order food directly to your seat, navigate stadiums, sign up for volunteer shifts, or report incidents. Could you rephrase your question or select one of the quick suggestions below?";
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Execute real Gemini API request using key provided by the user
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Build context-rich system instructions
    const systemPrompt = `You are the official FIFA Kolhapur 2026 AI Operations & Match Assistant.
Your goal is to help fans, volunteers, and organizers get correct information about the tournament.
Here is the active user context:
- Current User: ${currentUser ? `${currentUser.name} (${currentUser.role})` : 'Anonymous Guest'}
- Active Tickets: ${JSON.stringify(tickets)}
- Scheduled Matches: ${JSON.stringify(matches)}

If the user asks about their seat, ticket, or route, use their Active Tickets info to guide them:
- VIP / Seat starting with V or A: Entry via Gate 1 (VVIP). Take the gold elevator to Level 3, go left past the VVIP Lounge to VIP Box Row A.
- Category 1 / Seat starting with B or C: Entry via Gate A (North). Scan ticket, head left past central concession court, take escalator 2A to Level 1, Section 102, Row B.
- Category 2 / Seat starting with D: Entry via Gate B (East). Proceed past supporter merch stand, go up ramp 3B to upper tier, locate Block E section 4.
- Category 3 / Seat starting with any other letter: Entry via Gate C (South). Head right, take general stairwell to tier 2, locate Block G section 8, Row E.

For general questions, answer accurately. Keep your responses concise, premium, and friendly. Use emojis where appropriate.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Question: ${text}`
                }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || generateAIResponse(text);
        
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Gemini call response status check failed.");
      }
    } catch (err) {
      console.warn("Gemini API call failed, calling local assistant fallback.", err);
      const fallbackText = generateAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 w-14 h-14 rounded-full bg-fifa-gold text-fifa-dark hover:bg-fifa-gold-light hover:scale-105 transition-all shadow-2xl flex items-center justify-center z-40 border-2 border-white/20"
      >
        <Bot className="w-6 h-6 animate-bounce" />
      </button>

      {/* Sliding Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[550px] bg-fifa-cardDark border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          
          {/* Header */}
          <div className="bg-fifa-burgundy p-4 flex items-center justify-between border-b border-fifa-burgundy-light">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-fifa-gold-light" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI Match Assistant</h3>
                <span className="text-[10px] text-fifa-gold-light font-semibold uppercase tracking-wider">Online • Kolhapur 2026 Helpdesk</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-fifa-dark/30">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  msg.sender === 'user' ? 'bg-fifa-gold text-fifa-dark font-bold' : 'bg-fifa-burgundy text-white'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-fifa-gold/15 text-fifa-gold-light rounded-tr-none border border-fifa-gold/20'
                    : 'bg-fifa-cardDark text-gray-200 rounded-tl-none border border-gray-800'
                }`}>
                  <p>{msg.text}</p>
                  <span className="text-[9px] text-gray-500 block mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-2.5 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-fifa-burgundy text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-fifa-cardDark text-gray-400 p-3 rounded-2xl rounded-tl-none border border-gray-800 text-xs flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Panel */}
          {messages.length === 1 && (
            <div className="p-3 bg-fifa-dark/50 border-t border-gray-800/40">
              <span className="text-[10px] font-bold text-fifa-gold-light uppercase tracking-wider block mb-1.5 flex items-center">
                <HelpCircle className="w-3.5 h-3.5 mr-1" />
                Common Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-[10px] text-gray-400 hover:text-white bg-fifa-cardDark border border-gray-800 hover:border-fifa-gold/30 rounded-lg px-2.5 py-1 text-left transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-fifa-cardDark border-t border-gray-800/80 flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask a question..."
              className="flex-1 bg-fifa-dark border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fifa-gold"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim()}
              className="p-2 bg-fifa-gold hover:bg-fifa-gold-light text-fifa-dark rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
