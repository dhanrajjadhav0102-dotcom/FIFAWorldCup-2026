// Simulated Firestore Database Service for FIFA World Cup Challenge

export type UserRole = 'fan' | 'volunteer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  // Fan specific
  favoriteTeam?: string;
  seatNumber?: string;
  // Volunteer specific
  volunteerId?: string;
  skills?: string[];
  status?: 'active' | 'inactive';
  checkedIn?: boolean;
  checkInTime?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  stadiumId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'completed';
  homeScore: number;
  awayScore: number;
  minute?: number;
  timerLastUpdated?: string;
  group: string;
  highlights?: string[];
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  capacity: number;
  coordinates: { x: number; y: number }; // Simulated coordinate mapping
  image: string;
  gates: string[];
}

export interface Ticket {
  id: string;
  matchId: string;
  userId: string;
  seatCategory: 'VIP' | 'Category 1' | 'Category 2' | 'Category 3';
  seatCode: string;
  price: number;
  purchaseDate: string;
  qrCode: string; // Base64 or string value representing token
  status: 'valid' | 'used' | 'refunded';
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'Snacks' | 'Mains' | 'Drinks' | 'Desserts';
  price: number;
  image: string;
  description: string;
  available: boolean;
}

export interface MerchandiseItem {
  id: string;
  name: string;
  category: 'Apparel' | 'Souvenirs' | 'Equipment';
  price: number;
  image: string;
  description: string;
  sizes?: string[];
  stock: number;
}

export interface Order {
  id: string;
  userId: string;
  type: 'food' | 'merch';
  items: { itemId: string; name: string; quantity: number; price: number; size?: string }[];
  total: number;
  status: 'pending' | 'preparing' | 'delivered' | 'completed';
  deliverySeat?: string;
  orderDate: string;
}

export interface Incident {
  id: string;
  reporterId: string;
  reporterName: string;
  category: 'Crowd Control' | 'Medical Emergency' | 'Facilities Issue' | 'Security Alert' | 'Other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string; // E.g., Gate 4, Block B
  description: string;
  status: 'reported' | 'investigating' | 'resolved';
  createdAt: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
}

export interface VolunteerShift {
  id: string;
  volunteerId?: string; // Empty if open for sign-up
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'assigned' | 'completed' | 'open';
}

export interface LostFoundItem {
  id: string;
  name: string;
  description: string;
  locationFound: string;
  dateFound: string;
  status: 'lost' | 'found' | 'claimed';
  reportedBy: string;
  contactEmail: string;
}

export interface NotificationMessage {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'fan' | 'volunteer';
  timestamp: string;
  type: 'info' | 'warning' | 'emergency';
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Initial Static Data
const INITIAL_STADIUMS: Stadium[] = [
  {
    id: 'stad-1',
    name: 'Lusail Stadium',
    city: 'Lusail',
    capacity: 88966,
    coordinates: { x: 50, y: 30 },
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
    gates: ['Gate A (North)', 'Gate B (East)', 'Gate C (South)', 'Gate D (West)']
  },
  {
    id: 'stad-2',
    name: 'Al Bayt Stadium',
    city: 'Al Khor',
    capacity: 68895,
    coordinates: { x: 45, y: 20 },
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
    gates: ['Gate 1 (VVIP)', 'Gate 2 (General)', 'Gate 3 (Staff)', 'Gate 4 (General)']
  },
  {
    id: 'stad-3',
    name: 'Education City Stadium',
    city: 'Al Rayyan',
    capacity: 44667,
    coordinates: { x: 35, y: 40 },
    image: 'https://images.unsplash.com/photo-1577223625856-758c127e1279?auto=format&fit=crop&q=80&w=600',
    gates: ['Gate A', 'Gate B', 'Gate C']
  }
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-1',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    homeFlag: '🇦🇷',
    awayFlag: '🇫🇷',
    stadiumId: 'stad-1',
    date: '2026-07-12',
    time: '18:00',
    status: 'live',
    homeScore: 2,
    awayScore: 1,
    minute: 74,
    group: 'Group A',
    highlights: ['Messi penalty goal - 23\'', 'Mbappe stunning volley - 55\'', 'Alvarez header - 68\'']
  },
  {
    id: 'match-2',
    homeTeam: 'Brazil',
    awayTeam: 'Germany',
    homeFlag: '🇧🇷',
    awayFlag: '🇩🇪',
    stadiumId: 'stad-2',
    date: '2026-07-13',
    time: '21:00',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    group: 'Group B'
  },
  {
    id: 'match-3',
    homeTeam: 'Spain',
    awayTeam: 'Portugal',
    homeFlag: '🇪🇸',
    awayFlag: '🇵🇹',
    stadiumId: 'stad-3',
    date: '2026-07-11',
    time: '15:00',
    status: 'completed',
    homeScore: 2,
    awayScore: 2,
    group: 'Group A',
    highlights: ['Cristiano Ronaldo free kick - 12\'', 'Morata rebound - 34\'', 'Pedri masterclass strike - 72\'', 'Bruno Fernandes penalty - 89\'']
  },
  {
    id: 'match-4',
    homeTeam: 'England',
    awayTeam: 'Italy',
    homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayFlag: '🇮🇹',
    stadiumId: 'stad-1',
    date: '2026-07-14',
    time: '18:00',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    group: 'Group C'
  }
];

const INITIAL_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'food-1',
    name: 'Champion Shawarma',
    category: 'Mains',
    price: 12.99,
    image: '🥙',
    description: 'Perfectly spiced roasted chicken wrapped in fresh pita with garlic sauce.',
    available: true
  },
  {
    id: 'food-2',
    name: 'Stadium Premium Burger',
    category: 'Mains',
    price: 15.50,
    image: '🍔',
    description: '100% Angus beef patty with melted cheese, lettuce, and secret World Cup sauce.',
    available: true
  },
  {
    id: 'food-3',
    name: 'Big Kick Nachos',
    category: 'Snacks',
    price: 9.99,
    image: '🧀',
    description: 'Crisp tortilla chips drenched in warm cheese sauce, topped with jalapeños.',
    available: true
  },
  {
    id: 'food-4',
    name: 'Golden Goal Churros',
    category: 'Desserts',
    price: 7.50,
    image: '🥨',
    description: 'Fried dough pastry dusted with cinnamon sugar, served with chocolate dip.',
    available: true
  },
  {
    id: 'food-5',
    name: 'Victory Draft Soda',
    category: 'Drinks',
    price: 4.99,
    image: '🥤',
    description: 'Ice-cold carbonated refreshment in a souvenir World Cup collector cup.',
    available: true
  }
];

const INITIAL_MERCHANDISE: MerchandiseItem[] = [
  {
    id: 'merch-1',
    name: 'Al Rihla Official Match Ball',
    category: 'Equipment',
    price: 139.99,
    image: '⚽',
    description: 'The official match ball of the tournament featuring advanced aerodynamics.',
    stock: 45
  },
  {
    id: 'merch-2',
    name: 'FIFA Mascot Plush Toy',
    category: 'Souvenirs',
    price: 24.99,
    image: '🧸',
    description: 'Cute, fluffy plush mascot - the ultimate keepsake for kids and collectors.',
    stock: 120
  },
  {
    id: 'merch-3',
    name: 'Retro National Jersey',
    category: 'Apparel',
    price: 79.99,
    image: '👕',
    description: 'Classic vintage design jersey crafted from breathable modern materials.',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 80
  },
  {
    id: 'merch-4',
    name: 'Gold Emblem Supporter Scarf',
    category: 'Apparel',
    price: 19.99,
    image: '🧣',
    description: 'Woven acrylic knit scarf with standard fringe, showing off World Cup colors.',
    stock: 250
  }
];

const INITIAL_SHIFTS: VolunteerShift[] = [
  {
    id: 'shift-1',
    title: 'North Gate Ushering',
    description: 'Assist arriving fans with ticket verification and security queue directions.',
    location: 'Lusail Stadium - Gate A',
    date: '2026-07-12',
    startTime: '16:00',
    endTime: '20:00',
    status: 'open'
  },
  {
    id: 'shift-2',
    title: 'VVIP Lounge Assistance',
    description: 'Provide hospitality and directional guidance to distinguished FIFA dignitaries.',
    location: 'Al Bayt Stadium - VIP Wing',
    date: '2026-07-13',
    startTime: '19:00',
    endTime: '23:00',
    status: 'open'
  },
  {
    id: 'shift-3',
    title: 'Pitchside Security Support',
    description: 'Monitor the front lines of the crowd during penalty shootouts and match celebration.',
    location: 'Lusail Stadium - Pitch Perimeter',
    date: '2026-07-12',
    startTime: '17:30',
    endTime: '21:30',
    status: 'open'
  }
];

const INITIAL_NOTIFICATIONS: NotificationMessage[] = [
  {
    id: 'notif-1',
    title: 'Welcome to the World Cup Portal!',
    content: 'Get live match schedules, buy tickets, order food to your seat, or sign up as a volunteer.',
    targetRole: 'all',
    timestamp: new Date().toISOString(),
    type: 'info'
  },
  {
    id: 'notif-2',
    title: 'Lusail Metro Line High Congestion',
    content: 'Fans leaving Lusail Stadium are advised to take alternate bus routes or wait in the Fan Zone.',
    targetRole: 'fan',
    timestamp: new Date().toISOString(),
    type: 'warning'
  }
];

// Helper to initialize and retrieve from LocalStorage
const loadFromStorage = <T>(key: string, initialData: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return initialData;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Database state accessor
export const db = {
  getUsers: () => loadFromStorage<User[]>('fifa_users', []),
  saveUsers: (users: User[]) => saveToStorage('fifa_users', users),

  getMatches: () => loadFromStorage<Match[]>('fifa_matches', INITIAL_MATCHES),
  saveMatches: (matches: Match[]) => saveToStorage('fifa_matches', matches),

  getStadiums: () => loadFromStorage<Stadium[]>('fifa_stadiums', INITIAL_STADIUMS),
  saveStadiums: (stadiums: Stadium[]) => saveToStorage('fifa_stadiums', stadiums),

  getTickets: () => loadFromStorage<Ticket[]>('fifa_tickets', []),
  saveTickets: (tickets: Ticket[]) => saveToStorage('fifa_tickets', tickets),

  getFoodItems: () => loadFromStorage<FoodItem[]>('fifa_food_items', INITIAL_FOOD_ITEMS),
  saveFoodItems: (items: FoodItem[]) => saveToStorage('fifa_food_items', items),

  getMerchandise: () => loadFromStorage<MerchandiseItem[]>('fifa_merchandise', INITIAL_MERCHANDISE),
  saveMerchandise: (items: MerchandiseItem[]) => saveToStorage('fifa_merchandise', items),

  getOrders: () => loadFromStorage<Order[]>('fifa_orders', []),
  saveOrders: (orders: Order[]) => saveToStorage('fifa_orders', orders),

  getIncidents: () => loadFromStorage<Incident[]>('fifa_incidents', []),
  saveIncidents: (incidents: Incident[]) => saveToStorage('fifa_incidents', incidents),

  getShifts: () => loadFromStorage<VolunteerShift[]>('fifa_shifts', INITIAL_SHIFTS),
  saveShifts: (shifts: VolunteerShift[]) => saveToStorage('fifa_shifts', shifts),

  getLostFound: () => loadFromStorage<LostFoundItem[]>('fifa_lost_found', []),
  saveLostFound: (items: LostFoundItem[]) => saveToStorage('fifa_lost_found', items),

  getNotifications: () => loadFromStorage<NotificationMessage[]>('fifa_notifications', INITIAL_NOTIFICATIONS),
  saveNotifications: (msgs: NotificationMessage[]) => saveToStorage('fifa_notifications', msgs),

  getFeedback: () => loadFromStorage<Feedback[]>('fifa_feedback', []),
  saveFeedback: (feedbacks: Feedback[]) => saveToStorage('fifa_feedback', feedbacks)
};
