'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { api, getCached } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import AvatarPicker from '@/components/AvatarPicker';
import Navbar from '@/components/Navbar';
import { Tooltip } from '@/components/ui/tooltip';
import { DashboardSkeleton } from '@/components/skeletons';
import { 
  Users, PlusCircle, ShieldCheck, Trophy, ArrowRight, 
  MessageSquare, ExternalLink, Calendar, CheckCircle2, Clock
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  branch: string;
  year: number;
  roll_number: string;
  section: string;
  role?: string;
  avatar?: string;
  profile?: any;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [hackathonsCount, setHackathonsCount] = useState<number>(0);
  const [openTeamsCount, setOpenTeamsCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  const fetchData = async () => {
    try {
      const [meRes, teamsRes, hackathonsRes, allTeamsRes, pendingRes] = await Promise.all([
        getCached('/profiles/me', undefined, 20000),
        api.get('/teams/me/list'),
        getCached('/hackathons', undefined, 30000),
        getCached('/teams/', undefined, 20000),
        api.get('/requests/my-pending').catch(() => ({ data: { total_pending: 0 } }))
      ]);
      
      setUser(meRes.data);
      setMyTeams(teamsRes.data);
      setHackathonsCount(hackathonsRes.data.length);
      const openTeams = (allTeamsRes.data || []).filter((t: any) => t.recruitment_status === 'Open');
      setOpenTeamsCount(openTeams.length);
      setPendingCount(pendingRes.data?.total_pending || 0);
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
    }
    fetchData();
  }, [router]);

  const handleAvatarChange = async (newAvatar: string) => {
    try {
      await api.put('/profiles/me/user', { avatar: newAvatar });
      setUser(prev => prev ? { ...prev, avatar: newAvatar } : null);
    } catch (err) {
      alert('Failed to update avatar');
    }
  };

  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  const isAdmin = user.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* SaaS Unified Navbar */}
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Sidebar / Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden bg-white">
            <CardHeader className="text-center pb-3">
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <AvatarDisplay
                  avatar={user.avatar || user.profile?.avatar}
                  seed={user.email || user.name}
                  name={user.name}
                  size="xl"
                  className="shadow-sm border-2 border-white ring-1 ring-gray-100"
                />
                <AvatarPicker
                  currentAvatar={user.avatar || user.profile?.avatar}
                  onSelect={handleAvatarChange}
                />
              </div>

              <CardTitle className="text-2xl font-bold tracking-tight text-gray-950">{user.name}</CardTitle>
              <div className="text-xs font-semibold text-gray-500">
                {user.branch || 'CSE'} • Year {user.year || 2} • Sec {user.section || 'A'}
              </div>
              {user.email && (
                <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{user.email}</div>
              )}
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400 font-medium">Roll Number:</span>
                  <span className="font-semibold text-gray-800 font-mono">{user.roll_number || 'N/A'}</span>
                </div>
                {user.profile?.skills && (
                  <div className="pt-2">
                    <span className="text-gray-400 block mb-1.5 font-semibold text-[10px] uppercase tracking-wider">Top Technical Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.profile.skills.split(',').slice(0, 5).map((s: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[11px] py-0.5 px-2 bg-slate-100 text-slate-800">
                          {s.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/complete-profile" className="block w-full pt-2">
                <Button className="w-full font-semibold text-xs h-9 rounded-xl" variant="outline">
                  Edit Full Profile & Skills
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-amber-200 bg-amber-50/70 rounded-2xl shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-950 font-bold">
                  <ShieldCheck size={18} className="text-amber-600" /> Administrator Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-amber-900 leading-relaxed">
                  Full admin privileges enabled: manage students, review formed squads, and delete or create hackathons.
                </p>
                <div className="space-y-2">
                  <Link href="/admin" className="block w-full">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5">
                      <ShieldCheck size={14} /> Open Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/hackathons" className="block w-full">
                    <Button variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs h-9 rounded-xl">
                      <PlusCircle size={14} className="mr-1.5" /> Post Hackathon
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950">
                Welcome back, {user.name.split(' ')[0]} 👋
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track your squads, event deadlines, and incoming applications.</p>
            </div>
            <Link href="/teams/create" className="shrink-0">
              <Button className="flex items-center gap-2 font-bold text-xs sm:text-sm h-10 px-4 rounded-xl shadow-xs bg-black text-white hover:bg-gray-800">
                <PlusCircle size={16} /> Create Team
              </Button>
            </Link>
          </div>
          
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white hover:border-gray-300 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{hackathonsCount}</div>
                <div className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-1">Active Hackathons</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white hover:border-gray-300 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{myTeams.length}</div>
                <div className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-1">My Squads</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white hover:border-gray-300 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{pendingCount}</div>
                <div className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-1">Pending Requests</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white hover:border-gray-300 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{openTeamsCount}</div>
                <div className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-1">Teams Recruiting</div>
              </CardContent>
            </Card>
          </div>

          {/* My Teams List */}
          <Card className="rounded-2xl border border-gray-200/80 shadow-xs bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-5 sm:p-6 py-4">
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                My Squads ({myTeams.length})
              </CardTitle>
              <Link href="/teams">
                <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-black font-semibold gap-1">
                  Discover Teams <ArrowRight size={13} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {myTeams.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Users size={22} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800">You haven&apos;t joined any squad yet</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Create your own squad as team leader, or find a recruiting team that matches your technical stack.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Link href="/teams/create">
                      <Button size="sm" className="text-xs font-semibold rounded-xl">Create a Team</Button>
                    </Link>
                    <Link href="/teams">
                      <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl">Browse Teams</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTeams.map((t) => {
                    const isLeader = user.id === t.leader_id;
                    return (
                      <div
                        key={t.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border border-gray-100 rounded-2xl hover:bg-slate-50/70 hover:border-gray-200 transition-all gap-3.5 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-base text-gray-950 flex items-center gap-2">
                            <span>{t.name}</span>
                            {isLeader && (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold py-0.5 px-2">
                                Leader
                              </Badge>
                            )}
                            <Badge
                              variant={t.recruitment_status === 'Open' ? 'default' : 'secondary'}
                              className={`text-[10px] font-semibold ${
                                t.recruitment_status === 'Open'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.recruitment_status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                            <Trophy size={13} className="text-primary" /> {t.hackathon_name}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Link href={`/teams/${t.id}`}>
                            <Tooltip content="View squad roster and details">
                              <Button variant="ghost" size="sm" className="font-semibold text-xs h-8 rounded-lg">
                                Squad Details
                              </Button>
                            </Tooltip>
                          </Link>
                          <Link href={`/teams/${t.id}/chat`}>
                            <Tooltip content="Open team real-time chat">
                              <Button variant="outline" size="sm" className="font-semibold text-xs h-8 rounded-lg gap-1">
                                <MessageSquare size={13} /> Chat
                              </Button>
                            </Tooltip>
                          </Link>
                          {isLeader && (
                            <Link href={`/teams/${t.id}/manage`}>
                              <Tooltip content="Manage roster & incoming applications">
                                <Button size="sm" className="font-semibold text-xs h-8 rounded-lg bg-black text-white hover:bg-gray-800">
                                  Manage Roster
                                </Button>
                              </Tooltip>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
