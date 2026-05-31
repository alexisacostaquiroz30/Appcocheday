import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { addTrip, updateTrip, deleteTrip } from '../db';
import { Plus, Check, Clock, Trash2, Search, Filter, MessageSquare, DollarSign, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface TripsManagerProps {
  trips: Trip[];
  onRefresh: () => void;
  uid: string;
}

export default function TripsManager({ trips, onRefresh, uid }: TripsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [fare, setFare] = useState('');
  const [observation, setObservation] = useState('');
  const [isPaid, setIsPaid] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'pending'>('all');
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPaid]);

  async function handleAddTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!passengerName || !fare) return;

    setLoading(true);
    const newTrip: Trip = {
      id: 'trip_' + Date.now().toString(),
      driverId: uid,
      passengerName,
      fare: parseFloat(fare),
      observation,
      isPaid,
      createdAt: new Date().toISOString(),
    };

    try {
      await addTrip(newTrip);
      setPassengerName('');
      setFare('');
      setObservation('');
      setIsPaid(true);
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePaid(trip: Trip) {
    const updated = { ...trip, isPaid: !trip.isPaid };
    try {
      await updateTrip(updated);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(tripId: string) {
    if (!confirm('¿Seguro quieres eliminar este viaje?')) return;
    try {
      await deleteTrip(tripId);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  // Filtering trips
  const filteredTrips = trips.filter(t => {
    const matchesSearch = t.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.observation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPaid === 'all' || 
                          (filterPaid === 'paid' && t.isPaid) || 
                          (filterPaid === 'pending' && !t.isPaid);
    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Registro de Viajes</h2>
          <p className="text-xs text-gray-500">Maneja tus carreras diarias</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gray-950 hover:bg-gray-800 text-white p-3 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all text-xs font-bold gap-1.5"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          Nuevo Viaje
        </button>
      </div>

      {/* Slide-down Form */}
      {showAddForm && (
        <form onSubmit={handleAddTrip} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl space-y-4 animate-in slide-in-from-top-5 duration-200">
          <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">Registrar Nueva Carrera</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Persona Transportada</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Ej. Pedro Picapiedra o Cliente Particular"
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Valor Pasaje / Tarifa ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={fare}
                  onChange={(e) => setFare(e.target.value)}
                  placeholder="Ej. 12000"
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Observación</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Detalles del viaje, desvíos u otra nota..."
                  rows={2}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                />
              </div>
            </div>

            {/* Paid status toggle buttons */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Estado de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    isPaid 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs' 
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Check className="h-4 w-4" /> Pagado de una
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    !isPaid 
                      ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-xs' 
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="h-4 w-4" /> Pendiente / Fiado
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1"
            >
              {loading ? 'Registrando...' : 'Agregar Carrera'}
            </button>
          </div>
        </form>
      )}

      {/* Filters and Search utilities */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por pasajero u observación..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-2xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-gray-950/5 focus:border-gray-500 transition-all"
          />
        </div>

        {/* Categories toggler */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterPaid('all')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black shrink-0 transition-colors border ${
              filterPaid === 'all' 
                ? 'bg-gray-950 text-white border-transparent' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos ({trips.length})
          </button>
          <button
            onClick={() => setFilterPaid('paid')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black shrink-0 transition-colors border ${
              filterPaid === 'paid' 
                ? 'bg-emerald-500 text-white border-transparent' 
                : 'bg-white text-emerald-600 border-gray-200 hover:bg-emerald-50'
            }`}
          >
            Pagados ({trips.filter(t => t.isPaid).length})
          </button>
          <button
            onClick={() => setFilterPaid('pending')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black shrink-0 transition-colors border ${
              filterPaid === 'pending' 
                ? 'bg-amber-500 text-white border-transparent' 
                : 'bg-white text-amber-600 border-gray-200 hover:bg-amber-50'
            }`}
          >
            Pendientes ({trips.filter(t => !t.isPaid).length})
          </button>
        </div>
      </div>

      {/* LEDGER RIDES LIST */}
      <div className="space-y-3">
        {filteredTrips.length === 0 ? (
          <div className="bg-white py-12 rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center p-6 shadow-xs">
            <span className="text-2xl mb-2">🛣️</span>
            <p className="text-xs text-gray-500 font-bold">No se encontraron viajes</p>
            <p className="text-[10px] text-gray-400 mt-1">Registra nuevos viajes usando el botón superior.</p>
          </div>
        ) : (
          paginatedTrips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-3xl p-4.5 border border-gray-100 shadow-xs flex flex-col gap-3 font-sans">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">{trip.passengerName}</h4>
                  <p className="text-[9px] text-gray-400 font-medium font-mono">
                    {new Date(trip.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                  trip.isPaid 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {trip.isPaid ? 'Pagado' : 'Pendiente'}
                </span>
              </div>

              {trip.observation && (
                <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 text-[11px] text-gray-500 font-medium">
                  {trip.observation}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <span className="text-md font-black text-gray-900">${trip.fare.toLocaleString('es-CO')}</span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePaid(trip)}
                    title={trip.isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
                    className={`p-2 rounded-xl transition-colors ${
                      trip.isPaid
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {trip.isPaid ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="p-2 bg-red-50 hover:bg-red-150 text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4.5 py-3 rounded-2.5xl border border-gray-100 shadow-xs mt-4">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center gap-1 text-xs font-bold text-gray-700 disabled:pointer-events-none active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 text-gray-600" />
            <span>Anterior</span>
          </button>
          
          <span className="text-[10px] font-black text-gray-800 font-mono">
            Pág. {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center gap-1 text-xs font-bold text-gray-700 disabled:pointer-events-none active:scale-95"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
