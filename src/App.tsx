import React, { useState, useEffect } from 'react';
import { User, CompanyInfo } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company');
      const data = await res.json();
      setCompany(data);
    } catch (e) {
      console.error('Failed to fetch company info', e);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {company?.logo_url && (
            <img src={company.logo_url} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
          )}
          <h1 className="text-xl font-bold tracking-tight">{company?.name || 'Management System'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-stone-500">
            {user.role === 'admin' ? 'Admin' : 'Technician'}: <span className="text-stone-900">{user.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {user.role === 'admin' ? (
          <AdminDashboard user={user} company={company} onCompanyUpdate={fetchCompany} />
        ) : (
          <TechnicianDashboard user={user} company={company} />
        )}
      </main>
    </div>
  );
}
