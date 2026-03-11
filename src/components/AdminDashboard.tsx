import React, { useState, useEffect } from 'react';
import { User, CompanyInfo, StockItem, ServiceItem, Submission, Document } from '../types';
import { 
  LayoutDashboard, Package, Settings, FileText, Users, 
  CheckCircle, XCircle, Eye, Trash2, Plus, Save, Upload, Download, Briefcase, Lock
} from 'lucide-react';
import InvoicePrint from './InvoicePrint';
import DraftPrint from './DraftPrint';

interface AdminDashboardProps {
  user: User;
  company: CompanyInfo | null;
  onCompanyUpdate: () => void;
}

export default function AdminDashboard({ user, company, onCompanyUpdate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'stock' | 'services' | 'settings' | 'documents' | 'technicians' | 'draff'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [technicians, setTechnicians] = useState<{ id: number; username: string }[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingDraft, setIsPrintingDraft] = useState(false);
  const [draftType, setDraftType] = useState<'invoice' | 'receipt'>('invoice');
  const [isEditing, setIsEditing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterTechnician, setFilterTechnician] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Form states
  const [newStock, setNewStock] = useState({ 
    name: '', 
    description: '', 
    category: '', 
    unit: 'Pcs', 
    quantity: 0, 
    min_stock: 5, 
    price: 0 
  });
  const [newService, setNewService] = useState({ name: '', description: '', price: 0 });
  const [newTech, setNewTech] = useState({ username: '', password: '' });
  const [newDoc, setNewDoc] = useState({ name: '', file_url: '' });
  const [companyForm, setCompanyForm] = useState<Partial<CompanyInfo>>({});
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (company) setCompanyForm(company);
  }, [company]);

  const fetchData = async () => {
    const endpoints = {
      submissions: `/api/submissions?role=admin`,
      stock: `/api/stock`,
      services: `/api/services`,
      documents: `/api/documents`,
      technicians: `/api/technicians`,
      settings: `/api/company`,
      draff: `/api/company` // Just to trigger something, though not needed for draff
    };
    
    try {
      const res = await fetch(endpoints[activeTab]);
      const data = await res.json();
      if (activeTab === 'submissions') setSubmissions(data);
      if (activeTab === 'stock') setStock(data);
      if (activeTab === 'services') setServices(data);
      if (activeTab === 'documents') setDocuments(data);
      if (activeTab === 'technicians') setTechnicians(data);
    } catch (e) {
      console.error('Fetch error', e);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'validated' | 'rejected') => {
    await fetch(`/api/submissions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
    setSelectedSubmission(null);
  };

  const handlePaymentStatusUpdate = async (id: number, payment_status: 'paid' | 'unpaid') => {
    await fetch(`/api/submissions/${id}/payment-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
    });
    fetchData();
    // Update selected submission state if it's the one being updated
    if (selectedSubmission && selectedSubmission.id === id) {
      setSelectedSubmission({ ...selectedSubmission, payment_status });
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
    fetchData();
    setSelectedSubmission(null);
  };

  const handleUpdateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    
    await fetch(`/api/submissions/${selectedSubmission.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedSubmission),
    });
    
    setIsEditing(false);
    fetchData();
    // Refresh selected submission
    const res = await fetch(`/api/submissions/${selectedSubmission.id}`);
    const data = await res.json();
    setSelectedSubmission(data);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStock),
    });
    setNewStock({ name: '', description: '', quantity: 0, price: 0 });
    fetchData();
  };

  const handleDeleteStock = async (id: number) => {
    await fetch(`/api/stock/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newService),
    });
    setNewService({ name: '', description: '', price: 0 });
    fetchData();
  };

  const handleDeleteService = async (id: number) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTech),
    });
    if (res.ok) {
      setNewTech({ username: '', password: '' });
      fetchData();
    } else {
      alert('Username already exists');
    }
  };

  const handleDeleteTech = async (id: number) => {
    await fetch(`/api/technicians/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyForm),
    });
    onCompanyUpdate();
    alert('Company info updated');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, newPassword: passwordForm.newPassword }),
    });
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    alert('Password updated successfully');
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc),
    });
    setNewDoc({ name: '', file_url: '' });
    fetchData();
  };

  const handleDeleteDoc = async (id: number) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const viewSubmission = async (id: number) => {
    const res = await fetch(`/api/submissions/${id}`);
    const data = await res.json();
    setSelectedSubmission(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature' | 'doc') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'logo') setCompanyForm({ ...companyForm, logo_url: base64String });
        if (type === 'signature') setCompanyForm({ ...companyForm, signature_url: base64String });
        if (type === 'doc') setNewDoc({ ...newDoc, file_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'submissions' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Submissions
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'stock' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <Package className="w-5 h-5" />
          Stock Management
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'services' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <Briefcase className="w-5 h-5" />
          Service Management
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'documents' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <FileText className="w-5 h-5" />
          MOU Documents
        </button>
        <button
          onClick={() => setActiveTab('technicians')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'technicians' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <Users className="w-5 h-5" />
          Technicians
        </button>
        <button
          onClick={() => setActiveTab('draff')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'draff' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <FileText className="w-5 h-5" />
          Draff
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          <Settings className="w-5 h-5" />
          Company Settings
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {activeTab === 'submissions' && (
          <div className="p-6">
            <div className="flex flex-col gap-6 mb-8">
              <h2 className="text-xl font-bold">Recent Submissions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-400">Cari Klien</label>
                  <input 
                    type="text" 
                    placeholder="Nama klien..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-400">Teknisi</label>
                  <select 
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="all">Semua Teknisi</option>
                    {technicians.map(t => <option key={t.id} value={t.username}>{t.username}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-400">Status Transaksi</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="validated">Validated</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-400">Status Pembayaran</label>
                  <select 
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="all">Semua Pembayaran</option>
                    <option value="unpaid">Belum Lunas</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-400">Tanggal</label>
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Date</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Technician</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Type</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Client</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Amount</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Payment</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Status</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {submissions
                    .filter(s => {
                      const matchesText = s.client_name.toLowerCase().includes(filterText.toLowerCase());
                      const matchesTech = filterTechnician === 'all' || s.technician_name === filterTechnician;
                      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
                      const matchesPayment = filterPaymentStatus === 'all' || s.payment_status === filterPaymentStatus;
                      const matchesDate = !filterDate || s.created_at.startsWith(filterDate);
                      return matchesText && matchesTech && matchesStatus && matchesPayment && matchesDate;
                    })
                    .map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-sm font-medium">{s.technician_name}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${s.type === 'invoice' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">{s.client_name}</td>
                      <td className="py-4 px-4 text-sm font-bold">Rp {s.total_amount.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                          s.payment_status === 'paid' ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-400'
                        }`}>
                          {s.payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                          s.status === 'validated' ? 'bg-green-50 text-green-600' : 
                          s.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 flex gap-2">
                        <button onClick={() => viewSubmission(s.id)} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {s.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusUpdate(s.id, 'validated')} className="p-2 text-green-400 hover:text-green-600 transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleStatusUpdate(s.id, 'rejected')} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Stock Management</h2>
            </div>
            
            <form onSubmit={handleAddStock} className="space-y-4 mb-8 p-6 bg-stone-50 rounded-xl border border-stone-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kabel UTP Cat6"
                    value={newStock.name || ''}
                    onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Material / Sparepart"
                    value={newStock.category || ''}
                    onChange={(e) => setNewStock({ ...newStock, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Unit</label>
                  <select
                    value={newStock.unit || 'Pcs'}
                    onChange={(e) => setNewStock({ ...newStock, unit: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Meter">Meter</option>
                    <option value="Roll">Roll</option>
                    <option value="Box">Box</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Quantity</label>
                  <input
                    type="number"
                    value={isNaN(newStock.quantity) ? '' : newStock.quantity}
                    onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Min. Stock Alert</label>
                  <input
                    type="number"
                    value={isNaN(newStock.min_stock) ? '' : newStock.min_stock}
                    onChange={(e) => setNewStock({ ...newStock, min_stock: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Price (Rp)</label>
                  <input
                    type="number"
                    value={isNaN(newStock.price) ? '' : newStock.price}
                    onChange={(e) => setNewStock({ ...newStock, price: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 font-bold"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-stone-900 text-white py-2 rounded-lg font-bold hover:bg-stone-800 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Description</label>
                <textarea
                  placeholder="Optional item description..."
                  value={newStock.description || ''}
                  onChange={(e) => setNewStock({ ...newStock, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 h-20"
                />
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Item Info</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Category</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Stock Level</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Price</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {stock.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-stone-400">{item.description || 'No description'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded-md text-stone-600 font-medium">
                          {item.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${item.quantity <= item.min_stock ? 'text-red-600' : 'text-stone-900'}`}>
                            {item.quantity} {item.unit}
                          </span>
                          {item.quantity <= item.min_stock && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Low</span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 uppercase">Min: {item.min_stock}</p>
                      </td>
                      <td className="py-4 px-4 text-sm font-black">Rp {item.price.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <button onClick={() => handleDeleteStock(item.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Service Management</h2>
            </div>
            
            <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <input
                type="text"
                placeholder="Service Name"
                value={newService.name || ''}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={newService.description || ''}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={isNaN(newService.price) ? '' : newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                className="px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                required
              />
              <button type="submit" className="bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Name</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Description</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Price</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase text-stone-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {services.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium">{item.name}</td>
                      <td className="py-4 px-4 text-sm">{item.description}</td>
                      <td className="py-4 px-4 text-sm font-bold">Rp {item.price.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <button onClick={() => handleDeleteService(item.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Manage Technicians</h2>
            
            <form onSubmit={handleAddTech} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <input
                type="text"
                placeholder="Username"
                value={newTech.username || ''}
                onChange={(e) => setNewTech({ ...newTech, username: e.target.value })}
                className="px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newTech.password || ''}
                onChange={(e) => setNewTech({ ...newTech, password: e.target.value })}
                className="px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                required
              />
              <button type="submit" className="bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Technician
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technicians.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-stone-500" />
                    </div>
                    <span className="font-bold">{tech.username}</span>
                  </div>
                  <button onClick={() => handleDeleteTech(tech.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">MOU Documents</h2>
            
            <form onSubmit={handleAddDoc} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <input
                type="text"
                placeholder="Document Name"
                value={newDoc.name || ''}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                className="px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900"
                required
              />
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'doc')}
                  className="hidden"
                  id="doc-upload"
                />
                <label htmlFor="doc-upload" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                  <Upload className="w-4 h-4" /> {newDoc.file_url ? 'File Selected' : 'Upload File'}
                </label>
              </div>
              <button type="submit" className="bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-stone-500" />
                    <span className="font-bold">{doc.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={doc.file_url} download={doc.name} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'draff' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <h2 className="text-2xl font-bold mb-2">Draf Dokumen Mentah</h2>
            <p className="text-stone-500 mb-8">Cetak dokumen kosong untuk pengisian manual atau tulis tangan.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-stone-200 rounded-2xl p-6 hover:border-stone-900 transition-colors group">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Draf Invoice Kosong</h3>
                <p className="text-sm text-stone-500 mb-6">Template invoice tanpa data klien dan item, siap untuk ditulis tangan.</p>
                <button 
                  onClick={() => {
                    setDraftType('invoice');
                    setIsPrintingDraft(true);
                  }}
                  className="w-full bg-stone-100 text-stone-900 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Cetak Draf Invoice
                </button>
              </div>

              <div className="border border-stone-200 rounded-2xl p-6 hover:border-stone-900 transition-colors group">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Draf Nota Pelunasan Kosong</h3>
                <p className="text-sm text-stone-500 mb-6">Template nota pelunasan kosong untuk bukti pembayaran manual.</p>
                <button 
                  onClick={() => {
                    setDraftType('receipt');
                    setIsPrintingDraft(true);
                  }}
                  className="w-full bg-stone-100 text-stone-900 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Cetak Draf Nota
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Company Information</h2>
            <form onSubmit={handleUpdateCompany} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Company Name</label>
                  <input
                    type="text"
                    value={companyForm.name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">NPWP (Optional)</label>
                  <input
                    type="text"
                    value={companyForm.npwp || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, npwp: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Phone</label>
                  <input
                    type="text"
                    value={companyForm.phone || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Email</label>
                  <input
                    type="email"
                    value={companyForm.email || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Address</label>
                <textarea
                  value={companyForm.address || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Signatory Name</label>
                  <input
                    type="text"
                    value={companyForm.signatory_name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, signatory_name: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Signatory Role</label>
                  <input
                    type="text"
                    value={companyForm.signatory_role || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, signatory_role: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Bank Name</label>
                  <input
                    type="text"
                    value={companyForm.bank_name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, bank_name: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="e.g. Bank Central Asia (BCA)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Account Number</label>
                  <input
                    type="text"
                    value={companyForm.bank_account_number || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, bank_account_number: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Account Name</label>
                  <input
                    type="text"
                    value={companyForm.bank_account_name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, bank_account_name: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="e.g. PT. Nama Perusahaan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Company Logo</label>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-50 border border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                    <Upload className="w-4 h-4" /> {companyForm.logo_url ? 'Change Logo' : 'Upload Logo'}
                  </label>
                  {companyForm.logo_url && <img src={companyForm.logo_url} className="h-16 object-contain mt-2" referrerPolicy="no-referrer" />}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Digital Signature</label>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'signature')} className="hidden" id="sig-upload" />
                  <label htmlFor="sig-upload" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-50 border border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                    <Upload className="w-4 h-4" /> {companyForm.signature_url ? 'Change Signature' : 'Upload Signature'}
                  </label>
                  {companyForm.signature_url && <img src={companyForm.signature_url} className="h-16 object-contain mt-2" referrerPolicy="no-referrer" />}
                </div>
              </div>

              <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </form>

            <div className="mt-12 pt-12 border-t border-stone-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Change Admin Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <button type="submit" className="bg-stone-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-stone-800 transition-colors">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal for editing submission */}
      {isEditing && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Edit Transaction</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-stone-100 rounded-full">
                <XCircle className="w-6 h-6 text-stone-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmission} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Client Name</label>
                  <input 
                    type="text" 
                    value={selectedSubmission.client_name || ''}
                    onChange={(e) => setSelectedSubmission({...selectedSubmission, client_name: e.target.value})}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Due Date</label>
                  <input 
                    type="date" 
                    value={selectedSubmission.due_date || ''}
                    onChange={(e) => setSelectedSubmission({...selectedSubmission, due_date: e.target.value})}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Address</label>
                <textarea 
                  value={selectedSubmission.client_address || ''}
                  onChange={(e) => setSelectedSubmission({...selectedSubmission, client_address: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Other Costs</label>
                  <input 
                    type="number" 
                    value={selectedSubmission.other_costs ?? 0}
                    onChange={(e) => setSelectedSubmission({...selectedSubmission, other_costs: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">PPN</label>
                  <input 
                    type="number" 
                    value={selectedSubmission.ppn ?? 0}
                    onChange={(e) => setSelectedSubmission({...selectedSubmission, ppn: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Down Payment</label>
                  <input 
                    type="number" 
                    value={selectedSubmission.down_payment ?? 0}
                    onChange={(e) => setSelectedSubmission({...selectedSubmission, down_payment: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Payment Status</label>
                  <select 
                    value={selectedSubmission.payment_status || 'unpaid'}
                    onChange={(e) => setSelectedSubmission({...selectedSubmission, payment_status: e.target.value as 'paid' | 'unpaid'})}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                  >
                    <option value="unpaid">Belum Lunas</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Submission Details</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-stone-100 text-stone-900 px-4 py-2 rounded-lg font-bold hover:bg-stone-200 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handlePaymentStatusUpdate(selectedSubmission.id, selectedSubmission.payment_status === 'paid' ? 'unpaid' : 'paid')}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    selectedSubmission.payment_status === 'paid' 
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {selectedSubmission.payment_status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                </button>
                <button 
                  onClick={() => setIsPrinting(true)}
                  className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-stone-800 transition-colors"
                >
                  Print Document
                </button>
                <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-stone-100 rounded-full">
                  <XCircle className="w-6 h-6 text-stone-400" />
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xs font-bold uppercase text-stone-400 mb-2">Client Info</h4>
                  <p className="font-bold text-lg">{selectedSubmission.client_name}</p>
                  <p className="text-stone-600">{selectedSubmission.client_address}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold uppercase text-stone-400 mb-2">Metadata</h4>
                  <p><span className="text-stone-500">Type:</span> <span className="font-bold uppercase">{selectedSubmission.type}</span></p>
                  <p><span className="text-stone-500">Date:</span> {new Date(selectedSubmission.created_at).toLocaleDateString()}</p>
                  <p>
                    <span className="text-stone-500">Payment:</span>{' '}
                    <span className={`font-bold ${selectedSubmission.payment_status === 'paid' ? 'text-blue-600' : 'text-stone-400'}`}>
                      {selectedSubmission.payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                  </p>
                  {selectedSubmission.type === 'invoice' && (
                    <p><span className="text-stone-500">Due Date:</span> {selectedSubmission.due_date}</p>
                  )}
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-8">
                <thead>
                  <tr className="border-b-2 border-stone-900">
                    <th className="py-3 px-2 text-xs font-bold uppercase">Item</th>
                    <th className="py-3 px-2 text-xs font-bold uppercase">Description</th>
                    <th className="py-3 px-2 text-xs font-bold uppercase text-right">Qty</th>
                    <th className="py-3 px-2 text-xs font-bold uppercase text-right">Price</th>
                    <th className="py-3 px-2 text-xs font-bold uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {selectedSubmission.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 text-sm font-bold">{item.item_name}</td>
                      <td className="py-3 px-2 text-sm text-stone-600">{item.description}</td>
                      <td className="py-3 px-2 text-sm text-right">{item.quantity}</td>
                      <td className="py-3 px-2 text-sm text-right">Rp {item.price.toLocaleString()}</td>
                      <td className="py-3 px-2 text-sm font-bold text-right">Rp {(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {selectedSubmission.other_costs > 0 && (
                    <tr className="border-t border-stone-100">
                      <td colSpan={4} className="py-2 text-right text-stone-500 italic">{selectedSubmission.other_costs_description || 'Biaya Lain-lain'}</td>
                      <td className="py-2 text-right font-medium">Rp {selectedSubmission.other_costs.toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedSubmission.ppn > 0 && (
                    <tr className="border-t border-stone-100">
                      <td colSpan={4} className="py-2 text-right text-stone-500 italic">PPN</td>
                      <td className="py-2 text-right font-medium">Rp {selectedSubmission.ppn.toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedSubmission.down_payment > 0 && (
                    <>
                      <tr className="border-t border-stone-100">
                        <td colSpan={4} className="py-2 text-right text-blue-500 italic">Uang Muka (DP)</td>
                        <td className="py-2 text-right font-medium text-blue-600">Rp {selectedSubmission.down_payment.toLocaleString()}</td>
                      </tr>
                      <tr className="border-t border-stone-100">
                        <td colSpan={4} className="py-2 text-right text-stone-500 font-bold">Sisa Tagihan</td>
                        <td className="py-2 text-right font-bold text-stone-900">Rp {(selectedSubmission.total_amount - selectedSubmission.down_payment).toLocaleString()}</td>
                      </tr>
                    </>
                  )}
                  <tr className="border-t-2 border-stone-900">
                    <td colSpan={4} className="py-4 text-right font-bold text-lg">Grand Total</td>
                    <td className="py-4 text-right font-bold text-lg text-stone-900">Rp {selectedSubmission.total_amount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printing component */}
      {isPrinting && selectedSubmission && company && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto">
          <div className="p-4 flex justify-end gap-2 no-print">
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Confirm Print</button>
            <button onClick={() => setIsPrinting(false)} className="bg-stone-200 px-6 py-2 rounded-lg font-bold">Cancel</button>
          </div>
          <InvoicePrint submission={selectedSubmission} company={company} />
        </div>
      )}

      {isPrintingDraft && company && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto">
          <div className="p-4 flex justify-end gap-2 no-print">
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Confirm Print</button>
            <button onClick={() => setIsPrintingDraft(false)} className="bg-stone-200 px-6 py-2 rounded-lg font-bold">Cancel</button>
          </div>
          <DraftPrint type={draftType} company={company} />
        </div>
      )}
    </div>
  );
}
