import React, { useEffect, useState } from 'react';
import Header from '../components/Header';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
        <div className="mt-4 bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Signed in as</div>
          <div className="font-semibold text-gray-800">{user?.fullName || user?.name || 'User'}</div>
          <div className="text-sm text-gray-600">{user?.email}</div>
        </div>
        <div className="mt-6 text-gray-700">Your recent activity and bookings will appear here.</div>
      </div>
    </div>
  );
}
