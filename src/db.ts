import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Trip, Expense, Maintenance, GasLoad, UserProfile } from './types';

// Mock client database for LocalStorage fallback
const MOCK_STORAGE_KEY = 'chauffeur_driver_app_state';

interface LocalState {
  currentUser: { uid: string; email: string; displayName: string } | null;
  trips: Trip[];
  expenses: Expense[];
  maintenances: Maintenance[];
  gasLoads: GasLoad[];
}

const initialLocalState: LocalState = {
  currentUser: null,
  trips: [],
  expenses: [],
  maintenances: [],
  gasLoads: [],
};

function getLocalState(): LocalState {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) return initialLocalState;
  try {
    return JSON.parse(data);
  } catch {
    return initialLocalState;
  }
}

function saveLocalState(state: LocalState) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
}

// Global Auth state subscriber
export function subscribeToAuth(callback: (user: any | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Conductor',
        });
      } else {
        callback(null);
      }
    });
  } else {
    // LocalStorage Mock Auth Subscription
    const tick = () => {
      const state = getLocalState();
      callback(state.currentUser);
    };
    tick();
    
    // Simple custom event dispatcher for local auth state changes
    const listener = () => tick();
    window.addEventListener('localAuthChange', listener);
    return () => {
      window.removeEventListener('localAuthChange', listener);
    };
  }
}

// TRIPS DB OPERATIONS
export async function getTrips(uid: string): Promise<Trip[]> {
  if (isFirebaseConfigured && db) {
    const path = 'trips';
    try {
      const q = query(
        collection(db, path),
        where('driverId', '==', uid)
      );
      const snapshot = await getDocs(q);
      const results: Trip[] = [];
      snapshot.forEach((doc) => {
        results.push(doc.data() as Trip);
      });
      return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  } else {
    const state = getLocalState();
    return state.trips.filter((t) => t.driverId === uid).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function addTrip(trip: Trip): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = 'trips';
    try {
      await setDoc(doc(db, path, trip.id), trip);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${path}/${trip.id}`);
    }
  } else {
    const state = getLocalState();
    state.trips.push(trip);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

export async function updateTrip(trip: Trip): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `trips/${trip.id}`;
    try {
      await setDoc(doc(db, 'trips', trip.id), trip);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  } else {
    const state = getLocalState();
    const index = state.trips.findIndex((t) => t.id === trip.id);
    if (index !== -1) {
      state.trips[index] = trip;
      saveLocalState(state);
      window.dispatchEvent(new Event('localDataChange'));
    }
  }
}

export async function deleteTrip(tripId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `trips/${tripId}`;
    try {
      await deleteDoc(doc(db, 'trips', tripId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  } else {
    const state = getLocalState();
    state.trips = state.trips.filter((t) => t.id !== tripId);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

// EXPENSES DB OPERATIONS
export async function getExpenses(uid: string): Promise<Expense[]> {
  if (isFirebaseConfigured && db) {
    const path = 'expenses';
    try {
      const q = query(
        collection(db, path),
        where('driverId', '==', uid)
      );
      const snapshot = await getDocs(q);
      const results: Expense[] = [];
      snapshot.forEach((doc) => {
        results.push(doc.data() as Expense);
      });
      return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  } else {
    const state = getLocalState();
    return state.expenses.filter((e) => e.driverId === uid).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function addExpense(expense: Expense): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = 'expenses';
    try {
      await setDoc(doc(db, path, expense.id), expense);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${path}/${expense.id}`);
    }
  } else {
    const state = getLocalState();
    state.expenses.push(expense);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  } else {
    const state = getLocalState();
    state.expenses = state.expenses.filter((e) => e.id !== expenseId);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

// MAINTENANCE STATUS DB OPERATIONS
export async function getMaintenances(uid: string): Promise<Maintenance[]> {
  if (isFirebaseConfigured && db) {
    const path = 'maintenance';
    try {
      const q = query(
        collection(db, path),
        where('driverId', '==', uid)
      );
      const snapshot = await getDocs(q);
      const results: Maintenance[] = [];
      snapshot.forEach((doc) => {
        results.push(doc.data() as Maintenance);
      });
      return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  } else {
    const state = getLocalState();
    return state.maintenances.filter((m) => m.driverId === uid).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function addMaintenance(maint: Maintenance): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = 'maintenance';
    try {
      await setDoc(doc(db, path, maint.id), maint);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${path}/${maint.id}`);
    }
  } else {
    const state = getLocalState();
    state.maintenances.push(maint);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

export async function deleteMaintenance(maintId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `maintenance/${maintId}`;
    try {
      await deleteDoc(doc(db, 'maintenance', maintId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  } else {
    const state = getLocalState();
    state.maintenances = state.maintenances.filter((m) => m.id !== maintId);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

// GAS LOADS DB OPERATIONS
export async function getGasLoads(uid: string): Promise<GasLoad[]> {
  if (isFirebaseConfigured && db) {
    const path = 'gas_loads';
    try {
      const q = query(
        collection(db, path),
        where('driverId', '==', uid)
      );
      const snapshot = await getDocs(q);
      const results: GasLoad[] = [];
      snapshot.forEach((doc) => {
        results.push(doc.data() as GasLoad);
      });
      return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  } else {
    const state = getLocalState();
    return state.gasLoads.filter((g) => g.driverId === uid).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function addGasLoad(gas: GasLoad): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = 'gas_loads';
    try {
      await setDoc(doc(db, path, gas.id), gas);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${path}/${gas.id}`);
    }
  } else {
    const state = getLocalState();
    state.gasLoads.push(gas);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

export async function deleteGasLoad(gasId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `gas_loads/${gasId}`;
    try {
      await deleteDoc(doc(db, 'gas_loads', gasId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  } else {
    const state = getLocalState();
    state.gasLoads = state.gasLoads.filter((g) => g.id !== gasId);
    saveLocalState(state);
    window.dispatchEvent(new Event('localDataChange'));
  }
}

// AUTH FUNCTIONS
export async function signInWithEmail(email: string, password: string): Promise<any> {
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || email.split('@')[0],
    };
  } else {
    // Mock Sign In
    const state = getLocalState();
    // In our simplified mock, any password works, but we look up a mock user or create if they want
    const user = {
      uid: email.replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      displayName: email.split('@')[0],
    };
    state.currentUser = user;
    saveLocalState(state);
    window.dispatchEvent(new Event('localAuthChange'));
    return user;
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<any> {
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create corresponding Firestore document
    const userProfile: UserProfile = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || email,
      displayName: displayName,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', userProfile.uid), userProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${userProfile.uid}`);
    }
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName,
    };
  } else {
    // Mock Sign Up
    const state = getLocalState();
    const user = {
      uid: email.replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      displayName,
    };
    state.currentUser = user;
    saveLocalState(state);
    window.dispatchEvent(new Event('localAuthChange'));
    return user;
  }
}

export async function signInWithGoogle(): Promise<any> {
  if (isFirebaseConfigured && auth) {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Create Firestore document if new
    const userProfile: UserProfile = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || 'google@driver.com',
      displayName: userCredential.user.displayName || 'Conductor',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', userProfile.uid), userProfile);
    } catch (err) {
      // Ignore if document already exists inside Firestore rules or handle it
    }
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
    };
  } else {
    // Mock Google Sign In
    const state = getLocalState();
    const user = {
      uid: 'google_mock_user_123',
      email: 'conductor.google@ejemplo.com',
      displayName: 'Conductor Google Mock',
    };
    state.currentUser = user;
    saveLocalState(state);
    window.dispatchEvent(new Event('localAuthChange'));
    return user;
  }
}

export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    const state = getLocalState();
    state.currentUser = null;
    saveLocalState(state);
    window.dispatchEvent(new Event('localAuthChange'));
  }
}

