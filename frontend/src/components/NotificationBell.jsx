import React, { useEffect, useRef, useState } from 'react';

export default function NotificationBell({ token }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

  function countUnread(arr) {
    return (arr || []).filter(n => !n.read).length;
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setItems(list);
      setUnread(countUnread(list));
    } catch (e) {
      // fail silently
    } finally { setLoading(false); }
  }

  async function markAsRead(id) {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setItems(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function onDocClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        aria-label="Notifications"
        className="relative p-2 rounded-full bg-white border shadow hover:shadow-md transition"
        onClick={() => setOpen(o => !o)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-emerald-600">
          <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6z" />
          <path d="M8 15a4 4 0 108 0H8z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-4 px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border rounded-xl shadow-lg z-50">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-800">Notifications</div>
            {loading && <div className="text-xs text-gray-500">Refreshing…</div>}
          </div>
          {items.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No notifications</div>
          )}
          <ul className="divide-y">
            {items.map(n => (
              <li key={n._id} className={`p-3 hover:bg-gray-50 cursor-pointer ${n.read ? '' : 'bg-emerald-50/40'}`} onClick={() => markAsRead(n._id)}>
                <div className="text-sm font-medium text-gray-900">{n.title || n.type || 'Update'}</div>
                <div className="text-xs text-gray-600">{n.message || n.body}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
