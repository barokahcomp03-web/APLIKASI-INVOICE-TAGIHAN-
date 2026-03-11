import React, { useState, useEffect } from 'react';
import { User, CompanyInfo, StockItem, ServiceItem, Submission, SubmissionItem, Document } from '../types';
import { 
  Plus, Trash2, Save, FileText, Download, 
  Package, History, AlertCircle, CheckCircle2, XCircle, Briefcase
} from 'lucide-react';
import InvoicePrint from './InvoicePrint';

interface TechnicianDashboardProps {
  user: User;
  company: CompanyInfo | null;
}

export default function TechnicianDashboard({ user, company }: TechnicianDashboardProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'mou'>('new');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [history, setHistory] = useState<Submission[]>([]);
  const [mous, setMous] = useState<Document[]>([]);
  
  // Form state
  const [type, setType] = useState<'invoice' | 'receipt'>('invoice');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [otherCosts, setOtherCosts] = useState<number>(0);
  const [otherCostsDescription, setOtherCostsDescription] = useState('');
  const [ppn, setPpn] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchStock();
    fetchServices();
    fetchHistory();
    fetchMous();
  }, [activeTab]);

  const viewSubmission = async (id: number) => {
    const res = await fetch(`/api/submissions/${id}`);
    const data = await res.json();
    setSelectedSubmission(data);
  };

  const fetchStock = async () => {
    const res = await fetch('/api/stock');
    const data = await res.json();
    setStock(data);
  };

  const fetchServices = async () => {
    const res = await fetch('/api/services');
    const data = await res.json();
    setServices(data);
  };

  const fetchHistory = async () => {
    const res = await fetch(`/api/submissions?role=technician&userId=${user.id}`);
    const data = await res.json();
    setHistory(data);
  };

  const fetchMous = async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setMous(data);
  };

  const addItem = () => {
    setItems([...items, { item_name: '', description: '', quantity: 1, price: 0, is_from_stock: false }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SubmissionItem, value: any) => {
    const newItems = [...items];
    if (field === 'stock_id') {
      const selectedStock = stock.find(s => s.id === parseInt(value));
      if (selectedStock) {
        newItems[index] = {
          ...newItems[index],
          stock_id: selectedStock.id,
          item_name: selectedStock.name,
          description: selectedStock.description || '',
          price: selectedStock.price,
          is_from_stock: true
        };
      }
    } else if (field === 'item_name' && typeof value === 'string' && value.startsWith('SERVICE:')) {
      const serviceId = parseInt(value.split(':')[1]);
      const selectedService = services.find(s => s.id === serviceId);
      if (selectedService) {
        newItems[index] = {
          ...newItems[index],
          item_name: selectedService.name,
          description: selectedService.description,
          price: selectedService.price,
          is_from_stock: false,
          stock_id: undefined
        };
      }
    } else {
      // If manually changing name or price, clear stock_id association
      if (field === 'item_name' || field === 'price') {
        newItems[index] = { 
          ...newItems[index], 
          [field]: value,
          stock_id: undefined,
          is_from_stock: false
        };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
    }
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => {
    const qty = isNaN(item.quantity) ? 0 : item.quantity;
    const price = isNaN(item.price) ? 0 : item.price;
    return sum + (qty * price);
  }, 0) + (isNaN(otherCosts) ? 0 : otherCosts) + (isNaN(ppn) ? 0 : ppn);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Please add at least one item');
    
    setLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_id: user.id,
          type,
          client_name: clientName,
          client_address: clientAddress,
          due_date: dueDate,
          payment_status: type === 'receipt' ? 'paid' : 'unpaid',
          other_costs: otherCosts,
          other_costs_description: otherCostsDescription,
          ppn: ppn,
          down_payment: downPayment,
          total_amount: totalAmount,
          items
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setItems([]);
        setClientName('');
        setClientAddress('');
        setDueDate('');
        setOtherCosts(0);
        setOtherCostsDescription('');
        setPpn(0);
        setDownPayment(0);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile-friendly Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'new' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          <Plus className="w-5 h-5" /> New Submission
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          <History className="w-5 h-5" /> My History
        </button>
        <button
          onClick={() => setActiveTab('mou')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'mou' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          <FileText className="w-5 h-5" /> MOU Docs
        </button>
      </div>

      {activeTab === 'new' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Form Transaksi</h2>
              <p className="text-stone-500 text-sm">Input detail pekerjaan & barang</p>
            </div>
            <div className="flex bg-stone-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('invoice')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === 'invoice' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
              >
                INVOICE
              </button>
              <button
                type="button"
                onClick={() => setType('receipt')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === 'receipt' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
              >
                RECEIPT
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-3 border border-green-100 animate-bounce">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">Berhasil terkirim! Menunggu validasi admin.</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Client Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4">
                  <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Informasi Pelanggan</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-500">Nama Pelanggan</label>
                    <input
                      type="text"
                      value={clientName || ''}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                      placeholder="Nama lengkap / Perusahaan"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-500">Alamat</label>
                    <textarea
                      value={clientAddress || ''}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm h-24"
                      placeholder="Alamat lengkap lokasi"
                      required
                    />
                  </div>

                  {type === 'invoice' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-stone-500">Jatuh Tempo</label>
                      <input
                        type="date"
                        value={dueDate || ''}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Items & Costs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Daftar Barang & Jasa</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="group relative bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 transition-all shadow-sm">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute -top-2 -right-2 bg-white text-red-400 hover:text-red-600 p-1 rounded-full border border-stone-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Pilih Barang/Jasa (Opsional)</label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.startsWith('SERVICE:')) {
                                updateItem(index, 'item_name', val);
                              } else if (val) {
                                updateItem(index, 'stock_id', val);
                              }
                            }}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-xs"
                          >
                            <option value="">-- Manual / Pilih --</option>
                            <optgroup label="Stok Barang">
                              {stock.map(s => (
                                <option key={`stock-${s.id}`} value={s.id}>
                                  {s.name} ({s.quantity} {s.unit})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Daftar Jasa">
                              {services.map(s => (
                                <option key={`service-${s.id}`} value={`SERVICE:${s.id}`}>{s.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        
                        <div className="md:col-span-4">
                          <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Nama Item</label>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                            className="w-full px-3 py-2 border border-stone-100 rounded-lg text-xs font-bold"
                            placeholder="Ketik nama barang/jasa"
                            required
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Qty</label>
                          <input
                            type="number"
                            value={isNaN(item.quantity) ? '' : item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? NaN : parseInt(e.target.value))}
                            className="w-full px-2 py-2 border border-stone-100 rounded-lg text-xs text-center"
                            min="1"
                            required
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Harga Satuan</label>
                          <input
                            type="number"
                            value={isNaN(item.price) ? '' : item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-stone-100 rounded-lg text-xs font-black text-right"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                      <Package className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                      <p className="text-stone-400 text-xs">Belum ada item ditambahkan</p>
                    </div>
                  )}
                </div>

                {/* Other Costs, PPN & DP Section */}
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4">
                  <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Biaya Tambahan & Pembayaran (Opsional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Keterangan Biaya Lain</label>
                      <input
                        type="text"
                        value={otherCostsDescription || ''}
                        onChange={(e) => setOtherCostsDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                        placeholder="Contoh: Biaya Transport"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Biaya Lain (Rp)</label>
                      <input
                        type="number"
                        value={isNaN(otherCosts) ? '' : otherCosts}
                        onChange={(e) => setOtherCosts(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm font-black text-right"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">PPN (Rp)</label>
                      <input
                        type="number"
                        value={isNaN(ppn) ? '' : ppn}
                        onChange={(e) => setPpn(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm font-black text-right"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-bold uppercase text-stone-400 mb-1 block">Uang Muka / DP (Rp)</label>
                      <input
                        type="number"
                        value={isNaN(downPayment) ? '' : downPayment}
                        onChange={(e) => setDownPayment(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-900 text-sm font-black text-right text-blue-600"
                        placeholder="DP yang diterima"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <div className="flex justify-between items-end mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-stone-400">Ringkasan Pembayaran</p>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] text-stone-400 uppercase">Total Transaksi</p>
                          <p className="text-xl font-black text-stone-900">Rp {(isNaN(totalAmount) ? 0 : totalAmount).toLocaleString()}</p>
                        </div>
                        {downPayment > 0 && (
                          <div>
                            <p className="text-[10px] text-blue-400 uppercase">Sisa Tagihan</p>
                            <p className="text-xl font-black text-blue-600">Rp {(totalAmount - downPayment).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="bg-stone-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Mengirim...' : (
                        <>
                          <Save className="w-5 h-5" /> Simpan Transaksi
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold">My Submissions</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Cari klien..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="flex-1 md:w-48 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            {history
              .filter(s => {
                const matchesText = s.client_name.toLowerCase().includes(filterText.toLowerCase());
                const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
                return matchesText && matchesStatus;
              })
              .map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border border-stone-100 rounded-xl hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.type === 'invoice' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{s.client_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-bold text-stone-600">Rp {s.total_amount.toLocaleString()}</span>
                      <span>•</span>
                      <span className={`font-black uppercase ${s.payment_status === 'paid' ? 'text-blue-500' : 'text-stone-300'}`}>
                        {s.payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    s.status === 'validated' ? 'bg-green-50 text-green-600' : 
                    s.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {s.status}
                  </span>
                  {s.status === 'validated' && (
                    <button 
                      onClick={() => viewSubmission(s.id)}
                      className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                  {s.status === 'pending' && (
                    <div className="group relative">
                      <AlertCircle className="w-5 h-5 text-stone-300" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-stone-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Waiting for admin to validate before you can print.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-20">
                <History className="w-16 h-16 text-stone-100 mx-auto mb-4" />
                <p className="text-stone-400">No submissions yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mou' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h2 className="text-xl font-bold mb-6">MOU & Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mous.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-stone-500" />
                  <span className="font-bold">{doc.name}</span>
                </div>
                <a href={doc.file_url} download={doc.name} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-bold border border-stone-200 hover:bg-stone-100 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            ))}

            {mous.length === 0 && (
              <div className="col-span-full text-center py-20">
                <FileText className="w-16 h-16 text-stone-100 mx-auto mb-4" />
                <p className="text-stone-400">No documents available</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal for viewing submission */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Submission Details</h3>
              <div className="flex gap-2">
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
    </div>
  );
}
