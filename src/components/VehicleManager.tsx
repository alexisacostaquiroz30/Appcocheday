import React, { useState } from 'react';
import { Maintenance, GasLoad } from '../types';
import { addMaintenance, deleteMaintenance, addGasLoad, deleteGasLoad } from '../db';
import { Plus, Trash2, Fuel, RefreshCw, PenTool as Tool, Sparkles, HelpCircle, Info, DollarSign, Calendar } from 'lucide-react';

interface VehicleManagerProps {
  maintenances: Maintenance[];
  gasLoads: GasLoad[];
  onRefresh: () => void;
  uid: string;
}

export default function VehicleManager({ maintenances, gasLoads, onRefresh, uid }: VehicleManagerProps) {
  const [activeSubtab, setActiveSubtab] = useState<'oil' | 'gas'>('oil');
  const [showOilForm, setShowOilForm] = useState(false);
  const [showGasForm, setShowGasForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Oil Change Form Fields
  const [oilChangeKm, setOilChangeKm] = useState('');
  const [oilChangeDurationKm, setOilChangeDurationKm] = useState('5000'); // Standard default
  const [oilCurrentKm, setOilCurrentKm] = useState('');
  const [oilObservation, setOilObservation] = useState('');

  // Gasoline Form Fields
  const [gasLiters, setGasLiters] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [gasCurrentKm, setGasCurrentKm] = useState('');
  const [gasObservation, setGasObservation] = useState('');

  // Oil calculations
  const lastOilChange = maintenances[0]; // Ordered by date desc
  const nextOilChangeDue = lastOilChange ? lastOilChange.oilChangeKm + lastOilChange.oilChangeDurationKm : 0;
  
  // Obtain current vehicle odometer estimation (highest logged anywhere)
  const maxMaintKm = maintenances.length > 0 ? Math.max(...maintenances.map(m => m.currentKm)) : 0;
  const maxGasKm = gasLoads.length > 0 ? Math.max(...gasLoads.map(g => g.currentKm)) : 0;
  const currentOdometerEstimate = Math.max(maxMaintKm, maxGasKm);

  const kmLeft = lastOilChange ? nextOilChangeDue - currentOdometerEstimate : 0;
  const oilAgePercent = lastOilChange 
    ? Math.min(100, Math.max(0, ( (currentOdometerEstimate - lastOilChange.oilChangeKm) / lastOilChange.oilChangeDurationKm ) * 100)) 
    : 0;

  async function handleAddOilChange(e: React.FormEvent) {
    e.preventDefault();
    if (!oilChangeKm || !oilChangeDurationKm) return;

    setLoading(true);
    const numericOilKm = parseFloat(oilChangeKm);
    const numericDuration = parseFloat(oilChangeDurationKm);
    const numericCurrent = oilCurrentKm ? parseFloat(oilCurrentKm) : numericOilKm;

    const newMaint: Maintenance = {
      id: 'maint_' + Date.now().toString(),
      driverId: uid,
      oilChangeKm: numericOilKm,
      oilChangeDurationKm: numericDuration,
      currentKm: numericCurrent,
      observation: oilObservation,
      createdAt: new Date().toISOString()
    };

    try {
      await addMaintenance(newMaint);
      setOilChangeKm('');
      setOilCurrentKm('');
      setOilObservation('');
      setShowOilForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGas(e: React.FormEvent) {
    e.preventDefault();
    if (!gasPrice) return;

    setLoading(true);
    const newGas: GasLoad = {
      id: 'gas_' + Date.now().toString(),
      driverId: uid,
      liters: gasLiters ? parseFloat(gasLiters) : 0,
      price: parseFloat(gasPrice),
      currentKm: gasCurrentKm ? parseFloat(gasCurrentKm) : currentOdometerEstimate,
      observation: gasObservation,
      createdAt: new Date().toISOString()
    };

    try {
      await addGasLoad(newGas);
      setGasLiters('');
      setGasPrice('');
      setGasCurrentKm('');
      setGasObservation('');
      setShowGasForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOil(id: string) {
    if (!confirm('¿Eliminar este registro de cambio de aceite?')) return;
    try {
      await deleteMaintenance(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteGas(id: string) {
    if (!confirm('¿Eliminar esta carga de gasolina?')) return;
    try {
      await deleteGasLoad(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tab Header & Subtab switchers */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Estado del Vehículo</h2>
          <p className="text-xs text-gray-500">Aceite, combustibles y kilometraje</p>
        </div>

        {/* Tactile subtabs on mobile */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-xs">
          <button
            onClick={() => setActiveSubtab('oil')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
              activeSubtab === 'oil' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Cambio de Aceite
          </button>
          <button
            onClick={() => setActiveSubtab('gas')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
              activeSubtab === 'gas' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Fuel className="h-3.5 w-3.5" /> Gasolina / Recargas
          </button>
        </div>
      </div>

      {/* OIL SUBTAB VIEW */}
      {activeSubtab === 'oil' && (
        <div className="space-y-5">
          {/* OIL LIFE ESTIMATOR METRIC */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-gray-500" />
              Estado Actual del Aceite
            </h3>

            {lastOilChange ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Último Cambio:</span>
                    <p className="font-extrabold text-sm text-gray-900">{lastOilChange.oilChangeKm.toLocaleString()} km</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">Próximo Vencimiento:</span>
                    <p className="font-extrabold text-sm text-gray-900">{nextOilChangeDue.toLocaleString()} km</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${100 - oilAgePercent}%` }} 
                      className={`h-full transition-all duration-500 ${
                        kmLeft <= 500 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                    <span>Vida útil del aceite: {Math.max(0, Math.round(100 - oilAgePercent))}%</span>
                    <span>Quedan aprox. {kmLeft > 0 ? kmLeft.toLocaleString() : 0} km</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl text-[10px] text-gray-500 font-medium leading-relaxed">
                  Basado en tu kilometraje máximo registrado de <strong>{currentOdometerEstimate.toLocaleString()} km</strong>. El aceite dura <strong>{lastOilChange.oilChangeDurationKm.toLocaleString()} km</strong>.
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-500 space-y-2">
                <p>⚙️ No has registrado ningún cambio de aceite.</p>
                <p className="text-[10px] text-gray-400">Registra tu cambio más reciente para ver el estimador de vida útil.</p>
              </div>
            )}

            <button
              onClick={() => setShowOilForm(!showOilForm)}
              className="w-full py-3 border border-gray-200 hover:border-gray-300 text-gray-900 font-bold rounded-2.5xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Registrar Cambio de Aceite
            </button>
          </div>

          {/* ADD OIL FORM */}
          {showOilForm && (
            <form onSubmit={handleAddOilChange} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl space-y-4 animate-in slide-in-from-top-5 duration-200">
              <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">Registrar Cambio de Aceite</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Odometer / Kilometraje del Cambio (km)</label>
                  <input
                    type="number"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={oilChangeKm}
                    onChange={(e) => setOilChangeKm(e.target.value)}
                    placeholder="Ej. 125000"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">¿Cuánto dura este aceite? (km)</label>
                  <select
                    value={oilChangeDurationKm}
                    onChange={(e) => setOilChangeDurationKm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  >
                    <option value="5000">5,000 km (Mineral / Convencional)</option>
                    <option value="8000">8,000 km (Semisintético)</option>
                    <option value="10000">10,000 km (Sintético Premium)</option>
                    <option value="15000">15,000 km (Larga duración)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Kilometraje Actual estimado del Coche (km)</label>
                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={oilCurrentKm}
                    onChange={(e) => setOilCurrentKm(e.target.value)}
                    placeholder="Opcional - por defecto el mismo del cambio"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Observación</label>
                  <input
                    type="text"
                    value={oilObservation}
                    onChange={(e) => setOilObservation(e.target.value)}
                    placeholder="Ej. Marca Castrol 10W-30, cambio de filtro incluido"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOilForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center"
                >
                  {loading ? 'Sincronizando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {/* HISTORIC CHRONOLOGY */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Historial de Cambios de Aceite</h3>
            {maintenances.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">Ningún cambio de aceite en el archivo</p>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-xs">
                {maintenances.map((m) => (
                  <div key={m.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-extrabold text-gray-900">Aceite a los {m.oilChangeKm.toLocaleString()} km</h4>
                      <p className="text-[10px] text-gray-500">
                        Duración: {m.oilChangeDurationKm.toLocaleString()} km • {m.observation || 'Sin notas'}
                      </p>
                      <span className="text-[8px] text-gray-400 font-mono italic">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteOil(m.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors shrink-0 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GASOLINE SUBTAB VIEW */}
      {activeSubtab === 'gas' && (
        <div className="space-y-5">
          {/* QUICK SUMMARY CARD */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100/50">
              <span className="text-[9px] font-bold text-orange-700 uppercase">Litros Totales</span>
              <p className="text-lg font-black text-orange-950 mt-1">
                {gasLoads.reduce((sum, g) => sum + g.liters, 0).toLocaleString()} L
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100/50">
              <span className="text-[9px] font-bold text-amber-700 uppercase">Gasto Gasolina</span>
              <p className="text-lg font-black text-amber-900 mt-1">
                ${gasLoads.reduce((sum, g) => sum + g.price, 0).toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGasForm(!showGasForm)}
            className="w-full py-3 bg-gray-950 hover:bg-gray-805 text-white font-bold rounded-2.5xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 text-orange-400" /> Registrar Carga de Gasolina
          </button>

          {/* ADD FUEL FORM */}
          {showGasForm && (
            <form onSubmit={handleAddGas} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl space-y-4 animate-in slide-in-from-top-5 duration-200">
              <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">Registrar Recarga de Gasolina</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Costo Total Pagado ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={gasPrice}
                      onChange={(e) => setGasPrice(e.target.value)}
                      placeholder="Ej. 15000"
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Litros Cargados (Cisterna/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gasLiters}
                    onChange={(e) => setGasLiters(e.target.value)}
                    placeholder="Ej. 10.5 ou opcional"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Odometer / Kilometraje Actual (km)</label>
                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={gasCurrentKm}
                    onChange={(e) => setGasCurrentKm(e.target.value)}
                    placeholder={`Por defecto estimará: ${currentOdometerEstimate || '0'} km`}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Observación</label>
                  <input
                    type="text"
                    value={gasObservation}
                    onChange={(e) => setGasObservation(e.target.value)}
                    placeholder="Ej. Estación Texaco, tanque lleno"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGasForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center"
                >
                  {loading ? 'Guardando...' : 'Guardar Carga'}
                </button>
              </div>
            </form>
          )}

          {/* HISTORY LOG OF REFUELLING */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Historial de Gasolina</h3>
            {gasLoads.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">Sin cargas de combustible registradas</p>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-xs">
                {gasLoads.map((g) => (
                  <div key={g.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xl bg-orange-50 p-2.5 rounded-xl border border-orange-100/30">⛽</span>
                      <div>
                        <h4 className="font-extrabold text-gray-900">${g.price.toLocaleString('es-CO')} cargados</h4>
                        <p className="text-[10px] text-gray-500">
                          {g.liters > 0 ? `${g.liters} litros` : 'Litros no indicados'} • {g.currentKm > 0 ? `${g.currentKm.toLocaleString()} km` : ''}
                        </p>
                        {g.observation && <p className="text-[9.5px] text-gray-400 mt-0.5 italic">"{g.observation}"</p>}
                        <span className="text-[8px] text-gray-400 font-mono italic block mt-0.5">
                          {new Date(g.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGas(g.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors shrink-0 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
