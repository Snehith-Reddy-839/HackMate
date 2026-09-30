'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamChatPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id;

  const [team, setTeam] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/teams/${teamId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, meRes] = await Promise.all([
          api.get(`/teams/${teamId}`),
          api.get('/auth/me')
        ]);
        setTeam(tRes.data);
        setCurrentUser(meRes.data);
        await fetchMessages();
      } catch (err) {
        console.error(err);
        alert('Not authorized or error fetching team details');
        router.push('/dashboard');
      }
    };
    if (teamId) fetchData();
  }, [teamId, router]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for new messages every 5 seconds
  useEffect(() => {
    if (!teamId) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [teamId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/teams/${teamId}/messages`, { message: newMessage });
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error(err);
      alert('Error sending message');
    }
  };

  if (!team || !currentUser) return <div className="flex h-screen items-center justify-center">Loading chat...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-h-screen">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="font-bold text-xl">{team.name} - Chat</h1>
            <p className="text-xs text-gray-500 text-muted-foreground">{team.hackathon_name}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-600">{msg.user.name}</span>
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(msg.created_at + 'Z'), 'h:mm a')}
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
          <Input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..." 
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send size={18} />
          </Button>
        </form>
      </footer>
    </div>
  );
}
