import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  db, Match, Stadium, Ticket, FoodItem, MerchandiseItem, Order,
  Incident, VolunteerShift, LostFoundItem, NotificationMessage, Feedback
} from '../services/db';
import { firestore } from '../services/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface AppContextType {
  matches: Match[];
  stadiums: Stadium[];
  tickets: Ticket[];
  foodItems: FoodItem[];
  merchandise: MerchandiseItem[];
  orders: Order[];
  incidents: Incident[];
  shifts: VolunteerShift[];
  lostFoundItems: LostFoundItem[];
  notifications: NotificationMessage[];
  feedback: Feedback[];
  
  // Actions
  buyTicket: (matchId: string, seatCategory: Ticket['seatCategory'], seatCode: string, price: number) => Promise<Ticket>;
  placeOrder: (type: 'food' | 'merch', items: Order['items'], total: number, deliverySeat?: string) => Promise<Order>;
  reportIncident: (category: Incident['category'], severity: Incident['severity'], location: string, description: string) => Promise<Incident>;
  updateIncidentStatus: (id: string, status: Incident['status'], volunteerId?: string, volunteerName?: string) => void;
  signUpForShift: (shiftId: string) => void;
  reportLostFound: (name: string, description: string, locationFound: string, contactEmail: string) => void;
  claimLostFound: (itemId: string) => void;
  broadcastNotification: (title: string, content: string, type: NotificationMessage['type'], targetRole: NotificationMessage['targetRole']) => void;
  submitFeedback: (rating: number, comment: string) => void;
  updateMatch: (updatedMatch: Match) => void;
  addMatch: (newMatch: Omit<Match, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to parse "YYYY-MM-DD" and "HH:MM AM/PM" or "HH:MM" into a Date object
export function parseMatchDateTime(dateStr: string, timeStr: string): Date {
  let [hours, minutes] = [0, 0];
  const cleanTime = timeStr.trim().toUpperCase();
  const isAmPm = cleanTime.includes('AM') || cleanTime.includes('PM');
  
  if (isAmPm) {
    const timePart = cleanTime.replace('AM', '').replace('PM', '').trim();
    const parts = timePart.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    if (cleanTime.includes('PM') && hours < 12) {
      hours += 12;
    } else if (cleanTime.includes('AM') && hours === 12) {
      hours = 0;
    }
  } else {
    const parts = cleanTime.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }
  
  const [year, month, day] = dateStr.split('-').map(x => parseInt(x, 10));
  return new Date(year, month - 1, day, hours, minutes, 0);
}

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Core database state
  const [matches, setMatches] = useState<Match[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  // Setup static configuration items
  useEffect(() => {
    setStadiums(db.getStadiums());
    setFoodItems(db.getFoodItems());
    setMerchandise(db.getMerchandise());
  }, []);

  // REALTIME SYNCHRONIZATION WITH CLOUD FIRESTORE FOR ALL SHARED DATASETS
  useEffect(() => {
    // 1. Listen to Matches collection in real-time
    const unsubscribeMatches = onSnapshot(collection(firestore, 'matches'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Match[];
      if (loaded.length === 0) {
        // Seed default matches to cloud database
        const defaultMatches = db.getMatches();
        defaultMatches.forEach(async (m) => {
          await setDoc(doc(firestore, 'matches', m.id), m);
        });
        setMatches(defaultMatches);
      } else {
        // Sort matches by date and time
        setMatches(loaded.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
      }
    });

    // 2. Listen to Bookings/Tickets collection in real-time (filters by user if role === fan)
    let unsubscribeBookings = () => {};
    if (currentUser) {
      const colRef = collection(firestore, 'bookings');
      const bookingsQuery = currentUser.role === 'fan'
        ? query(colRef, where('uid', '==', currentUser.id))
        : colRef;

      unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
        const loaded = snapshot.docs.map(doc => {
          const t = doc.data();
          return {
            id: doc.id,
            matchId: t.matchId,
            userId: t.uid,
            seatCategory: t.seatCategory,
            seatCode: t.seatCode,
            price: t.price,
            purchaseDate: t.purchaseDate,
            qrCode: t.qrCode,
            status: t.status
          } as Ticket;
        });
        setTickets(loaded);
      });
    }

    // 3. Listen to Concession/Merch Orders in real-time (filters by user if role === fan)
    let unsubscribeOrders = () => {};
    if (currentUser) {
      const colRef = collection(firestore, 'orders');
      const ordersQuery = currentUser.role === 'fan'
        ? query(colRef, where('uid', '==', currentUser.id))
        : colRef;

      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const loaded = snapshot.docs.map(doc => {
          const o = doc.data();
          return {
            id: doc.id,
            userId: o.uid,
            type: o.type,
            items: o.items,
            total: o.total,
            status: o.status,
            deliverySeat: o.deliverySeat,
            orderDate: o.orderDate
          } as Order;
        });
        setOrders(loaded);
      });
    }

    // 4. Listen to Incidents collection in real-time
    const unsubscribeIncidents = onSnapshot(collection(firestore, 'incidents'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Incident[];
      if (loaded.length === 0) {
        const defaultIncidents = db.getIncidents();
        defaultIncidents.forEach(async (inc) => {
          await setDoc(doc(firestore, 'incidents', inc.id), inc);
        });
        setIncidents(defaultIncidents);
      } else {
        setIncidents(loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
    });

    // 5. Listen to Shifts collection in real-time
    const unsubscribeShifts = onSnapshot(collection(firestore, 'shifts'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VolunteerShift[];
      if (loaded.length === 0) {
        const defaultShifts = db.getShifts();
        defaultShifts.forEach(async (s) => {
          await setDoc(doc(firestore, 'shifts', s.id), s);
        });
        setShifts(defaultShifts);
      } else {
        setShifts(loaded);
      }
    });

    // 6. Listen to Lost & Found collection in real-time
    const unsubscribeLF = onSnapshot(collection(firestore, 'lostfound'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LostFoundItem[];
      setLostFoundItems(loaded);
    });

    // 7. Listen to Notifications collection in real-time
    const unsubscribeNotifications = onSnapshot(collection(firestore, 'notifications'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NotificationMessage[];
      // Filter targeted notifications locally for Fan/Volunteer roles
      const filtered = loaded.filter(n => {
        if (n.targetRole === 'all') return true;
        if (currentUser?.role === 'admin') return true;
        return n.targetRole === currentUser?.role;
      });
      setNotifications(filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });

    // 8. Listen to Feedback collection in real-time
    const unsubscribeFeedback = onSnapshot(collection(firestore, 'feedback'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => {
        const f = doc.data();
        return {
          id: doc.id,
          userId: f.uid,
          userName: f.userName,
          rating: f.rating,
          comment: f.comment,
          createdAt: f.createdAt
        } as Feedback;
      });
      setFeedback(loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });

    return () => {
      unsubscribeMatches();
      unsubscribeBookings();
      unsubscribeOrders();
      unsubscribeIncidents();
      unsubscribeShifts();
      unsubscribeLF();
      unsubscribeNotifications();
      unsubscribeFeedback();
    };
  }, [currentUser]);

  // LIVE AUTOMATIC SCHEDULER MONITOR LOOP (Starts and stops matches automatically based on time)
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      matches.forEach(async (m) => {
        try {
          const matchStart = parseMatchDateTime(m.date, m.time);
          // Match ends 60 minutes after start time (defined duration)
          const matchEnd = new Date(matchStart.getTime() + 60 * 60 * 1000);

          if (m.status === 'scheduled' && now >= matchStart && now < matchEnd) {
            // Automatically transition scheduled match to live
            const matchRef = doc(firestore, 'matches', m.id);
            await updateDoc(matchRef, {
              status: 'live',
              minute: 0,
              homeScore: 0,
              awayScore: 0,
              timerLastUpdated: now.toISOString()
            });
            console.log(`Live scheduler: Started match ${m.homeTeam} vs ${m.awayTeam}`);
          } else if (m.status === 'live' && now >= matchEnd) {
            // Automatically transition live match to completed
            const matchRef = doc(firestore, 'matches', m.id);
            await updateDoc(matchRef, {
              status: 'completed',
              minute: 90
            });
            console.log(`Live scheduler: Completed match ${m.homeTeam} vs ${m.awayTeam}`);
          } else if (m.status === 'live') {
            // Tick clock minute forward dynamically every 60 seconds of real-world elapsed time
            const lastUpdated = m.timerLastUpdated ? new Date(m.timerLastUpdated) : now;
            
            if (!m.timerLastUpdated) {
              const matchRef = doc(firestore, 'matches', m.id);
              await updateDoc(matchRef, {
                timerLastUpdated: now.toISOString()
              });
            } else if (now.getTime() - lastUpdated.getTime() >= 60 * 1000) {
              const currentMin = m.minute || 0;
              const matchRef = doc(firestore, 'matches', m.id);
              await updateDoc(matchRef, {
                minute: currentMin + 1,
                timerLastUpdated: now.toISOString()
              });
              console.log(`Live timer: Tick match ${m.homeTeam} vs ${m.awayTeam} to ${currentMin + 1}'`);
            }
          }
        } catch (err) {
          // Ignore parser issues for user-created custom dates
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [matches]);

  // Buy ticket: persists to Cloud Firestore
  const buyTicket = async (matchId: string, seatCategory: Ticket['seatCategory'], seatCode: string, price: number): Promise<Ticket> => {
    const newQr = `FIFA-WCC-TKT-${matchId}-${seatCode}-${Date.now().toString(36).toUpperCase()}`;
    const pDate = new Date().toISOString();
    const activeUid = currentUser?.id || 'anonymous';

    const ticketDoc = {
      uid: activeUid,
      matchId,
      seatCategory,
      seatCode,
      price,
      purchaseDate: pDate,
      qrCode: newQr,
      status: 'valid'
    };

    // 1. Add booking document to Firestore
    const docRef = await addDoc(collection(firestore, 'bookings'), ticketDoc);
    
    // 2. Add activity log document to Firestore
    await addDoc(collection(firestore, 'activities'), {
      uid: activeUid,
      action: `Booked ${seatCategory} seat ${seatCode} for match ${matchId}`,
      createdAt: new Date().toISOString()
    });

    // 3. Broadcast booking notification to Firestore
    const ticketNotif = {
      title: 'Ticket Booked',
      content: `Secure seat ${seatCode} registered. QR entry stub issued.`,
      targetRole: 'fan',
      timestamp: new Date().toISOString(),
      type: 'info'
    };
    await addDoc(collection(firestore, 'notifications'), ticketNotif);

    const createdTicket: Ticket = {
      id: docRef.id,
      matchId,
      userId: activeUid,
      seatCategory,
      seatCode,
      price,
      purchaseDate: pDate,
      qrCode: newQr,
      status: 'valid'
    };

    return createdTicket;
  };

  // Place Order: persists to Cloud Firestore
  const placeOrder = async (type: 'food' | 'merch', items: Order['items'], total: number, deliverySeat?: string): Promise<Order> => {
    const oDate = new Date().toISOString();
    const activeUid = currentUser?.id || 'anonymous';

    const orderDoc = {
      uid: activeUid,
      type,
      items,
      total,
      status: 'pending',
      deliverySeat: deliverySeat || null,
      orderDate: oDate
    };

    // 1. Add order document to Firestore
    const docRef = await addDoc(collection(firestore, 'orders'), orderDoc);

    // 2. Add activity log document to Firestore
    await addDoc(collection(firestore, 'activities'), {
      uid: activeUid,
      action: `Placed ${type} order. Total: $${total.toFixed(2)}`,
      createdAt: new Date().toISOString()
    });

    const createdOrder: Order = {
      id: docRef.id,
      userId: activeUid,
      type,
      items,
      total,
      status: 'pending',
      deliverySeat,
      orderDate: oDate
    };

    // Simulate preparation/delivery transitions inside Firestore documents
    setTimeout(async () => {
      try {
        const orderRef = doc(firestore, 'orders', docRef.id);
        await updateDoc(orderRef, { status: 'preparing' });
      } catch (err) {
        console.error("Simulation preparing status write failed:", err);
      }
    }, 5000);

    if (type === 'food') {
      setTimeout(async () => {
        try {
          const orderRef = doc(firestore, 'orders', docRef.id);
          await updateDoc(orderRef, { status: 'delivered' });
        } catch (err) {
          console.error("Simulation delivery status write failed:", err);
        }
      }, 15000);
    }

    return createdOrder;
  };

  // Report Incident: persists to Cloud Firestore
  const reportIncident = async (category: Incident['category'], severity: Incident['severity'], location: string, description: string): Promise<Incident> => {
    const activeUid = currentUser?.id || 'anonymous';
    const activeName = currentUser?.name || 'Anonymous Fan';

    const newIncident = {
      reporterId: activeUid,
      reporterName: activeName,
      category,
      severity,
      location,
      description,
      status: 'reported',
      createdAt: new Date().toISOString()
    };

    // 1. Add incident to Firestore
    const docRef = await addDoc(collection(firestore, 'incidents'), newIncident);

    // 2. Broadcast alerts in notifications for high-priority dispatches
    const incNotif = {
      title: `🚨 Incident: ${category}`,
      content: `Safety dispatch: ${severity} issue reported at ${location}. Details: ${description}`,
      targetRole: 'all',
      timestamp: new Date().toISOString(),
      type: severity === 'critical' || severity === 'high' ? 'emergency' : 'warning'
    };
    await addDoc(collection(firestore, 'notifications'), incNotif);

    return {
      id: docRef.id,
      ...newIncident
    } as Incident;
  };

  // Update Incident Status: persists to Cloud Firestore
  const updateIncidentStatus = async (id: string, status: Incident['status'], volunteerId?: string, volunteerName?: string) => {
    try {
      const incidentRef = doc(firestore, 'incidents', id);
      const updates: any = { status };
      if (volunteerId) updates.assignedVolunteerId = volunteerId;
      if (volunteerName) updates.assignedVolunteerName = volunteerName;
      await updateDoc(incidentRef, updates);
    } catch (err) {
      console.error("Error updating incident in Firestore:", err);
    }
  };

  // Sign up for shift: persists to Cloud Firestore
  const signUpForShift = async (shiftId: string) => {
    if (!currentUser) return;
    try {
      const shiftRef = doc(firestore, 'shifts', shiftId);
      await updateDoc(shiftRef, {
        volunteerId: currentUser.id,
        volunteerName: currentUser.name,
        status: 'assigned'
      });
    } catch (err) {
      console.error("Error signing up for shift in Firestore:", err);
    }
  };

  // Report Lost item: persists to Cloud Firestore
  const reportLostFound = async (name: string, description: string, locationFound: string, contactEmail: string) => {
    const oDate = new Date().toLocaleDateString();
    const activeName = currentUser?.name || 'Anonymous';
    const activeUid = currentUser?.id || 'anonymous';

    const lfDoc = {
      name,
      description,
      locationFound,
      dateFound: oDate,
      status: 'lost',
      reportedBy: activeName,
      contactEmail
    };

    try {
      const docRef = await addDoc(collection(firestore, 'lostfound'), lfDoc);
      
      await addDoc(collection(firestore, 'activities'), {
        uid: activeUid,
        action: `Reported lost item: ${name}`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firestore write lostFound failed:", err);
    }
  };

  // Claim Lost item: persists to Cloud Firestore
  const claimLostFound = async (itemId: string) => {
    const activeUid = currentUser?.id || 'anonymous';
    try {
      const docRef = doc(firestore, 'lostfound', itemId);
      await updateDoc(docRef, { status: 'claimed' });
      
      await addDoc(collection(firestore, 'activities'), {
        uid: activeUid,
        action: `Claimed recovered item ID: ${itemId}`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firestore claim lostFound write failed:", err);
    }
  };

  // Broadcast Alert: persists to Cloud Firestore
  const broadcastNotification = async (title: string, content: string, type: NotificationMessage['type'], targetRole: NotificationMessage['targetRole']) => {
    const notifDoc = {
      title,
      content,
      targetRole,
      timestamp: new Date().toISOString(),
      type
    };

    try {
      await addDoc(collection(firestore, 'notifications'), notifDoc);
    } catch (err) {
      console.error("Firestore broadcast write failed:", err);
    }
  };

  // Submit feedback: persists to Cloud Firestore
  const submitFeedback = async (rating: number, comment: string) => {
    const fDate = new Date().toISOString();
    const activeUid = currentUser?.id || 'anonymous';
    const activeName = currentUser?.name || 'Anonymous';

    const feedDoc = {
      uid: activeUid,
      userName: activeName,
      rating,
      comment,
      createdAt: fDate
    };

    try {
      await addDoc(collection(firestore, 'feedback'), feedDoc);

      await addDoc(collection(firestore, 'activities'), {
        uid: activeUid,
        action: `Submitted feedback rating ${rating}/5`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firestore feedback write failed:", err);
    }
  };

  // Update match statistics: persists to Cloud Firestore
  const updateMatch = async (updatedMatch: Match) => {
    try {
      const matchRef = doc(firestore, 'matches', updatedMatch.id);
      await updateDoc(matchRef, {
        homeScore: updatedMatch.homeScore,
        awayScore: updatedMatch.awayScore,
        minute: updatedMatch.minute,
        status: updatedMatch.status,
        highlights: updatedMatch.highlights || [],
        timerLastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firestore match update failed:", err);
    }
  };

  // Add match schedule: persists to Cloud Firestore
  const addMatch = async (newMatch: Omit<Match, 'id'>) => {
    try {
      const colRef = collection(firestore, 'matches');
      await addDoc(colRef, {
        homeTeam: newMatch.homeTeam,
        awayTeam: newMatch.awayTeam,
        homeFlag: newMatch.homeFlag,
        awayFlag: newMatch.awayFlag,
        stadiumId: newMatch.stadiumId,
        date: newMatch.date,
        time: newMatch.time,
        status: newMatch.status,
        homeScore: newMatch.homeScore,
        awayScore: newMatch.awayScore,
        group: newMatch.group,
        highlights: []
      });
    } catch (err) {
      console.error("Firestore match creation failed:", err);
    }
  };

  return (
    <AppContext.Provider value={{
      matches, stadiums, tickets, foodItems, merchandise, orders, incidents, shifts, lostFoundItems, notifications, feedback,
      buyTicket, placeOrder, reportIncident, updateIncidentStatus, signUpForShift, reportLostFound, claimLostFound, broadcastNotification, submitFeedback, updateMatch, addMatch
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
