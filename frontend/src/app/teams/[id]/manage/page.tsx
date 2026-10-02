'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CompactApplicantCard from '@/components/CompactApplicantCard';
import AvatarDisplay from '@/components/AvatarDisplay';
import Navbar from '@/components/Navbar';
import { Tooltip } from '@/components/ui/tooltip';
import { TeamCardSkeleton } from '@/components/skeletons';
import { 
  ArrowLeft, Users, MessageSquare, Lock, Unlock, ShieldAlert, 
  CheckCircle2, XCircle, Clock, Trash2, Eye, ShieldCheck, Trophy
} from 'lucide-react';

export default function ManageTeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id;

  const [team, setTeam] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchTeamData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [tRes, rRes] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`/requests/team/${teamId}`)
      ]);
      setTeam(tRes.data);
      setRequests(rRes.data);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 403) {
        alert('You are not authorized to manage this team. Only the team leader can access this page.');
      } else {
        alert('Error fetching team or applications');
      }
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchTeamData();
  }, [teamId]);

  // Optimistic Accept / Reject with automatic rollback on error
  const handleAction = async (requestId: number, action: 'accept' | 'reject') => {
    if (processingId) return;
    setProcessingId(requestId);

    // 1. Snapshot previous state
    const prevRequests = [...requests];
    const prevTeam = team ? { ...team } : null;

    // 2. Optimistic update
    const targetStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: targetStatus } : r))
    );

    // If accepted, optimistically update roster
    if (action === 'accept' && team) {
      const targetReq = requests.find((r) => r.id === requestId);
      if (targetReq && targetReq.student) {
        setTeam((prev: any) => ({
          ...prev,
          members: [
            ...(prev.members || []),
            {
              id: -Date.now(),
              team_id: team.id,
              student_id: targetReq.student.id,
              role: targetReq.role || targetReq.preferred_role || 'Member',
              student: targetReq.student,
            },
          ],
        }));
      }
    }

    // 3. Network call
    try {
      await api.post(`/requests/${requestId}/${action}`);
      // Reconcile with fresh server data
      await fetchTeamData();
    } catch (err: any) {
      // Rollback on failure
      setRequests(prevRequests);
      setTeam(prevTeam);
      alert(err.response?.data?.detail || `Error ${action}ing request`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (studentId: number) => {
    if (!confirm('Are you sure you want to remove this member from the squad roster?')) return;
    try {
      await api.delete(`/teams/${teamId}/members/${studentId}`);
      alert('Member removed successfully');
      fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error removing member');
    }
  };

  const toggleRecruitment = async () => {
    if (!team) return;
    try {
      if (team.recruitment_status === 'Open') {
        await api.put(`/teams/${teamId}/close`);
        alert('Recruitment closed.');
      } else {
        await api.put(`/teams/${teamId}/reopen`);
        alert('Recruitment reopened.');
      }
      fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error updating recruitment status');
    }
  };

  if (loading || !team) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex flex-col">
        <Navbar />
        <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6">
          <TeamCardSkeleton />
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const acceptedRequests = requests.filter(r => r.status === 'ACCEPTED');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  const members = team.members || [];
  const isTeamFull = members.length >= team.max_members;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* SaaS Navbar */}
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
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
                <h1 className="font-bold text-xl sm:text-2xl text-gray-950">{team.name}</h1>
                <Badge
                  variant={team.recruitment_status === 'Open' ? 'default' : 'secondary'}
                  className={`text-[10px] font-bold ${
                    team.recruitment_status === 'Open'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {team.recruitment_status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                <Trophy size={12} className="text-primary" /> {team.hackathon_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={`/teams/${teamId}/chat`}>
              <Button variant="outline" size="sm" className="font-semibold text-xs h-9 rounded-xl gap-1.5">
                <MessageSquare size={14} /> Team Chat
              </Button>
            </Link>

            <Button
              variant={team.recruitment_status === 'Open' ? 'destructive' : 'default'}
              size="sm"
              onClick={toggleRecruitment}
              disabled={isTeamFull && team.recruitment_status === 'Closed'}
              className="text-xs font-bold h-9 rounded-xl gap-1.5"
            >
              {team.recruitment_status === 'Open' ? (
                <><Lock size={14} /> Close Recruitment</>
              ) : (
                <><Unlock size={14} /> Reopen Recruitment</>
              )}
            </Button>
          </div>
        </div>

        {/* Team Overview Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-950">Squad Roster & Capacity</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Current Size: <strong>{members.length} / {team.max_members} members enrolled</strong>
              </p>
            </div>

            {isTeamFull && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 py-1.5 px-3 text-xs font-semibold">
                🎉 Team Reached Maximum Capacity ({team.max_members} / {team.max_members})
              </Badge>
            )}
          </div>

          {/* Requirements summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100">
            {team.looking_for_roles && (
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                <span className="font-semibold text-blue-900 block mb-1">Looking for Roles:</span>
                <span className="text-blue-800 font-medium">{team.looking_for_roles}</span>
              </div>
            )}
            {team.required_skills && (
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                <span className="font-semibold text-emerald-900 block mb-1">Required Skills:</span>
                <span className="text-emerald-800 font-medium">{team.required_skills}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Active Team Members Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
            <Users size={18} className="text-primary" /> Active Squad Members ({members.length} / {team.max_members})
          </h2>

          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {members.map((m: any) => {
                const s = m.student || {};
                const isLeader = m.student_id === team.leader_id;
                return (
                  <li key={m.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <AvatarDisplay
                        avatar={s.avatar || s.profile?.avatar}
                        seed={s.email || s.name}
                        name={s.name}
                        size="md"
                        className="shadow-2xs"
                      />
                      <div>
                        <div className="font-bold text-sm text-gray-950 flex items-center gap-2">
                          <span>{s.name || 'Student'}</span>
                          {isLeader && (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold py-0 px-1.5">
                              Team Leader
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] text-gray-600 bg-white">
                            {m.role || 'Member'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {s.branch || 'CSE'} • Year {s.year || 2} • Roll: <span className="font-mono">{s.roll_number || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {!isLeader && (
                      <Tooltip content="Remove member from roster">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.student_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold h-8 rounded-lg"
                        >
                          <Trash2 size={13} className="mr-1" /> Remove
                        </Button>
                      </Tooltip>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Join Applications Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Applications & Candidates
              </h2>
              <p className="text-xs text-gray-500">Review student profiles and manage acceptance into the squad.</p>
            </div>

            {/* Tabs selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('PENDING')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'PENDING'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Clock size={13} /> Pending ({pendingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ACCEPTED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ACCEPTED'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <CheckCircle2 size={13} /> Accepted ({acceptedRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('REJECTED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'REJECTED'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <XCircle size={13} /> Rejected ({rejectedRequests.length})
              </button>
            </div>
          </div>

          {/* Pending Applications List */}
          {activeTab === 'PENDING' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.map((r) => (
                <CompactApplicantCard
                  key={r.id}
                  request={r}
                  team={team}
                  onAccept={(id) => handleAction(id, 'accept')}
                  onReject={(id) => handleAction(id, 'reject')}
                  isActionable={!isTeamFull}
                  processing={processingId === r.id}
                />
              ))}

              {pendingRequests.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  No pending join applications right now.
                </div>
              )}
            </div>
          )}

          {/* Accepted Applications */}
          {activeTab === 'ACCEPTED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedRequests.map((r) => (
                <CompactApplicantCard
                  key={r.id}
                  request={r}
                  team={team}
                  onAccept={() => {}}
                  onReject={() => {}}
                  isActionable={false}
                />
              ))}
              {acceptedRequests.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  No accepted application history yet.
                </div>
              )}
            </div>
          )}

          {/* Rejected Applications */}
          {activeTab === 'REJECTED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejectedRequests.map((r) => (
                <CompactApplicantCard
                  key={r.id}
                  request={r}
                  team={team}
                  onAccept={() => {}}
                  onReject={() => {}}
                  isActionable={false}
                />
              ))}
              {rejectedRequests.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  No rejected applications.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
