'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CompactApplicantCard from '@/components/CompactApplicantCard';
import AvatarDisplay from '@/components/AvatarDisplay';
import { 
  ArrowLeft, Users, MessageSquare, Lock, Unlock, ShieldAlert, CheckCircle2, XCircle, Clock
} from 'lucide-react';

export default function ManageTeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id;

  const [team, setTeam] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);

  const fetchTeamData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`/requests/team/${teamId}`)
      ]);
      setTeam(tRes.data);
      setRequests(rRes.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching team or applications');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchTeamData();
  }, [teamId]);

  const handleAction = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      await api.post(`/requests/${requestId}/${action}`);
      alert(`Application ${action}ed successfully!`);
      fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Error ${action}ing request`);
    }
  };

  const handleRemoveMember = async (studentId: number) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Team Management...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const acceptedRequests = requests.filter(r => r.status === 'ACCEPTED');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  const members = team.members || [];
  const isTeamFull = members.length >= team.max_members;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="font-bold text-xl flex items-center gap-2">
              {team.name}
              <Badge variant={team.recruitment_status === 'Open' ? 'default' : 'secondary'}>
                {team.recruitment_status}
              </Badge>
            </h1>
            <p className="text-xs text-gray-500">Hackathon: {team.hackathon_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/teams/${teamId}/chat`}>
            <Button variant="outline" className="gap-2">
              <MessageSquare size={16} /> Team Chat
            </Button>
          </Link>

          <Button
            variant={team.recruitment_status === 'Open' ? 'destructive' : 'default'}
            size="sm"
            onClick={toggleRecruitment}
            disabled={isTeamFull && team.recruitment_status === 'Closed'}
            className="gap-1.5"
          >
            {team.recruitment_status === 'Open' ? (
              <><Lock size={14} /> Close Recruitment</>
            ) : (
              <><Unlock size={14} /> Reopen Recruitment</>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Team Overview Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Team Roster & Recruitment</h2>
              <p className="text-gray-500 text-sm">
                Capacity: <strong>{members.length} / {team.max_members} members</strong>
              </p>
            </div>

            {isTeamFull && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 py-1.5 px-3">
                🎉 Team Reached Maximum Size ({team.max_members} / {team.max_members})
              </Badge>
            )}
          </div>

          {/* Requirements summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t">
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
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users size={20} className="text-primary" /> Active Team Members ({members.length} / {team.max_members})
          </h3>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {members.map((m: any) => {
                const s = m.student || {};
                const isLeader = m.student_id === team.leader_id;
                return (
                  <li key={m.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <AvatarDisplay
                        avatar={s.avatar || s.profile?.avatar}
                        seed={s.email || s.name}
                        name={s.name}
                        size="md"
                      />
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {s.name || 'Student'}
                          {isLeader && (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Team Leader
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {m.role || 'Team Member'} • {s.branch || 'CSE'} (Year {s.year || 2})
                        </div>
                      </div>
                    </div>

                    {!isLeader && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                        onClick={() => handleRemoveMember(m.student_id)}
                      >
                        Remove
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Applications Tabs Section */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Join Applications</h3>
              <p className="text-gray-500 text-sm">Review applicants with compact cards and factual requirement matches.</p>
            </div>

            {/* Tabs selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('PENDING')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'PENDING'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Clock size={14} /> Pending ({pendingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ACCEPTED')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ACCEPTED'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <CheckCircle2 size={14} /> Accepted ({acceptedRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('REJECTED')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'REJECTED'
                    ? 'bg-white text-red-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <XCircle size={14} /> Rejected ({rejectedRequests.length})
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
                />
              ))}

              {pendingRequests.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed">
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
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed">
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
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed">
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
