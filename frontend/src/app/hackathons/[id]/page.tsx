'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Users, MapPin, PlusCircle, CheckCircle, ShieldCheck, Clock, Globe, ExternalLink } from 'lucide-react';

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
      api.get('/profiles/me').then(res => {
        if (String(res.data?.role).toLowerCase() === 'admin') {
          setIsAdmin(true);
        }
      }).catch(() => {});
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Hackathon details...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/hackathons">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="font-bold text-xl">{hackathon.name}</h1>
            <p className="text-xs text-gray-500">Organized by {hackathon.organizer}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            className={
              hackathon.status === 'Registration Open'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }
          >
            {hackathon.status}
          </Badge>
          <Badge variant="outline">{hackathon.mode}</Badge>
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="text-xs font-semibold"
            >
              Delete (Admin)
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-8">
        {/* Banner Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{hackathon.name}</h2>
              <p className="text-gray-500 font-medium">Official Event by {hackathon.organizer}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {isAdmin && (
                <Button variant="destructive" onClick={handleDelete} className="text-xs font-semibold">
                  Delete Hackathon (Admin)
                </Button>
              )}
              <Link href={`/teams/create?hackathon=${encodeURIComponent(hackathon.name)}`}>
                <Button className="flex items-center gap-2">
                  <PlusCircle size={18} /> Create a Team
                </Button>
              </Link>
              <Link href={`/teams?hackathon=${encodeURIComponent(hackathon.name)}`}>
                <Button variant="outline">Browse Teams</Button>
              </Link>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed text-base border-t pt-4">
            {hackathon.description}
          </p>

          {/* Real Live Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users size={14} className="text-primary" /> Registered Teams
              </div>
              <div className="text-2xl font-bold text-gray-900">{hackathon.teams_count}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle size={14} className="text-green-600" /> Total Students
              </div>
              <div className="text-2xl font-bold text-gray-900">{hackathon.participants_count}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={14} className="text-amber-600" /> Reg. Deadline
              </div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                {format(new Date(hackathon.registration_deadline), 'MMM d, yyyy')}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={14} className="text-blue-600" /> Event Date
              </div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                {format(new Date(hackathon.event_date), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 pt-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" /> 
              <span><strong>Location:</strong> {hackathon.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" /> 
              <span><strong>Team Rules:</strong> {hackathon.team_size_min} to {hackathon.team_size_max} members per team</span>
            </div>
            {hackathon.official_url && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Globe size={16} className="text-primary" /> 
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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Teams in this Hackathon ({hackathon.teams.length})</h3>
              <p className="text-gray-500 text-sm">Teams formed or currently recruiting for {hackathon.name}.</p>
            </div>
            <Link href={`/teams/create?hackathon=${encodeURIComponent(hackathon.name)}`}>
              <Button size="sm" variant="outline">Register New Team</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hackathon.teams.map((team) => (
              <Card key={team.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={team.recruitment_status === 'Open' ? 'default' : 'secondary'}>
                      {team.recruitment_status === 'Open' ? 'Recruiting' : 'Full / Closed'}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">
                      Max {team.max_members} Members
                    </span>
                  </div>
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  <div className="text-xs text-gray-500">
                    Leader: <strong>{team.leader?.name || 'Student'}</strong> ({team.leader?.branch})
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <p className="text-gray-600 text-sm">{team.description}</p>
                  
                  {team.requirements && (
                    <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-600">
                      <span className="font-semibold block mb-1">Rules & Regulations / Requirements:</span>
                      {team.requirements}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <span className="text-xs font-semibold text-gray-500 block mb-2">Current Members ({team.members?.length || 1})</span>
                    <div className="flex flex-wrap gap-2">
                      {team.members?.map((m) => (
                        <Badge key={m.id} variant="outline" className="text-xs bg-white">
                          {m.student.name} {m.role ? `(${m.role})` : ''}
                        </Badge>
                      ))}
                      {(!team.members || team.members.length === 0) && (
                        <Badge variant="outline" className="text-xs bg-white">
                          {team.leader?.name} (Leader)
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hackathon.teams.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed">
                <Users size={36} className="mx-auto text-gray-400 mb-3" />
                <h4 className="text-lg font-bold text-gray-700">No teams registered yet</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Be the first one to create a team for {hackathon.name} and start inviting your batchmates!
                </p>
                <Link href="/teams/create" className="inline-block mt-4">
                  <Button>Create the First Team</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
