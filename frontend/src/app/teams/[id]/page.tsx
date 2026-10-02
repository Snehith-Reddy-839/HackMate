'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import JoinRequestModal from '@/components/JoinRequestModal';
import Navbar from '@/components/Navbar';
import { Tooltip } from '@/components/ui/tooltip';
import { TeamCardSkeleton } from '@/components/skeletons';
import { 
  ArrowLeft, Users, Trophy, Sparkles, MessageSquare, ShieldCheck, 
  Clock, ShieldAlert, CheckCircle2, UserPlus, LogIn, LogOut
} from 'lucide-react';

interface TeamMember {
  id: number;
  student_id: number;
  role?: string;
  student?: {
    id: number;
    name: string;
    avatar?: string;
    branch?: string;
    year?: number;
    section?: string;
  };
}

interface TeamDetail {
  id: number;
  name: string;
  hackathon_name: string;
  recruitment_status: string;
  max_members: number;
  description: string;
  requirements: string;
  looking_for_roles?: string;
  required_skills?: string;
  availability_requirements?: string;
  leader_id: number;
  leader?: {
    id: number;
    name: string;
    avatar?: string;
    branch?: string;
    year?: number;
    section?: string;
  };
  members?: TeamMember[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchTeam = async () => {
    if (!teamId) return;
    try {
      const res = await api.get(`/teams/${teamId}`);
      setTeam(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error('Failed to load team details', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      const res = await api.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) {
      // not logged in or invalid token
    }
  };

  const [leaving, setLeaving] = useState(false);

  const handleLeaveTeam = async () => {
    if (!confirm(`Are you sure you want to leave team "${team?.name}"?`)) return;
    setLeaving(true);
    try {
      await api.post(`/teams/${team?.id}/leave`);
      alert(`You have left ${team?.name}.`);
      router.push('/teams');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to leave team');
    } finally {
      setLeaving(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchUser();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex flex-col">
        <Navbar />
        <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-6">
          <TeamCardSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Users size={48} className="text-gray-400 mb-3" />
          <h2 className="text-2xl font-bold text-gray-800">Team Not Found</h2>
          <p className="text-gray-500 mt-1 max-w-md text-sm">
            This squad does not exist or may have been deleted.
          </p>
          <Link href="/teams" className="mt-6">
            <Button variant="outline" className="flex items-center gap-2 rounded-xl">
              <ArrowLeft size={16} /> Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLeader = currentUser && currentUser.id === team.leader_id;
  const isMember = currentUser && (
    isLeader || team.members?.some(m => m.student_id === currentUser.id)
  );
  const isOpen = team.recruitment_status === 'Open';

  const lookingRoles = (team.looking_for_roles || '')
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);

  const reqSkills = (team.required_skills || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const memberCount = team.members ? team.members.length : 1;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* SaaS Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 max-w-5xl mx-auto w-full space-y-6">
        {/* Banner Card */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isOpen ? 'default' : 'secondary'} className={isOpen ? 'bg-emerald-600' : ''}>
                  {isOpen ? 'Recruiting' : 'Closed'}
                </Badge>
                <Badge variant="outline" className="text-primary border-primary/30 flex items-center gap-1 font-semibold">
                  <Trophy size={13} /> {team.hackathon_name}
                </Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {memberCount} / {team.max_members} Members
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{team.name}</h1>
              {team.leader && (
                <div className="flex items-center gap-2 pt-1 text-sm text-gray-600">
                  <AvatarDisplay
                    avatar={team.leader.avatar}
                    seed={team.leader.name}
                    name={team.leader.name}
                    size="sm"
                  />
                  <span>
                    Founded by <strong>{team.leader.name}</strong> ({team.leader.branch || 'CSE'}, Year {team.leader.year || 2})
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {isLeader && (
                <Link href={`/teams/${team.id}/manage`}>
                  <Button className="font-semibold text-xs h-9 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Manage Roster
                  </Button>
                </Link>
              )}
              {isMember && (
                <Link href={`/teams/${team.id}/chat`}>
                  <Button variant="outline" className="font-semibold text-xs h-9 flex items-center gap-1.5">
                    <MessageSquare size={14} /> Team Chat
                  </Button>
                </Link>
              )}
              {isMember && !isLeader && (
                <Button 
                  variant="outline" 
                  disabled={leaving}
                  onClick={handleLeaveTeam}
                  className="font-semibold text-xs h-9 flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut size={14} /> {leaving ? 'Leaving...' : 'Leave Team'}
                </Button>
              )}
              {!isMember && isOpen && currentUser && (
                <Button 
                  onClick={() => setJoinModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 flex items-center gap-1.5"
                >
                  <UserPlus size={14} /> Request to Join
                </Button>
              )}
              {!currentUser && isOpen && (
                <Link href="/login">
                  <Button className="font-semibold text-xs h-9 flex items-center gap-1.5">
                    <LogIn size={14} /> Login to Apply
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <p className="text-gray-700 mt-6 text-sm leading-relaxed whitespace-pre-line">
            {team.description}
          </p>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Roles & Skills & Rules */}
          <div className="md:col-span-2 space-y-6">
            {/* Roles Needed */}
            {lookingRoles.length > 0 && (
              <Card className="rounded-2xl border shadow-sm bg-white p-6">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" /> Roles Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lookingRoles.map((role, i) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs py-1 px-2.5">
                      {role}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Required Skills */}
            {reqSkills.length > 0 && (
              <Card className="rounded-2xl border shadow-sm bg-white p-6">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Required Skills & Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {reqSkills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-800 text-xs py-1 px-2.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Rules & Expectations */}
            {team.requirements && (
              <Card className="rounded-2xl border shadow-sm bg-white p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-600" /> Team Rules & Expectations
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {team.requirements}
                </p>
              </Card>
            )}

            {/* Expected Availability */}
            {team.availability_requirements && (
              <Card className="rounded-2xl border shadow-sm bg-white p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" /> Expected Availability
                </h3>
                <p className="text-gray-700 text-sm">
                  {team.availability_requirements}
                </p>
              </Card>
            )}
          </div>

          {/* Right Column: Team Roster */}
          <div className="md:col-span-1">
            <Card className="rounded-2xl border shadow-sm bg-white p-6 sticky top-24">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={16} className="text-primary" /> Squad Roster ({memberCount}/{team.max_members})
              </h3>
              
              <ul className="divide-y divide-gray-100">
                {team.members && team.members.length > 0 ? (
                  team.members.map((m) => {
                    const student = m.student;
                    const isMemLeader = student?.id === team.leader_id || m.role?.toLowerCase().includes('leader');
                    return (
                      <li key={m.id} className="py-3 flex items-center gap-3">
                        <AvatarDisplay
                          avatar={student?.avatar}
                          seed={student?.name}
                          name={student?.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                            {student?.name || 'Student'}
                            {isMemLeader && (
                              <Badge className="bg-amber-100 text-amber-800 text-[9px] font-bold py-0 px-1">
                                Leader
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {m.role || 'Member'} • {student?.branch || 'CSE'}
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  team.leader && (
                    <li className="py-3 flex items-center gap-3">
                      <AvatarDisplay
                        avatar={team.leader.avatar}
                        seed={team.leader.name}
                        name={team.leader.name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                          {team.leader.name}
                          <Badge className="bg-amber-100 text-amber-800 text-[9px] font-bold py-0 px-1">
                            Leader
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Team Leader • {team.leader.branch || 'CSE'}
                        </div>
                      </div>
                    </li>
                  )
                )}
              </ul>

              {!isMember && isOpen && currentUser && (
                <Button 
                  onClick={() => setJoinModalOpen(true)}
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                >
                  <UserPlus size={16} className="mr-2" /> Apply to Join
                </Button>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Join Request Modal */}
      <JoinRequestModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        team={team}
        onSuccess={fetchTeam}
      />
    </div>
  );
}
