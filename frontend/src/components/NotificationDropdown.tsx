'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Clock, Award, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications/'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.unread_count || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('accepted')) return <Award size={16} className="text-green-600" />;
    if (type.includes('request')) return <Users size={16} className="text-blue-600" />;
    return <AlertCircle size={16} className="text-primary" />;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-gray-600 hover:text-primary"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    className={`p-3 rounded-xl transition-colors border ${
                      !n.is_read
                        ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                        : 'bg-white border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-gray-900 mb-0.5 flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(n.created_at + 'Z'), 'MMM d, h:mm a')}
                          </span>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => setOpen(false)}
                              className="text-[11px] font-semibold text-primary hover:underline"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
