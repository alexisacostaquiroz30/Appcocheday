import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { addExpense, deleteExpense } from '../db';
import { Plus, Trash2, ShoppingBag, DollarSign, MessageSquare, Coffee, Check, Search } from 'lucide-react';

interface ExpensesManagerProps {
  expenses: Expense[];
  onRefresh: () => void;
  uid: string;
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  dulces: '🍬',
  agua: '💧',
  bebida: '🥤',
  comida: '🍔',
  otros: '⚙️',
};

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  dulces: 'Dulces / Caramelos',
  agua: 'Agua / Hidratación',
  bebida: 'Gaseosas / Bebidas',
  comida: 'Comida / Snacks',
  otros: 'Otros Pequeños Gastos',
};

const CATEGORIES: ExpenseCategory[] = ['dulces', 'agua', 'bebida', 'comida', 'otros'];

export default function ExpensesManager({ expenses, onRefresh, uid }: ExpensesManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('dulces');
  const [amount, setAmount] = useState('');
  const [observation, setObservation] = useState('');
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseCategory>('all');
  const [loading, setLoading] = useState(false);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    const newExpense: Expense = {
      id: 'exp_' + Date.now().toString(),
      driverId: uid,
      category,
      amount: parseFloat(amount),
      observation,
      createdAt: new Date().toISOString(),
    };

    try {
      await addExpense(newExpense);
      setAmount('');
      setObservation('');
      setCategory('dulces');
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(expenseId: string) {
    if (!confirm('¿Seguro quieres eliminar este gasto hormiga?')) return;
    try {
      await deleteExpense(expenseId);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredExpenses = expenses.filter(e => {
    return selectedFilter === 'all' || e.category === selectedFilter;
  });

  const sumTotalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Gastos Hormiga</h2>
          <p className="text-xs text-gray-500">Pequeños y sutiles egresos diarios</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gray-950 hover:bg-gray-800 text-white p-3 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all text-xs font-bold gap-1.5"
        >
          <Plus className="h-4 w-4 text-rose-400" />
          Registrar Gasto
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl space-y-4 animate-in slide-in-from-top-5 duration-200">
          <h3 className="text-xs font-bold text-gray-900 border-b border-gray-50 pb-2">Registrar Nuevo Gasto Hormiga</h3>

          {/* Quick select category grid */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Selecciona Categoría</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-3 rounded-2xl flex flex-col items-center justify-center border transition-all text-xs gap-1 ${
                    category === cat 
                      ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-900/5' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-transparent'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-[9px] font-bold capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Valor del Gasto ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej. 1500"
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Observación / Detalle</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Detalles (Ej: Botella de agua fría, Chicles para el auto...)"
                  rows={2}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-xs transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
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
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      )}

      {/* Categories slider filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-[10px] font-black shrink-0 transition-colors border ${
            selectedFilter === 'all' 
              ? 'bg-gray-950 text-white border-transparent' 
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todo Gasto (${expenses.reduce((s,e) => s+e.amount, 0).toLocaleString()})
        </button>
        {CATEGORIES.map((cat) => {
          const catSum = expenses.filter(e => e.category === cat).reduce((s,e) => s+e.amount,0);
          return (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-black shrink-0 transition-colors border flex items-center gap-1 ${
                selectedFilter === cat 
                  ? 'bg-rose-500 text-white border-transparent' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="capitalize">{cat} (${catSum.toLocaleString()})</span>
            </button>
          );
        })}
      </div>

      {/* Total Aggregator Box */}
      <div className="bg-rose-50 border border-rose-100 rounded-2.5xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Subtotal Seleccionado</p>
          <span className="text-xl font-black text-rose-950">${sumTotalFiltered.toLocaleString('es-CO')}</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-xl">
          💸
        </div>
      </div>

      {/* Ledger lists of items */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white py-12 rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center p-6 shadow-xs">
            <span className="text-2xl mb-2">🍭</span>
            <p className="text-xs text-gray-500 font-bold">Sin gastos en esta categoría</p>
            <p className="text-[10px] text-gray-400 mt-1">Saboriza tus viajes; registra gastos pequeños arriba.</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div key={exp.id} className="bg-white rounded-2.5xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                  {CATEGORY_ICONS[exp.category]}
                </span>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900">{CATEGORY_NAMES[exp.category]}</h4>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {exp.observation || 'Gasto hormiga diario'}
                  </p>
                  <span className="text-[8.5px] text-gray-400 font-mono">
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-extrabold text-sm text-gray-900">${exp.amount.toLocaleString('es-CO')}</span>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
