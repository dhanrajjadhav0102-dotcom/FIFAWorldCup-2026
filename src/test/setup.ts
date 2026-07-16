import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (needed for Recharts inside the dashboards)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver as any;

// Mock Firebase SDK APIs
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: vi.fn((authInstance, callback) => {
      // Simulate initial anonymous state check
      setTimeout(() => callback(null), 5);
      return vi.fn(); // unsubscribe
    }),
  };
  return {
    getAuth: vi.fn(() => mockAuth),
    onAuthStateChanged: mockAuth.onAuthStateChanged,
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({
      user: { uid: 'mock-user-123', email: 'fan@example.com', displayName: 'Mock Fan' }
    })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({
      user: { uid: 'mock-user-123', email: 'fan@example.com', displayName: 'Mock Fan' }
    })),
    signOut: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn((ref, callback) => {
    // Return empty snap list
    setTimeout(() => callback({ docs: [] }), 5);
    return vi.fn(); // unsubscribe
  }),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  query: vi.fn((ref) => ref),
  where: vi.fn(),
}));
