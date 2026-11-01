import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api';

const typeStyles = {
  offer_received: 'bg-green-50 border-green-200 text-green-800',
  application_rejected: 'bg-red-50 border-red-200 text-red-800',
  interview_scheduled: 'bg-blue-50 border-blue-200 text-blue-800',
  interview_reminder_24h: 'bg-amber-50 border-amber-200 text-amber-800',
  interview_reminder_1h: 'bg-amber-50 border-amber-200 text-amber-800',
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [studentId, setStudentId] = useState('');

  const apiBase = useMemo(() => (api.defaults.baseURL || '').replace('/api', ''), []);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications/student');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await api.get('/student/dashboard');
        setStudentId(data.profile?._id || '');
      } catch (err) {
        console.error('Failed to load student profile for socket room:', err.message);
      }
      await loadNotifications();
    };
    boot();
  }, []);

  useEffect(() => {
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!studentId) return undefined;
    const socket = io(apiBase, {
      withCredentials: true,
      query: { studentId },
    });

    socket.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 200));
      setUnreadCount((prev) => prev + 1);
    });
    socket.on('notification:badge_count:refresh', loadNotifications);

    return () => socket.disconnect();
  }, [studentId, apiBase]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/student/${id}/read`);
      setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, status: 'read' } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  };

  const markAllRead = async () => {
    await api.patch('/notifications/student/mark-all-read');
    setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' })));
    setUnreadCount(0);
  };

  const clearAll = async () => {
    await api.delete('/notifications/student/clear-all');
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative text-blue-900 hover:text-blue-700 px-2 py-2 rounded-md transition"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] min-w-[45px] h-[45px] rounded-full bg-red-500 text-white flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[380px] max-h-[70vh] overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
            <h4 className="font-semibold text-slate-900">Notifications</h4>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={markAllRead} className="text-blue-600 hover:text-blue-800">Mark all as read</button>
              <button onClick={clearAll} className="text-red-600 hover:text-red-800">Clear all</button>
            </div>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500 text-center">No notifications yet.</div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item._id}
                  onClick={() => item.status === 'unread' && markAsRead(item._id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 ${
                    item.status === 'unread' ? 'bg-slate-50' : 'bg-white'
                  } ${typeStyles[item.type] || ''}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs mt-1 opacity-90">{item.message}</p>
                    </div>
                    <span className="text-[11px] opacity-70 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
