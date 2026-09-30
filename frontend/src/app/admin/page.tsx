'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AvatarDisplay from '@/components/AvatarDisplay';
import {
  ShieldAlert, ShieldCheck, Users, Trophy, UsersRound, FileText,
  Trash2, PlusCircle, Search, Filter, ExternalLink, Calendar,
  MapPin, Clock, ArrowRight, Code2, Globe, Sparkles, RefreshCw, Mail, CheckCircle2
} from 'lucide-react';

interface AdminOverview {
  total_students: number;
  total_hackathons: number;
  active_hackathons: number;
  total_teams: number;
  open_teams: number;
  total_requests: number;
  pending_requests: number;
}

interface StudentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  roll_number?: string;
  branch?: string;
  year?: number;
  section?: string;
  created_at: string;
  profile?: {
    avatar?: string;
    bio?: string;
    skills?: string;
    technologies?: string;
    languages?: string;
    frameworks?: string;
    tools?: string;
    skills_proficiency?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    leetcode_link?: string;
    experience?: string;
    hackathon_experience?: number;
    hackathons_history?: string;
    projects?: string;
    projects_list?: string;
    availability?: string;
    preferred_roles?: string;
    working_style?: string;
    communication_pref?: string;
    phone?: string;
    show_phone?: boolean;
  };
}

interface TeamAdmin {
  id: number;
  name: string;
  hackathon_name: string;
  description: string;
  max_members: number;
  current_members: number;
  recruitment_status: string;
  created_at?: string;
  leader: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    roll_number?: string;
  };
  members: Array<{
    id: number;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
  }>;
}

interface Hackathon {
  id: number;
  name: string;
  organizer: string;
  description: string;
  registration_deadline: string;
  event_date: string;
  location: string;
  mode: string;
  team_size_min: number;
  team_size_max: number;
  status: string;
  official_url?: string;
  teams_count?: number;
  participants_count?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'hackathons' | 'students' | 'teams'>('overview');

  // Data states
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [teams, setTeams] = useState<TeamAdmin[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search & Filter states
  const [hackathonSearch, setHackathonSearch] = useState('');
  const [hackathonStatusFilter, setHackathonStatusFilter] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranchFilter, setStudentBranchFilter] = useState('ALL');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState('ALL');

  // CSV Exporters
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentsCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Roll Number', 'Branch', 'Year', 'Section', 'Skills', 'Joined Date'];
    const rows = students.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.roll_number || ''}"`,
      `"${s.branch || ''}"`,
      s.year || '',
      `"${s.section || ''}"`,
      `"${(s.profile?.skills || '').replace(/"/g, '""')}"`,
      s.created_at || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`HackMate_Students_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`, csvContent);
  };

  const exportTeamsCSV = () => {
    const headers = ['Team ID', 'Team Name', 'Hackathon', 'Status', 'Leader Name', 'Leader Email', 'Leader Roll', 'Members Count', 'Max Members', 'Members Roster'];
    const rows = teams.map(t => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.hackathon_name.replace(/"/g, '""')}"`,
      t.recruitment_status,
      `"${t.leader.name.replace(/"/g, '""')}"`,
      `"${t.leader.email}"`,
      `"${t.leader.roll_number || ''}"`,
      t.current_members,
      t.max_members,
      `"${t.members.map(m => `${m.name} (${m.role || 'Member'})`).join('; ')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`HackMate_Teams_Roster_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`, csvContent);
  };

  const exportHackathonsCSV = () => {
    const headers = ['ID', 'Name', 'Organizer', 'Status', 'Mode', 'Reg Deadline', 'Event Date', 'Location', 'Teams Count', 'Participants Count'];
    const rows = hackathons.map(h => [
      h.id,
      `"${h.name.replace(/"/g, '""')}"`,
      `"${h.organizer.replace(/"/g, '""')}"`,
      h.status,
      h.mode,
      h.registration_deadline,
      h.event_date,
      `"${h.location.replace(/"/g, '""')}"`,
      h.teams_count || 0,
      h.participants_count || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`HackMate_Hackathons_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`, csvContent);
  };

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [showCreateHackathon, setShowCreateHackathon] = useState(false);
  const [submittingHackathon, setSubmittingHackathon] = useState(false);
  const [hackathonForm, setHackathonForm] = useState({
    name: '',
    organizer: '',
    description: '',
    registration_deadline: '',
    event_date: '',
    location: '',
    mode: 'Offline',
    team_size_min: 2,
    team_size_max: 4,
    status: 'Registration Open',
    official_url: '',
  });

  // Verify Admin Access
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await api.get('/profiles/me');
        setCurrentUser(res.data);
        if (String(res.data.role).toLowerCase() !== 'admin') {
          setAuthLoading(false);
          return;
        }
        fetchAllData();
      } catch (err) {
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    };
    verifyAdmin();
  }, [router]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [overviewRes, hackathonsRes, studentsRes, teamsRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/hackathons'),
        api.get('/admin/students'),
        api.get('/admin/teams'),
      ]);
      setOverview(overviewRes.data);
      setHackathons(hackathonsRes.data);
      setStudents(studentsRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHackathon(true);
    try {
      await api.post('/hackathons/', {
        ...hackathonForm,
        registration_deadline: new Date(hackathonForm.registration_deadline).toISOString(),
        event_date: new Date(hackathonForm.event_date).toISOString(),
      });
      setShowCreateHackathon(false);
      setHackathonForm({
        name: '',
        organizer: '',
        description: '',
        registration_deadline: '',
        event_date: '',
        location: '',
        mode: 'Offline',
        team_size_min: 2,
        team_size_max: 4,
        status: 'Registration Open',
        official_url: '',
      });
      fetchAllData();
      alert('Hackathon created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create hackathon');
    } finally {
      setSubmittingHackathon(false);
    }
  };

  const handleDeleteHackathon = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete hackathon "${name}"?`)) return;
    try {
      await api.delete(`/admin/hackathons/${id}`);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete hackathon');
    }
  };

  const handleDeleteTeam = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to disband and delete team "${name}"?`)) return;
    try {
      await api.delete(`/admin/teams/${id}`);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete team');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Verifying administrator privileges...
      </div>
    );
  }

  if (!currentUser || String(currentUser.role).toLowerCase() !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full text-center p-8 rounded-2xl shadow-lg border border-red-100 bg-white">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm mb-4">
            The Admin Dashboard is restricted exclusively to authorized HackMate platform administrators.
          </p>
          {currentUser && (
            <div className="bg-gray-50 border p-3 rounded-xl mb-6 text-xs text-gray-600 text-left space-y-1">
              <div><strong>Logged In As:</strong> {currentUser.name} ({currentUser.email})</div>
              <div><strong>Current Role:</strong> <span className="capitalize font-semibold text-amber-700">{currentUser.role || 'student'}</span></div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/login');
              }}
            >
              Log in with Admin Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Filtered lists
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.profile?.skills && s.profile.skills.toLowerCase().includes(studentSearch.toLowerCase()));
    
    const matchesBranch = studentBranchFilter === 'ALL' || (s.branch && s.branch.toUpperCase() === studentBranchFilter);
    return matchesSearch && matchesBranch;
  });

  const filteredTeams = teams.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.hackathon_name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.leader.name.toLowerCase().includes(teamSearch.toLowerCase());
    
    const matchesStatus = teamStatusFilter === 'ALL' || t.recruitment_status.toUpperCase() === teamStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(hackathonSearch.toLowerCase()) ||
      h.organizer.toLowerCase().includes(hackathonSearch.toLowerCase()) ||
      h.location.toLowerCase().includes(hackathonSearch.toLowerCase());
    
    const matchesStatus = 
      hackathonStatusFilter === 'ALL' ||
      (hackathonStatusFilter === 'OPEN' && h.status === 'Registration Open') ||
      (hackathonStatusFilter === 'CLOSED' && h.status === 'Registration Closed') ||
      (hackathonStatusFilter === 'COMPLETED' && h.status === 'Completed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Navbar */}
      <header className="px-6 py-4 bg-slate-900 text-white shadow-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
            HackMate <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase">Admin</Badge>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAllData}
            disabled={loadingData}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} /> Refresh Data
          </Button>

          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 text-xs">
              Student Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <AvatarDisplay
              avatar={currentUser.avatar}
              seed={currentUser.email}
              size="sm"
            />
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">{currentUser.name}</span>
          </div>
        </div>
      </header>

      {/* Admin Navigation Bar */}
      <div className="bg-white border-b sticky top-[65px] z-40 px-6 py-2 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck size={16} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('hackathons')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'hackathons'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Trophy size={16} /> Hackathons Manager ({hackathons.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users size={16} /> Student Directory ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'teams'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <UsersRound size={16} /> Teams Oversight ({teams.length})
          </button>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Platform Overview</h1>
                <p className="text-sm text-gray-500 mt-0.5">Real-time statistics and administrative management for HackMate.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={exportHackathonsCSV} className="text-xs font-semibold">
                  📥 Export Events CSV
                </Button>
                <Button variant="outline" onClick={exportStudentsCSV} className="text-xs font-semibold">
                  📥 Export Students CSV
                </Button>
                <Button onClick={() => setShowCreateHackathon(true)} className="flex items-center gap-2 text-sm font-semibold">
                  <PlusCircle size={16} /> Post New Hackathon
                </Button>
              </div>
            </div>

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Students</p>
                      <h2 className="text-4xl font-extrabold text-gray-900 mt-2">{overview?.total_students ?? 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Users size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex items-center justify-between">
                    <span>Vasavi College of Engineering</span>
                    <button onClick={() => setActiveTab('students')} className="text-primary font-semibold hover:underline">
                      View Directory &rarr;
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Hackathons</p>
                      <h2 className="text-4xl font-extrabold text-emerald-600 mt-2">{overview?.active_hackathons ?? 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <Trophy size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex items-center justify-between">
                    <span>Total Events: {overview?.total_hackathons ?? 0}</span>
                    <button onClick={() => setActiveTab('hackathons')} className="text-primary font-semibold hover:underline">
                      Manage Events &rarr;
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Teams</p>
                      <h2 className="text-4xl font-extrabold text-indigo-600 mt-2">{overview?.total_teams ?? 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <UsersRound size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex items-center justify-between">
                    <span>Recruiting Teams: {overview?.open_teams ?? 0}</span>
                    <button onClick={() => setActiveTab('teams')} className="text-primary font-semibold hover:underline">
                      View Rosters &rarr;
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Join Requests</p>
                      <h2 className="text-4xl font-extrabold text-amber-600 mt-2">{overview?.total_requests ?? 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                    <span>Pending leader decisions: <strong>{overview?.pending_requests ?? 0}</strong></span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recruiting Teams</p>
                      <h2 className="text-4xl font-extrabold text-purple-600 mt-2">{overview?.open_teams ?? 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                      <Sparkles size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                    <span>Open for student applications</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xs">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-lg text-white">Administrator Quick Actions</h3>
                    <p className="text-xs text-slate-300 mt-1">Export full rosters or publish new campus events.</p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                    <Button onClick={() => setShowCreateHackathon(true)} size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex-1">
                      Add Hackathon
                    </Button>
                    <button onClick={exportTeamsCSV} className="px-3 py-1.5 text-xs text-slate-200 hover:text-white bg-slate-800 rounded-md font-semibold">
                      Export Teams CSV
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ================= HACKATHONS TAB ================= */}
        {activeTab === 'hackathons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Hackathons Manager</h1>
                <p className="text-sm text-gray-500">Create, monitor, and manage active, upcoming, and past hackathons.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={exportHackathonsCSV} className="text-xs font-semibold">
                  📥 Export CSV
                </Button>
                <Button onClick={() => setShowCreateHackathon(true)} className="flex items-center gap-2 font-semibold">
                  <PlusCircle size={16} /> Create Hackathon
                </Button>
              </div>
            </div>

            {/* Hackathon Filters */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border shadow-xs">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  value={hackathonSearch}
                  onChange={(e) => setHackathonSearch(e.target.value)}
                  placeholder="Search hackathons by name, organizer, or location..."
                  className="pl-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={hackathonStatusFilter}
                  onChange={(e) => setHackathonStatusFilter(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md text-sm bg-background"
                >
                  <option value="ALL">All Statuses ({hackathons.length})</option>
                  <option value="OPEN">Registration Open</option>
                  <option value="CLOSED">Registration Closed</option>
                  <option value="COMPLETED">Completed / Past Events</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHackathons.map((h) => {
                const isCompleted = h.status === 'Completed';
                const isClosed = h.status === 'Registration Closed';
                return (
                  <Card key={h.id} className="rounded-2xl border bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <Badge 
                          className={
                            h.status === 'Registration Open'
                              ? 'bg-emerald-600 text-white'
                              : isCompleted
                              ? 'bg-slate-700 text-white'
                              : 'bg-amber-500 text-white'
                          }
                        >
                          {h.status}
                        </Badge>
                        <Badge variant="outline">{h.mode}</Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">{h.name}</CardTitle>
                      <p className="text-xs text-gray-500">Organizer: <strong className="text-gray-700">{h.organizer}</strong></p>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1">
                      <p className="text-xs text-gray-600 line-clamp-2">{h.description}</p>
                      <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className={isClosed || isCompleted ? "text-amber-600" : "text-primary"} />
                          <span>Deadline: <strong>{format(new Date(h.registration_deadline), 'MMM d, yyyy')}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-500" />
                          <span>Event Date: <strong>{format(new Date(h.event_date), 'MMM d, yyyy')}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-gray-500" />
                          <span>{h.location}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center text-xs">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold">
                          {h.teams_count || 0} Teams
                        </Badge>
                        <Badge variant="outline" className="text-gray-600">
                          {h.participants_count || 0} Participants
                        </Badge>
                      </div>
                    </CardContent>
                    <div className="p-4 border-t flex justify-between items-center bg-gray-50/50 rounded-b-2xl">
                      <Link href={`/hackathons/${h.id}`}>
                        <Button variant="outline" size="sm" className="text-xs font-semibold">
                          View Page
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteHackathon(h.id, h.name)}
                        className="text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {filteredHackathons.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-dashed">
                  No hackathons found matching current search criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STUDENTS TAB ================= */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Student Directory</h1>
                <p className="text-sm text-gray-500">Browse all registered students, skillsets, and profiles.</p>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border shadow-xs">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students by name, roll number, email, or skill..."
                  className="pl-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={studentBranchFilter}
                  onChange={(e) => setStudentBranchFilter(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md text-sm bg-background"
                >
                  <option value="ALL">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>
            </div>

            {/* Students Table / Grid */}
            <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase border-b">
                    <tr>
                      <th className="p-4 pl-6">Student</th>
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Branch & Year</th>
                      <th className="p-4">Skills</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <AvatarDisplay
                              avatar={s.avatar || s.profile?.avatar}
                              seed={s.email || s.name}
                              size="sm"
                            />
                            <div>
                              <div className="font-bold text-gray-900">{s.name}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail size={11} /> {s.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs font-semibold text-gray-700">
                          {s.roll_number || '—'}
                        </td>
                        <td className="p-4 text-xs font-medium text-gray-600">
                          {s.branch || 'CSE'} • Year {s.year || 1} {s.section ? `• Sec ${s.section}` : ''}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {s.profile?.skills ? (
                              s.profile.skills.split(',').slice(0, 3).map((sk, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {sk.trim()}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No skills listed</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {s.created_at ? format(new Date(s.created_at), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(s)}
                            className="text-xs font-semibold"
                          >
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                          No students found matching current search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TEAMS TAB ================= */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Teams Oversight</h1>
                <p className="text-sm text-gray-500">Audit all formed teams, roster members, and recruitment statuses.</p>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border shadow-xs">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Search by team name, hackathon name, or leader..."
                  className="pl-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={teamStatusFilter}
                  onChange={(e) => setTeamStatusFilter(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md text-sm bg-background"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Recruiting (Open)</option>
                  <option value="CLOSED">Full / Closed</option>
                </select>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTeams.map((team) => (
                <Card key={team.id} className="rounded-2xl border bg-white shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                        <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                          <Trophy size={13} /> {team.hackathon_name}
                        </p>
                      </div>
                      <Badge variant={team.recruitment_status === 'Open' ? 'default' : 'secondary'} className="text-[10px]">
                        {team.recruitment_status}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mt-2">{team.description}</p>

                    {/* Leader info */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <AvatarDisplay
                          avatar={team.leader.avatar}
                          seed={team.leader.email || team.leader.name}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-gray-900">{team.leader.name} <Badge className="bg-amber-100 text-amber-900 text-[9px] ml-1 font-bold">Leader</Badge></div>
                          <div className="text-[11px] text-gray-400">{team.leader.email}</div>
                        </div>
                      </div>
                      <span className="font-mono text-gray-500">{team.leader.roll_number || ''}</span>
                    </div>

                    {/* Member Rosters */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
                        <span>Roster ({team.current_members}/{team.max_members} spots)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-800">
                            <AvatarDisplay avatar={m.avatar} seed={m.email || m.name} size="sm" className="w-4 h-4" />
                            <span>{m.name}</span>
                            {m.role && <span className="text-[10px] text-slate-500">({m.role})</span>}
                          </div>
                        ))}
                        {team.members.length === 0 && (
                          <span className="text-xs text-gray-400 italic">No additional team members yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-between items-center">
                    <Link href={`/teams`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        View Team
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Disband Team
                    </Button>
                  </div>
                </Card>
              ))}
              {filteredTeams.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-dashed">
                  No teams found matching current criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ================= CREATE HACKATHON DIALOG ================= */}
      <Dialog open={showCreateHackathon} onOpenChange={setShowCreateHackathon}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShieldCheck className="text-primary" /> Post New Hackathon
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateHackathon} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hackathon Name *</label>
              <Input
                required
                value={hackathonForm.name}
                onChange={(e) => setHackathonForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Smart India Hackathon 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer *</label>
                <Input
                  required
                  value={hackathonForm.organizer}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, organizer: e.target.value }))}
                  placeholder="e.g. VCE CSE Dept"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode *</label>
                <select
                  value={hackathonForm.mode}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-background"
                >
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                rows={3}
                value={hackathonForm.description}
                onChange={(e) => setHackathonForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
                placeholder="Provide problem statement, guidelines, or event overview..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline *</label>
                <Input
                  type="date"
                  required
                  value={hackathonForm.registration_deadline}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, registration_deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                <Input
                  type="date"
                  required
                  value={hackathonForm.event_date}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, event_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <Input
                  required
                  value={hackathonForm.location}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. VCE Campus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Team Size</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={hackathonForm.team_size_min}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, team_size_min: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={hackathonForm.team_size_max}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, team_size_max: parseInt(e.target.value) || 4 }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official / External URL (Optional)</label>
              <Input
                value={hackathonForm.official_url}
                onChange={(e) => setHackathonForm(prev => ({ ...prev, official_url: e.target.value }))}
                placeholder="https://hackathon.example.com"
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={submittingHackathon}>
              {submittingHackathon ? 'Publishing...' : 'Publish Hackathon'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= STUDENT PROFILE INSPECTOR MODAL ================= */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <AvatarDisplay
                  avatar={selectedStudent.avatar || selectedStudent.profile?.avatar}
                  seed={selectedStudent.email || selectedStudent.name}
                  size="lg"
                />
                <div>
                  <DialogTitle className="text-2xl font-bold">{selectedStudent.name}</DialogTitle>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {selectedStudent.branch || 'CSE'} • Year {selectedStudent.year || 1} • Roll: {selectedStudent.roll_number || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4 text-xs">
              {selectedStudent.profile?.bio && (
                <div className="p-3 bg-gray-50 rounded-xl border text-gray-700">
                  <span className="font-bold text-gray-900 block mb-1">Bio</span>
                  {selectedStudent.profile.bio}
                </div>
              )}

              {selectedStudent.profile?.skills && (
                <div>
                  <span className="font-bold text-gray-900 block mb-2">Skills & Proficiencies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.profile.skills.split(',').map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs py-1 px-2">
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                {selectedStudent.profile?.languages && (
                  <div className="p-3 bg-gray-50 rounded-xl border">
                    <span className="font-bold text-gray-500 block mb-1">Languages</span>
                    <span className="text-gray-800">{selectedStudent.profile.languages}</span>
                  </div>
                )}
                {selectedStudent.profile?.frameworks && (
                  <div className="p-3 bg-gray-50 rounded-xl border">
                    <span className="font-bold text-gray-500 block mb-1">Frameworks</span>
                    <span className="text-gray-800">{selectedStudent.profile.frameworks}</span>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedStudent.profile?.github && (
                  <a href={selectedStudent.profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-800 font-medium">
                    <Code2 size={13} /> GitHub <ExternalLink size={11} />
                  </a>
                )}
                {selectedStudent.profile?.linkedin && (
                  <a href={selectedStudent.profile.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-blue-700 font-medium">
                    <Globe size={13} /> LinkedIn <ExternalLink size={11} />
                  </a>
                )}
                {selectedStudent.profile?.portfolio && (
                  <a href={selectedStudent.profile.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 font-medium">
                    <Globe size={13} /> Portfolio <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
