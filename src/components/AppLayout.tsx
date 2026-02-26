import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Receipt, 
  Wrench, 
  LogOut, 
  Menu, 
  X,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

// --- COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-4 text-sm font-medium transition-colors rounded-xl group active:scale-[0.98]",
      active 
        ? "bg-emerald-500/10 text-emerald-400" 
        : "text-zinc-400 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={20} className={cn(active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} />
    {label}
  </button>
);

const StatCard = ({ title, value, subValue, icon: Icon, trend, color }: any) => (
  <div className="p-6 border rounded-2xl bg-zinc-900/50 border-white/5">
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-2 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-2xl font-bold text-white">{value}</span>
      {subValue && <span className="text-xs text-zinc-500">{subValue}</span>}
    </div>
  </div>
);

// --- PAGES ---

const Dashboard = ({ onRecordPayment, onAddExpense }: any) => {
  const api = useApi();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(setStats).finally(() => setLoading(false));
  }, []);

  const exportToExcel = async () => {
    const payments = await api.get('/payments');
    const ws = XLSX.utils.json_to_sheet(payments);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "LandlordOS_Report.xlsx");
  };

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Loading control tower...</div>;

  const chartData = [
    { name: 'Income', value: stats.monthlyIncome, color: '#10b981' },
    { name: 'Expenses', value: stats.monthlyExpenses, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Overview</h1>
          <p className="text-zinc-400">Real-time performance of your portfolio</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onRecordPayment}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-500"
          >
            <Plus size={18} /> Record Payment
          </button>
          <button 
            onClick={onAddExpense}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border text-zinc-300 border-white/10 rounded-xl hover:bg-white/5"
          >
            <Receipt size={18} /> Add Expense
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border text-zinc-300 border-white/10 rounded-xl hover:bg-white/5"
          >
            <ArrowDownRight size={18} /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(stats.netProfit)} 
          icon={TrendingUp} 
          color="bg-emerald-500"
          trend={12}
        />
        <StatCard 
          title="Total Income" 
          value={formatCurrency(stats.monthlyIncome)} 
          icon={Wallet} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Arrears" 
          value={formatCurrency(stats.totalArrears)} 
          icon={AlertCircle} 
          color="bg-rose-500"
        />
        <StatCard 
          title="Occupancy" 
          value={`${stats.occupancyRate.toFixed(1)}%`} 
          subValue={`${stats.occupiedUnits}/${stats.totalUnits} Units`}
          icon={Building2} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="p-6 border lg:col-span-2 rounded-2xl bg-zinc-900/50 border-white/5">
          <h3 className="mb-6 text-lg font-semibold text-white">Income vs Expenses</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border rounded-2xl bg-zinc-900/50 border-white/5">
          <h3 className="mb-6 text-lg font-semibold text-white">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Rent Paid - Unit 4B</p>
                  <p className="text-xs text-zinc-500">2 hours ago</p>
                </div>
                <div className="ml-auto text-sm font-semibold text-emerald-400">+{formatCurrency(1200000)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Properties = () => {
  const api = useApi();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties').then(setProperties).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Properties</h1>
          <p className="text-zinc-400">Manage your real estate assets</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-500">
          <Plus size={18} /> Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <div key={p.id} className="overflow-hidden border rounded-2xl bg-zinc-900/50 border-white/5 group">
            <div className="relative h-40 bg-zinc-800">
              <img 
                src={`https://picsum.photos/seed/${p.id}/800/400`} 
                alt={p.name}
                className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 px-2 py-1 text-[10px] font-bold tracking-wider uppercase bg-emerald-500 text-white rounded">
                {p.total_units} Units
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{p.address}</p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Occupancy</p>
                  <div className="w-full h-1.5 mt-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <button className="px-4 py-2 text-xs font-bold text-white uppercase transition-colors border border-white/10 rounded-lg hover:bg-white/5">
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Tenants = () => {
  const api = useApi();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants').then(setTenants).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenants</h1>
          <p className="text-zinc-400">Directory and lease management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-500">
          <Plus size={18} /> New Lease
        </button>
      </div>

      <div className="overflow-hidden border rounded-2xl bg-zinc-900/50 border-white/5">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Tenant</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Property / Unit</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Rent</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Lease End</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                        {t.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.full_name}</p>
                        <p className="text-xs text-zinc-500">{t.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white">{t.property_name}</p>
                    <p className="text-xs text-emerald-400 font-medium">{t.unit_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{formatCurrency(t.rent_amount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock size={14} />
                      {formatDate(t.lease_end)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-zinc-500 hover:text-white transition-colors">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Payments = () => {
  const api = useApi();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then(setPayments).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Rent Payments</h1>
          <p className="text-zinc-400">Immutable journal of all transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-500">
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div className="overflow-hidden border rounded-2xl bg-zinc-900/50 border-white/5">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Tenant</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Property / Unit</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Method</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Ref #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">{formatDate(p.payment_date)}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-white">{p.tenant_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white">{p.property_name}</p>
                    <p className="text-xs text-zinc-500">{p.unit_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(p.amount_paid)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-zinc-800 text-zinc-400">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{p.reference_number || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Expenses = () => {
  const api = useApi();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/expenses').then(setExpenses).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-zinc-400">Track maintenance and operational costs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-rose-600 rounded-xl hover:bg-rose-500">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="overflow-hidden border rounded-2xl bg-zinc-900/50 border-white/5">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Property</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">{formatDate(e.date)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-zinc-800 text-zinc-400">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{e.property_name}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-rose-400">{formatCurrency(e.amount)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 italic">{e.notes || 'No notes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Maintenance = () => {
  const api = useApi();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/maintenance').then(setTickets).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Maintenance</h1>
          <p className="text-zinc-400">Track and resolve unit issues</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 rounded-xl hover:bg-amber-500">
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((t) => (
          <div key={t.id} className="p-6 border rounded-2xl bg-zinc-900/50 border-white/5">
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded",
                t.status === 'PENDING' ? "bg-rose-500/10 text-rose-400" :
                t.status === 'IN_PROGRESS' ? "bg-amber-500/10 text-amber-400" :
                "bg-emerald-500/10 text-emerald-400"
              )}>
                {t.status.replace('_', ' ')}
              </div>
              <span className="text-xs text-zinc-500">{formatDate(t.created_at)}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{t.property_name} - {t.unit_number}</h3>
            <p className="mt-2 text-sm text-zinc-400 line-clamp-3">{t.description}</p>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  {t.assigned_to?.charAt(0) || '?'}
                </div>
                <span className="text-xs text-zinc-500">{t.assigned_to || 'Unassigned'}</span>
              </div>
              <button className="text-xs font-bold text-emerald-400 uppercase hover:underline">
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MODALS ---

const RecordPaymentModal = ({ isOpen, onClose, onSuccess }: any) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount_paid: '',
    method: 'CASH',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/tenants').then(setTenants);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedTenant = tenants.find(t => t.id === formData.tenant_id);
      await api.post('/payments', {
        ...formData,
        property_id: selectedTenant.property_id,
        unit_id: selectedTenant.unit_id,
        amount_paid: parseFloat(formData.amount_paid),
        amount_due_at_time: selectedTenant.rent_amount, // Simplified for MVP
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 border bg-zinc-950 border-white/10 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Record Payment</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Select Tenant</label>
            <select 
              required
              className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              value={formData.tenant_id}
              onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
            >
              <option value="">Choose a tenant...</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.unit_number})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Amount Paid</label>
            <input 
              type="number" 
              required
              className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              value={formData.amount_paid}
              onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Method</label>
              <select 
                className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Date</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Reference Number</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. TXN-12345"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 text-sm font-bold text-white transition-all bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AddExpenseModal = ({ isOpen, onClose, onSuccess }: any) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    property_id: '',
    category: 'MAINTENANCE',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/properties').then(setProperties);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 border bg-zinc-950 border-white/10 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Expense</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Property</label>
            <select 
              required
              className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              value={formData.property_id}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
            >
              <option value="">Choose a property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Category</label>
              <select 
                className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UTILITY">Utility</option>
                <option value="REPAIR">Repair</option>
                <option value="VENDOR">Vendor</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Amount</label>
              <input 
                type="number" 
                required
                className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Date</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Notes</label>
            <textarea 
              className="w-full px-4 py-2 text-white border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[100px]"
              placeholder="Describe the expense..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 text-sm font-bold text-white transition-all bg-rose-600 rounded-xl hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Record Expense'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- MAIN LAYOUT ---

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const refreshData = () => {
    // This is a simple way to trigger re-renders in child components
    // In a real app, we'd use a global state or react-query
    window.location.reload();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: <Dashboard onRecordPayment={() => setIsPaymentModalOpen(true)} onAddExpense={() => setIsExpenseModalOpen(true)} /> },
    { id: 'properties', label: 'Properties', icon: Building2, component: <Properties /> },
    { id: 'tenants', label: 'Tenants', icon: Users, component: <Tenants /> },
    { id: 'payments', label: 'Payments', icon: CreditCard, component: <Payments /> },
    { id: 'expenses', label: 'Expenses', icon: Receipt, component: <Expenses /> },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, component: <Maintenance /> },
  ];

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      <RecordPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        onSuccess={refreshData}
      />
      <AddExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={refreshData}
      />
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 border-r bg-zinc-950 border-white/5 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500">
            <Building2 className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Landlord<span className="text-emerald-500">OS</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400">
              {user?.fullName.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full gap-3 px-4 py-2 text-sm font-medium transition-colors rounded-lg text-zinc-400 hover:text-white hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b bg-zinc-950/80 backdrop-blur-xl border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 transition-colors rounded-lg lg:hidden text-zinc-400 hover:bg-white/5"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search tenants, units..." 
                className="w-64 px-4 py-2 text-sm transition-all border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Synced
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {menuItems.find(i => i.id === activeTab)?.component}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
