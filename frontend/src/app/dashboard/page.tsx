'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import AvatarPicker from '@/components/AvatarPicker';
import NotificationDropdown from '@/components/NotificationDropdown';
import { LogOut, Home, Users, PlusCircle, ShieldCheck, Sparkles, Trophy, ArrowRight } from 'lucide-react';

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
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [meRes, teamsRes, hackathonsRes, allTeamsRes, pendingRes] = await Promise.all([
        api.get('/profiles/me'),
        api.get('/teams/me/list'),
        api.get('/hackathons'),
        api.get('/teams/'),
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!user) return <div className="flex h-screen items-center justify-center text-gray-500">Loading Dashboard...</div>;

  const isAdmin = user.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-2xl text-primary">HackMate</Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <Link href="/hackathons" className="text-gray-600 hover:text-primary font-medium flex items-center gap-1.5"><Home size={16}/> Hackathons</Link>
            <Link href="/teams" className="text-gray-600 hover:text-primary font-medium flex items-center gap-1.5"><Users size={16}/> Teams</Link>
          </nav>
          <NotificationDropdown />
          <div className="flex items-center gap-2 pl-2 border-l">
            <AvatarDisplay
              avatar={user.avatar || user.profile?.avatar}
              seed={user.email || user.name}
              name={user.name}
              size="sm"
            />
            <span className="text-sm font-semibold text-gray-800 hidden sm:inline">{user.name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout"><LogOut size={18} /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar / Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="text-center pb-3">
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <AvatarDisplay
                  avatar={user.avatar || user.profile?.avatar}
                  seed={user.email || user.name}
                  name={user.name}
                  size="xl"
                  className="shadow-sm"
                />
                <AvatarPicker
                  currentAvatar={user.avatar || user.profile?.avatar}
                  onSelect={handleAvatarChange}
                />
              </div>

              <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
              <div className="text-xs font-semibold text-gray-500">
                {user.branch || 'CSE'} • Year {user.year || 2} • Sec {user.section || 'A'}
              </div>
              {user.email && (
                <div className="text-[11px] text-gray-400 mt-0.5">{user.email}</div>
              )}
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="space-y-2 text-xs border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Roll Number:</span>
                  <span className="font-semibold text-gray-800">{user.roll_number || 'N/A'}</span>
                </div>
                {user.profile?.skills && (
                  <div className="pt-2">
                    <span className="text-gray-400 block mb-1 font-semibold text-[10px] uppercase tracking-wider">Top Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {user.profile.skills.split(',').slice(0, 4).map((s: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] py-0.5">
                          {s.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/complete-profile" className="block w-full pt-2">
                <Button className="w-full font-semibold" variant="outline">
                  Edit Full Profile & Skills
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-amber-200 bg-amber-50/60 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-950 font-bold">
                  <ShieldCheck size={18} className="text-amber-600" /> Administrator Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-amber-900 leading-relaxed">
                  You have full platform administrator privileges to oversee students, teams, and hackathons.
                </p>
                <div className="space-y-2">
                  <Link href="/admin" className="block w-full">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5">
                      <ShieldCheck size={14} /> Open Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/hackathons" className="block w-full">
                    <Button variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs">
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Welcome back, {user.name.split(' ')[0]} 👋
              </h2>
              <p className="text-sm text-gray-500">Track your hackathons, team memberships, and applications.</p>
            </div>
            <Link href="/teams/create">
              <Button className="flex items-center gap-2 font-semibold">
                <PlusCircle size={16} /> Create Team
              </Button>
            </Link>
          </div>
          
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border shadow-xs bg-white">
              <CardContent className="p-5">
                <div className="text-3xl font-extrabold text-primary">{hackathonsCount}</div>
                <div className="text-xs text-gray-500 font-semibold mt-1">Active Hackathons</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-xs bg-white">
              <CardContent className="p-5">
                <div className="text-3xl font-extrabold text-primary">{myTeams.length}</div>
                <div className="text-xs text-gray-500 font-semibold mt-1">My Active Teams</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-xs bg-white">
              <CardContent className="p-5">
                <div className="text-3xl font-extrabold text-primary">{pendingCount}</div>
                <div className="text-xs text-gray-500 font-semibold mt-1">Pending Requests</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-xs bg-white">
              <CardContent className="p-5">
                <div className="text-3xl font-extrabold text-primary">{openTeamsCount}</div>
                <div className="text-xs text-gray-500 font-semibold mt-1">Teams Recruiting</div>
              </CardContent>
            </Card>
          </div>

          {/* My Teams List */}
          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b p-6 py-4">
              <CardTitle className="text-lg font-bold">My Teams ({myTeams.length})</CardTitle>
              <Link href="/teams">
                <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold gap-1">
                  Discover Teams <ArrowRight size={13} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              {myTeams.length === 0 ? (
                <div className="text-center py-10 text-gray-500 space-y-3">
                  <p className="text-sm">You are not part of any teams yet.</p>
                  <div className="flex justify-center gap-3">
                    <Link href="/teams/create">
                      <Button size="sm">Create a Team</Button>
                    </Link>
                    <Link href="/teams">
                      <Button size="sm" variant="outline">Browse Teams</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTeams.map(t => {
                    const isLeader = user.id === t.leader_id;
                    return (
                      <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-gray-50/70 transition-colors gap-3">
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {t.name}
                            {isLeader && (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">Leader</Badge>
                            )}
                            <Badge variant={t.recruitment_status === 'Open' ? 'default' : 'secondary'} className="text-[10px]">
                              {t.recruitment_status}
                            </Badge>
                          </div>
                          <div className="text-xs text-primary font-medium mt-0.5 flex items-center gap-1">
                            <Trophy size={12} /> {t.hackathon_name}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Link href={`/teams/${t.id}/chat`}>
                            <Button variant="outline" size="sm" className="font-semibold text-xs h-8">
                              Chat
                            </Button>
                          </Link>
                          {isLeader && (
                            <Link href={`/teams/${t.id}/manage`}>
                              <Button size="sm" className="font-semibold text-xs h-8">
                                Manage Roster
                              </Button>
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
