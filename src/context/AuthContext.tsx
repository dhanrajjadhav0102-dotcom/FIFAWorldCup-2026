import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, db } from '../services/db';
import { auth, firestore } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, role: UserRole, password?: string, name?: string) => Promise<User>;
  signup: (email: string, name: string, role: UserRole, password?: string) => Promise<User>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Authentication session states & Local Sandbox sessions concurrently
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user details and dynamically resolve roles from Firestore profile
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: data.name || '',
              role: (data.role as UserRole) || 'fan',
              createdAt: data.createdAt || new Date().toISOString()
            });
          } else {
            // Fallback user if Firestore record not written yet
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Fan',
              role: 'fan',
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Error reading Firestore profile:", err);
        }
      } else {
        // If no Firebase Auth user, check if we have a local Volunteer or Admin session
        const session = localStorage.getItem('fifa_auth_session');
        if (session) {
          try {
            const parsed = JSON.parse(session) as User;
            if (parsed.role === 'volunteer' || parsed.role === 'admin') {
              const users = db.getUsers();
              const found = users.find(u => u.id === parsed.id);
              setCurrentUser(found || parsed);
            } else {
              localStorage.removeItem('fifa_auth_session');
              setCurrentUser(null);
            }
          } catch {
            localStorage.removeItem('fifa_auth_session');
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, role: UserRole, password?: string, name?: string): Promise<User> => {
    const lowerEmail = email.toLowerCase().trim();

    // 1. Fan Authentication via Firebase Auth & Firestore
    if (role === 'fan') {
      if (!password) {
        throw new Error('Password is required for Fan authentication.');
      }
      const userCredential = await signInWithEmailAndPassword(auth, lowerEmail, password);
      const firebaseUser = userCredential.user;

      // Update Firestore user document with lastLogin
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userName = name || firebaseUser.displayName || lowerEmail.split('@')[0];

      if (userDocSnap.exists()) {
        userName = userDocSnap.data().name || userName;
        await updateDoc(userDocRef, {
          lastLogin: new Date().toISOString()
        });
      } else {
        await setDoc(userDocRef, {
          name: userName,
          email: lowerEmail,
          role: 'fan',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      }

      const activeUser: User = {
        id: firebaseUser.uid,
        email: lowerEmail,
        name: userName,
        role: 'fan',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('fifa_auth_session', JSON.stringify(activeUser));
      setCurrentUser(activeUser);
      return activeUser;
    }

    // 2. Staff Roles Login (Volunteer & Admin) - Verified locally & provisioned in Firebase Auth
    if (role === 'volunteer') {
      const validVolunteers = [
        { email: 'volunteer@fifa.com', password: 'volunteer@4105', name: 'Yasmin (Gate Usher)' },
        { email: 'volunteer2@fifa.com', password: 'volunteer@4105', name: 'Hamad (VVIP Lounge Usher)' }
      ];
      
      const found = validVolunteers.find(v => v.email === lowerEmail);
      if (!found || password !== found.password) {
        throw new Error('Invalid volunteer email or password.');
      }

      // Authenticate staff in Firebase Auth to resolve security rules
      try {
        await signInWithEmailAndPassword(auth, lowerEmail, password);
      } catch (authError: any) {
        // Auto-register staff if not provisioned in current Auth directory
        try {
          await createUserWithEmailAndPassword(auth, lowerEmail, password);
        } catch (createErr) {
          console.warn("Auto-provisioning of Firebase Auth credentials for Volunteer failed:", createErr);
        }
      }

      const activeUid = auth.currentUser?.uid || `vol-${Date.now()}`;
      
      // Update Firestore staff document
      const userDocRef = doc(firestore, 'users', activeUid);
      await setDoc(userDocRef, {
        name: found.name,
        email: lowerEmail,
        role: 'volunteer',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });

      const users = db.getUsers();
      let user = users.find(u => u.email === lowerEmail);
      if (!user) {
        user = {
          id: activeUid,
          email: lowerEmail,
          name: found.name,
          role: 'volunteer',
          createdAt: new Date().toISOString(),
          status: 'active',
          checkedIn: false
        };
        users.push(user);
        db.saveUsers(users);
      } else {
        user.id = activeUid;
        db.saveUsers(users);
      }

      setCurrentUser(user);
      localStorage.setItem('fifa_auth_session', JSON.stringify(user));
      return user;
    }

    if (role === 'admin') {
      const validAdmins = [
        { email: 'admin@fifa.com', password: 'admin@7105', name: 'Fahad (Stadium Director)' },
        { email: 'admin2@fifa.com', password: 'admin@7105', name: 'Sarah (Command Center)' }
      ];
      
      const found = validAdmins.find(a => a.email === lowerEmail);
      if (!found || password !== found.password) {
        throw new Error('Invalid organizer email or password.');
      }

      // Authenticate staff in Firebase Auth to resolve security rules
      try {
        await signInWithEmailAndPassword(auth, lowerEmail, password);
      } catch (authError: any) {
        // Auto-register staff if not provisioned in current Auth directory
        try {
          await createUserWithEmailAndPassword(auth, lowerEmail, password);
        } catch (createErr) {
          console.warn("Auto-provisioning of Firebase Auth credentials for Admin failed:", createErr);
        }
      }

      const activeUid = auth.currentUser?.uid || `adm-${Date.now()}`;

      // Update Firestore staff document
      const userDocRef = doc(firestore, 'users', activeUid);
      await setDoc(userDocRef, {
        name: found.name,
        email: lowerEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });

      const users = db.getUsers();
      let user = users.find(u => u.email === lowerEmail);
      if (!user) {
        user = {
          id: activeUid,
          email: lowerEmail,
          name: found.name,
          role: 'admin',
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        users.push(user);
        db.saveUsers(users);
      } else {
        user.id = activeUid;
        db.saveUsers(users);
      }

      setCurrentUser(user);
      localStorage.setItem('fifa_auth_session', JSON.stringify(user));
      return user;
    }

    throw new Error('Invalid access role.');
  };

  const signup = async (email: string, name: string, role: UserRole, password?: string): Promise<User> => {
    const lowerEmail = email.toLowerCase().trim();

    if (role === 'fan') {
      if (!password) {
        throw new Error('Password is required for Fan registration.');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, lowerEmail, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        name: name.trim(),
        email: lowerEmail,
        role: 'fan',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      const activeUser: User = {
        id: firebaseUser.uid,
        email: lowerEmail,
        name: name.trim(),
        role: 'fan',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('fifa_auth_session', JSON.stringify(activeUser));
      setCurrentUser(activeUser);
      return activeUser;
    }

    return login(lowerEmail, role, password, name);
  };

  const logout = async () => {
    // If the active user has a Firebase Auth session, log them out
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Firebase SignOut error:", err);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('fifa_auth_session');
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!currentUser) return;

    if (auth.currentUser) {
      try {
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          name: updatedData.name || currentUser.name
        });
        setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
      } catch (err) {
        console.error("Firestore update profile error:", err);
      }
      return;
    }

    const updated = { ...currentUser, ...updatedData };
    setCurrentUser(updated);
    localStorage.setItem('fifa_auth_session', JSON.stringify(updated));

    const users = db.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedData };
      db.saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
