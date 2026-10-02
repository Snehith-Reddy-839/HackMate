'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getCached } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { Tooltip } from '@/components/ui/tooltip';
import { HackathonCardSkeleton } from '@/components/skeletons';
import { format } from 'date-fns';
import { 
  ArrowLeft, Calendar, Users, MapPin, PlusCircle, CheckCircle, 
  ShieldCheck, Clock, Globe, ExternalLink, Trophy
} from 'lucide-react';

function formatSafeDate(dateStr?: string, pattern = 'MMM d, yyyy'): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, pattern);
  } catch {
    return dateStr;
  }
}

interface TeamMember {
  id: number;
  student_id: number;
  role?: string;
  student: {
    id: number;
    name: string;
    branch: string;
    year: number;
  };
}

interface TeamDetail {
  id: number;
  name: string;
  description: string;
  max_members: number;
  requirements: string;
  recruitment_status: string;
  leader_id: number;
  leader: {
    id: number;
    name: string;
    branch: string;
  };
  members: TeamMember[];
}

interface HackathonDetail {
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
  teams_count: number;
  participants_count: number;
  teams: TeamDetail[];
}

export default function HackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id;

  const [hackathon, setHackathon] = useState<HackathonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      getCached('/profiles/me', undefined, 20000)
        .then(res => {
          if (String(res.data?.role).toLowerCase() === 'admin') {
            setIsAdmin(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete hackathon "${hackathon?.name}" and all its teams?`)) return;
    try {
      await api.delete(`/hackathons/${hackathon?.id}`);
      alert(`Hackathon "${hackathon?.name}" has been deleted.`);
      router.push('/hackathons');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete hackathon');
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/hackathons/${hackathonId}`);
        setHackathon(res.data);
      } catch (err) {
        console.error(err);
        alert('Hackathon not found');
        router.push('/hackathons');
      } finally {
        setLoading(false);
      }
    };
    if (hackathonId) fetchDetail();
  }, [hackathonId, router]);

  if (loading || !hackathon) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex flex-col">
        <Navbar />
        <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <HackathonCardSkeleton />
        </div>
      </div>
    );
  }

  const isClosed = hackathon.status === 'Completed' || hackathon.status === 'Closed' || hackathon.status === 'Registration Closed';

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* SaaS Navbar */}
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link href="/hackathons">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold text-gray-600 hover:text-black">
              <ArrowLeft size={16} /> Back to Hackathons
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge 
              className={`text-[11px] font-bold ${
                isClosed
                  ? 'bg-slate-700 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {hackathon.status}
            </Badge>
            <Badge variant="outline" className="text-xs">{hackathon.mode}</Badge>
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="text-xs font-semibold h-7 rounded-lg"
              >
                Delete (Admin)
              </Button>
            )}
          </div>
        </div>

        {/* Banner Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200/80 space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                Official Event by {hackathon.organizer}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-950">{hackathon.name}</h1>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {!isClosed ? (
                <Link href={`/teams/create?hackathon=${encodeURIComponent(hackathon.name)}`}>
                  <Button className="flex items-center gap-1.5 font-bold text-xs sm:text-sm h-10 px-5 rounded-xl bg-black text-white hover:bg-gray-800 shadow-xs">
                    <PlusCircle size={16} /> Create a Team
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="secondary" className="flex items-center gap-2 opacity-60 cursor-not-allowed text-xs h-10 rounded-xl">
                  Registration Closed
                </Button>
              )}
              <Link href={`/teams?hackathon=${encodeURIComponent(hackathon.name)}`}>
                <Button variant="outline" className="font-semibold text-xs sm:text-sm h-10 rounded-xl border-gray-300">
                  Browse Teams
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed text-sm sm:text-base border-t border-gray-100 pt-5">
            {hackathon.description}
          </p>

          {/* Real Live Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/70">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users size={13} className="text-primary" /> Registered Teams
              </div>
              <div className="text-2xl font-bold text-gray-900">{hackathon.teams_count}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/70">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle size={13} className="text-green-600" /> Total Students
              </div>
              <div className="text-2xl font-bold text-gray-900">{hackathon.participants_count}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/70">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={13} className="text-amber-600" /> Reg. Deadline
              </div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                {formatSafeDate(hackathon.registration_deadline)}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/70">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-blue-600" /> Event Date
              </div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                {formatSafeDate(hackathon.event_date)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-gray-400 shrink-0" /> 
              <span><strong>Location:</strong> {hackathon.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-gray-400 shrink-0" /> 
              <span><strong>Team Rules:</strong> {hackathon.team_size_min} to {hackathon.team_size_max} members per squad</span>
            </div>
            {hackathon.official_url && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Globe size={15} className="text-primary shrink-0" /> 
                <span>
                  <strong>Official Website:</strong>{' '}
                  <a href={hackathon.official_url} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                    {hackathon.official_url} <ExternalLink size={12} />
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Registered Teams List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950">
                Squads in this Hackathon ({hackathon.teams.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">Formed squads or open teams currently recruiting for this event.</p>
            </div>
            {!isClosed && (
              <Link href={`/teams/create?hackathon=${encodeURIComponent(hackathon.name)}`}>
                <Button size="sm" variant="outline" className="font-semibold text-xs h-9 rounded-xl">
                  Register New Squad
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hackathon.teams.map((team) => (
              <Card key={team.id} className="flex flex-col justify-between hover:shadow-md transition-all border border-gray-200/80 rounded-2xl bg-white shadow-xs">
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                      variant={team.recruitment_status === 'Open' ? 'default' : 'secondary'}
                      className={`text-[10px] font-bold ${
                        team.recruitment_status === 'Open'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {team.recruitment_status === 'Open' ? 'Recruiting' : 'Full / Closed'}
                    </Badge>
                    <span className="text-xs text-gray-400 font-medium">
                      Max {team.max_members} Members
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-950">{team.name}</CardTitle>
                  <div className="text-xs text-gray-500">
                    Leader: <strong className="text-gray-700">{team.leader?.name || 'Student'}</strong> ({team.leader?.branch})
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3 flex-1">
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{team.description}</p>
                  
                  {team.requirements && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-600">
                      <span className="font-semibold text-gray-800 block mb-0.5">Requirements:</span>
                      <span className="line-clamp-2">{team.requirements}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">
                      Current Squad ({team.members?.length || 1}/{team.max_members})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {team.members?.map((m) => (
                        <Badge key={m.id} variant="outline" className="text-xs bg-white text-gray-700 py-0.5 px-2">
                          {m.student.name} {m.role ? `(${m.role})` : ''}
                        </Badge>
                      ))}
                      {(!team.members || team.members.length === 0) && (
                        <Badge variant="outline" className="text-xs bg-white text-gray-700 py-0.5 px-2">
                          {team.leader?.name} (Leader)
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-3 border-t border-gray-100 bg-gray-50/40">
                  <Link href={`/teams/${team.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl h-9">
                      View Squad Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}

            {hackathon.teams.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
                <Users size={36} className="mx-auto text-gray-400 mb-2" />
                <h4 className="text-base font-bold text-gray-800">No squads registered yet</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Be the first to create a squad for {hackathon.name} and start recruiting your classmates!
                </p>
                <Link href={`/teams/create?hackathon=${encodeURIComponent(hackathon.name)}`} className="inline-block pt-1">
                  <Button size="sm" className="font-bold text-xs h-9 rounded-xl">Create the First Squad</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
