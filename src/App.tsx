import { useState, useEffect } from 'react';
import { 
  subscribeToAuth, 
  signOutUser,
  getTrips,
  getExpenses,
  getGasLoads,
  getMaintenances 
} from './db';
import { Trip, Expense, GasLoad, Maintenance } from './types';
import FirebaseStatusBanner from './components/FirebaseStatusBanner';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TripsManager from './components/TripsManager';
import ExpensesManager from './components/ExpensesManager';
import VehicleManager from './components/VehicleManager';
import { LogOut, LayoutDashboard, Car, Calendar, Receipt, Milestone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'viajes' | 'gastos' | 'vehiculo'>('dashboard');

  // Core Entity States
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [gasLoads, setGasLoads] = useState<GasLoad[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Subscribe to Auth status
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync / Load data when User is available
  const loadAllData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [allTrips, allExpenses, allGas, allMaint] = await Promise.all([
        getTrips(currentUser.uid),
        getExpenses(currentUser.uid),
        getGasLoads(currentUser.uid),
        getMaintenances(currentUser.uid)
      ]);
      setTrips(allTrips);
      setExpenses(allExpenses);
      setGasLoads(allGas);
      setMaintenances(allMaint);
    } catch (err) {
      console.error("Error loading application state:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Handle local mockup custom mutations inside localstorage
  useEffect(() => {
    const handleLocalDataChange = () => {
      loadAllData();
    };
    window.addEventListener('localDataChange', handleLocalDataChange);
    return () => {
      window.removeEventListener('localDataChange', handleLocalDataChange);
    };
  }, [currentUser]);

  // Logout Handler
  async function handleLogout() {
    try {
      await signOutUser();
      setCurrentUser(null);
      // Reset State
      setTrips([]);
      setExpenses([]);
      setGasLoads([]);
      setMaintenances([]);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-gray-900/10 border-t-gray-950 rounded-full animate-spin mb-4" />
        <p className="text-xs text-gray-500 font-bold">Iniciando DriverX...</p>
      </div>
    );
  }

  // Render Login if unauthenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <FirebaseStatusBanner />
        <Login onAuthSuccess={(user) => setCurrentUser(user)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-gray-100/50 pb-24">
      
      {/* Dynamic Firebase status badge */}
      <FirebaseStatusBanner />

      {/* Driver Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gray-950 text-white font-black h-9 w-9 xl:h-10 xl:w-10 rounded-xl flex items-center justify-center text-sm shadow-md">
            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'C'}
          </div>
          <div>
            <h1 className="text-xs font-black text-gray-900 leading-tight">
              Hola, {currentUser.displayName || 'Conductor'} 👋
            </h1>
            <p className="text-[9px] text-gray-400 font-bold leading-none tracking-wide mt-0.5">ESTADO ACTIVO</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-xl transition-colors active:scale-95"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* Primary Scrollable Core Container */}
      <main className="p-5 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                trips={trips}
                expenses={expenses}
                gasLoads={gasLoads}
                maintenances={maintenances}
                onNavigate={(tab) => setActiveTab(tab as any)}
              />
            )}

            {activeTab === 'viajes' && (
              <TripsManager 
                trips={trips}
                onRefresh={loadAllData}
                uid={currentUser.uid}
              />
            )}

            {activeTab === 'gastos' && (
              <ExpensesManager 
                expenses={expenses}
                onRefresh={loadAllData}
                uid={currentUser.uid}
              />
            )}

            {activeTab === 'vehiculo' && (
              <VehicleManager 
                maintenances={maintenances}
                gasLoads={gasLoads}
                onRefresh={loadAllData}
                uid={currentUser.uid}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tactile Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100/50 px-3 py-2 flex items-center justify-around z-20 shadow-xl rounded-t-3xl pb-safe">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all ${
            activeTab === 'dashboard' 
              ? 'text-gray-950 font-black bg-gray-50' 
              : 'text-gray-400 hover:text-gray-700 font-bold'
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'text-gray-950 stroke-[2.5]' : 'text-gray-400'}`} />
          <span className="text-[9px] tracking-tight">Balance</span>
        </button>

        <button
          onClick={() => setActiveTab('viajes')}
          className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all ${
            activeTab === 'viajes' 
              ? 'text-gray-950 font-black bg-gray-50' 
              : 'text-gray-400 hover:text-gray-700 font-bold'
          }`}
        >
          <Milestone className={`h-5 w-5 ${activeTab === 'viajes' ? 'text-gray-950 stroke-[2.5]' : 'text-gray-400'}`} />
          <span className="text-[9px] tracking-tight">Viajes</span>
        </button>

        <button
          onClick={() => setActiveTab('gastos')}
          className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all ${
            activeTab === 'gastos' 
              ? 'text-gray-950 font-black bg-gray-50' 
              : 'text-gray-400 hover:text-gray-700 font-bold'
          }`}
        >
          <Receipt className={`h-5 w-5 ${activeTab === 'gastos' ? 'text-gray-950 stroke-[2.5]' : 'text-gray-400'}`} />
          <span className="text-[9px] tracking-tight">Gastos</span>
        </button>

        <button
          onClick={() => setActiveTab('vehiculo')}
          className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all ${
            activeTab === 'vehiculo' 
              ? 'text-gray-950 font-black bg-gray-50' 
              : 'text-gray-400 hover:text-gray-700 font-bold'
          }`}
        >
          <Car className={`h-5 w-5 ${activeTab === 'vehiculo' ? 'text-gray-950 stroke-[2.5]' : 'text-gray-400'}`} />
          <span className="text-[9px] tracking-tight font-sans">Vehículo</span>
        </button>
      </nav>

    </div>
  );
}
