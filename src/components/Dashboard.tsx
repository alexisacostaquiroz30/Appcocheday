import { Trip, Expense, GasLoad, Maintenance } from '../types';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock,
  Car,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  gasLoads: GasLoad[];
  maintenances: Maintenance[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ trips, expenses, gasLoads, maintenances, onNavigate }: DashboardProps) {
  // Financial Calculations
  const totalIncomesPaid = trips
    .filter(t => t.isPaid)
    .reduce((sum, t) => sum + t.fare, 0);

  const totalIncomesPending = trips
    .filter(t => !t.isPaid)
    .reduce((sum, t) => sum + t.fare, 0);

  const totalGrossIncomes = totalIncomesPaid + totalIncomesPending;

  const totalExpensesHormiga = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesGas = gasLoads.reduce((sum, g) => sum + g.price, 0);
  
  // Maintenance cost (if we assign prices there, or oil changes can have a static/logged cost. Let's check:
  // in types, oil changes have oilChangeKm. Let's treat them as informational or add a base cost if they want, but currently maintenance list logs km. Let's sum gas and hormiga as primary cash egresos).
  const totalEgresos = totalExpensesHormiga + totalExpensesGas;

  const netBalance = totalIncomesPaid - totalEgresos;

  // Recent History Aggregate
  const recentActivities: {
    id: string;
    type: 'trip' | 'expense' | 'gas';
    title: string;
    subtitle: string;
    amount: number;
    date: string;
    status?: string;
  }[] = [];

  trips.slice(0, 4).forEach(t => {
    recentActivities.push({
      id: t.id,
      type: 'trip',
      title: `Viaje: ${t.passengerName}`,
      subtitle: t.isPaid ? 'Pagado' : 'Pendiente de Pago',
      amount: t.fare,
      date: t.createdAt,
      status: t.isPaid ? 'paid' : 'pending'
    });
  });

  expenses.slice(0, 3).forEach(e => {
    recentActivities.push({
      id: e.id,
      type: 'expense',
      title: `Gasto: ${e.category.toUpperCase()}`,
      subtitle: e.observation || 'Gasto hormiga',
      amount: -e.amount,
      date: e.createdAt
    });
  });

  gasLoads.slice(0, 3).forEach(g => {
    recentActivities.push({
      id: g.id,
      type: 'gas',
      title: 'Carga Gasolina',
      subtitle: `${g.liters} L • ${g.currentKm} km`,
      amount: -g.price,
      date: g.createdAt
    });
  });

  // Sort by date desc
  const sortedActivities = recentActivities
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Saludo y Balance Principal Card */}
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Balance de Caja Neto</p>
            <h2 className="text-3xl font-black mt-1">${netBalance.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <Wallet className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        {/* Mini Ledger Stats Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-white/10">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Gastos Hormiga
            </span>
            <p className="text-sm font-bold text-gray-200">${totalExpensesHormiga.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Car className="h-3 w-3 text-amber-400" />
              Gasolina Cargada
            </span>
            <p className="text-sm font-bold text-gray-200">${totalExpensesGas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Bento Stats Column - Incomes / Egresos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4.5 rounded-3xl border border-gray-100 flex flex-col justify-between space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            {totalIncomesPending > 0 && (
              <span className="text-[9px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Clock className="h-2 w-2" />
                Pendientes
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400">Total Ingresos</span>
            <div className="mt-1">
              <p className="text-lg font-black text-gray-900">${totalIncomesPaid.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
              {totalIncomesPending > 0 && (
                <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                  + ${totalIncomesPending.toLocaleString('es-CO', { maximumFractionDigits: 0 })} por cobrar
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-gray-100 flex flex-col justify-between space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400">Total Egresos</span>
            <div className="mt-1">
              <p className="text-lg font-black text-gray-900">${totalEgresos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Gastos + Combustible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Oil change warning banner */}
      {maintenances.length > 0 && (() => {
        const lastMaint = maintenances[0];
        const nextDue = lastMaint.oilChangeKm + lastMaint.oilChangeDurationKm;
        // Search in gas loads or trips for the absolute maximum logged odometer
        const maxTripKm = 0; // standard fallback
        const maxGasKm = gasLoads.length > 0 ? Math.max(...gasLoads.map(g => g.currentKm)) : 0;
        const currentEstimatedKm = Math.max(lastMaint.currentKm, maxGasKm);
        const kmLeft = nextDue - currentEstimatedKm;
        
        if (kmLeft <= 500) {
          return (
            <div className="bg-amber-50 border border-amber-100 rounded-2.5xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900">¡Alerta de Cambio de Aceite Próximo!</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Kilómetraje actual estimado en {currentEstimatedKm.toLocaleString()} km. Próximo cambio recomendado a los <strong>{nextDue.toLocaleString()} km</strong> (quedan {kmLeft > 0 ? `${kmLeft} km` : '0 km'} de vida útil).
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Visual representation of Financial Ratio (Incomes vs Egresos) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-900">Relación Ingresos contra Egresos</h3>
        
        {totalGrossIncomes === 0 && totalEgresos === 0 ? (
          <p className="text-center py-6 text-xs text-gray-400">Registra viajes o gastos para generar gráfico</p>
        ) : (
          <div className="space-y-2">
            <div className="h-4.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${totalGrossIncomes > 0 ? (totalIncomesPaid / (totalGrossIncomes + totalEgresos)) * 100 : 0}%` }} 
                className="bg-emerald-500 h-full transition-all duration-500"
              />
              <div 
                style={{ width: `${totalGrossIncomes > 0 ? (totalIncomesPending / (totalGrossIncomes + totalEgresos)) * 100 : 0}%` }} 
                className="bg-amber-400 h-full transition-all duration-500"
              />
              <div 
                style={{ width: `${totalEgresos > 0 ? (totalEgresos / (totalGrossIncomes + totalEgresos)) * 100 : 0}%` }} 
                className="bg-rose-500 h-full transition-all duration-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-gray-500 font-semibold pt-1">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Cobrado ({totalGrossIncomes > 0 ? Math.round((totalIncomesPaid/ (totalGrossIncomes + totalEgresos))*100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Pendiente ({totalGrossIncomes > 0 ? Math.round((totalIncomesPending/ (totalGrossIncomes + totalEgresos))*100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Gastado ({totalEgresos > 0 ? Math.round((totalEgresos/ (totalGrossIncomes + totalEgresos))*100) : 0}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900">Actividad Reciente</h3>
          <button 
            onClick={() => onNavigate('viajes')} 
            className="text-[11px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-0.5"
          >
            Ver Historial <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {sortedActivities.length === 0 ? (
          <div className="bg-white py-10 rounded-3xl border border-gray-100 flex flex-col items-center text-center px-4 shadow-xs">
            <span className="text-2xl mb-2">🚦</span>
            <p className="text-xs text-gray-500 font-bold">Sin transacciones registradas hoy</p>
            <p className="text-[10px] text-gray-400 mt-1">Registra tu primer viaje o gasto para comenzar el balance.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-xs">
            {sortedActivities.map((act) => (
              <div key={act.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-lg shrink-0 ${
                    act.type === 'trip' 
                      ? act.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      : act.type === 'expense' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {act.type === 'trip' ? '🚗' : act.type === 'expense' ? '🍬' : '⛽'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{act.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">{act.subtitle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-black ${act.amount > 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                    {act.amount > 0 ? '+' : ''}${Math.abs(act.amount).toLocaleString('es-CO')}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                    {new Date(act.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
