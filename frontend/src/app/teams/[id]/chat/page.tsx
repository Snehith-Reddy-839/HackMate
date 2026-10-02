'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import { Tooltip } from '@/components/ui/tooltip';
import { ChatSkeleton } from '@/components/skeletons';
import { ArrowLeft, Send, Users, Trophy, ShieldCheck, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: number;
  message: string;
  created_at: string;
  user_id: number;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
  isOptimistic?: boolean;
}

export default function TeamChatPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id;

  const [team, setTeam] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatMessageTime = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
      const d = new Date(s);
      return isNaN(d.getTime()) ? '' : format(d, 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/teams/${teamId}/messages`);
      // Merge with any in-flight optimistic message
      setMessages((prev) => {
        const optimistic = prev.filter((m) => m.isOptimistic);
        const serverMessages: Message[] = res.data;
        return [...serverMessages, ...optimistic];
      });
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [tRes, meRes] = await Promise.all([
          api.get(`/teams/${teamId}`),
          api.get('/auth/me')
        ]);
        setTeam(tRes.data);
        setCurrentUser(meRes.data);
        await fetchMessages();
      } catch (err: any) {
        console.error(err);
        if (err?.response?.status === 403) {
          alert('You are not a member of this team and cannot access its chat.');
        } else {
          alert('Error fetching team details');
        }
        router.push('/dashboard');
      } finally {
        setLoadingInitial(false);
      }
    };
    if (teamId) fetchData();
  }, [teamId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for new messages every 5 seconds
  useEffect(() => {
    if (!teamId) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [teamId]);

  // Optimistic Message Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending || !currentUser) return;

    setSending(true);

    // 1. Optimistic item
    const tempId = -Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      message: text,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    // 2. Perform network call
    try {
      const res = await api.post(`/teams/${teamId}/messages`, { message: text });
      // Reconcile: replace optimistic message with verified server response
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.data : m))
      );
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(text); // restore input text so user does not lose it
      alert('Failed to send message. Please verify your connection.');
    } finally {
      setSending(false);
    }
  };

  if (loadingInitial || !team || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft size={18} /></Button>
            </Link>
            <div className="space-y-1">
              <div className="h-5 w-36 bg-gray-200 animate-pulse rounded-md" />
              <div className="h-3 w-24 bg-gray-100 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
        <ChatSkeleton />
      </div>
    );
  }

  const memberCount = team.members ? team.members.length : 1;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col max-h-screen">
      {/* SaaS Chat Header */}
      <header className="px-4 sm:px-6 py-3.5 bg-white border-b border-gray-200/80 shadow-xs flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <Link href={`/teams/${team.id}`}>
            <Tooltip content="Return to squad overview">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-600 hover:text-black">
                <ArrowLeft size={18} />
              </Button>
            </Tooltip>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-gray-950 truncate max-w-[200px] sm:max-w-md">
                {team.name}
              </h1>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 hidden sm:inline-flex">
                <Users size={11} className="mr-1" /> {memberCount} Squad Members
              </Badge>
            </div>
            <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <Trophy size={11} className="text-primary" /> {team.hackathon_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/teams/${team.id}`}>
            <Button variant="outline" size="sm" className="font-semibold text-xs h-8 rounded-xl hidden sm:inline-flex">
              View Squad Roster
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-gray-400 shadow-xs">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Squad chat is ready</p>
              <p className="text-xs text-gray-400">Say hello and start coordinating your hackathon project!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} group`}
              >
                {!isMe && (
                  <AvatarDisplay
                    avatar={msg.user?.avatar}
                    seed={msg.user?.name || 'Member'}
                    name={msg.user?.name}
                    size="sm"
                    className="mt-1 shadow-2xs"
                  />
                )}

                <div className={`space-y-1 max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 text-[11px] ${isMe ? 'justify-end text-gray-400' : 'text-gray-500'}`}>
                    <span className="font-semibold text-gray-700">{msg.user?.name || 'Member'}</span>
                    <span>•</span>
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {msg.isOptimistic && (
                      <span className="inline-flex items-center text-amber-600 font-semibold gap-0.5">
                        <Clock size={10} className="animate-spin" /> Sending...
                      </span>
                    )}
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                      isMe
                        ? 'bg-black text-white rounded-tr-xs'
                        : 'bg-white border border-gray-200/80 text-gray-900 rounded-tl-xs'
                    } ${msg.isOptimistic ? 'opacity-80' : ''}`}
                  >
                    {msg.message}
                  </div>
                </div>

                {isMe && (
                  <AvatarDisplay
                    avatar={currentUser.avatar}
                    seed={currentUser.name}
                    name={currentUser.name}
                    size="sm"
                    className="mt-1 shadow-2xs"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Form Bar */}
      <footer className="p-3 sm:p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
          <input 
            type="text"
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type your message to squad members..." 
            className="flex-1 h-10 px-4 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-2xs"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="h-10 px-4 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-40"
          >
            <Send size={15} className="mr-1.5" /> Send
          </Button>
        </form>
      </footer>
    </div>
  );
}
