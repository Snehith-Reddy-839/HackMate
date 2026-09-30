'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import NotificationDropdown from '@/components/NotificationDropdown';
import JoinRequestModal from '@/components/JoinRequestModal';
import { Users, PlusCircle, Sparkles, Trophy } from 'lucide-react';

interface Team {
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
  leader?: {
    id: number;
    name: string;
    avatar?: string;
    branch?: string;
  };
}

function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get('hackathon');
  const [selectedTeamForJoin, setSelectedTeamForJoin] = useState<Team | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams/');
      let allTeams: Team[] = res.data;
      if (hackathonFilter) {
        setTeams(allTeams.filter(t => t.hackathon_name === hackathonFilter));
      } else {
        setTeams(allTeams);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [hackathonFilter]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => {
          const lookingRoles = (t.looking_for_roles || '')
            .split(',')
            .map(r => r.trim())
            .filter(Boolean);

          const reqSkills = (t.required_skills || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

          const isOpen = t.recruitment_status === 'Open';

          return (
            <Card key={t.id} className="flex flex-col justify-between hover:shadow-md transition-shadow bg-white rounded-2xl border">
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={isOpen ? 'default' : 'secondary'} className={isOpen ? 'bg-emerald-600' : ''}>
                    {isOpen ? 'Recruiting' : 'Closed'}
                  </Badge>
                  <span className="text-xs text-gray-500 font-medium">Max {t.max_members} Members</span>
                </div>

                <CardTitle className="text-2xl font-bold">{t.name}</CardTitle>
                
                <div className="flex items-center gap-2 pt-1 text-xs text-primary font-semibold">
                  <Trophy size={14} /> {t.hackathon_name}
                </div>

                {t.leader && (
                  <div className="flex items-center gap-2 pt-2 text-xs text-gray-500">
                    <AvatarDisplay
                      avatar={t.leader.avatar}
                      seed={t.leader.name}
                      name={t.leader.name}
                      size="sm"
                    />
                    <span>Led by <strong>{t.leader.name}</strong> ({t.leader.branch || 'CSE'})</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6 py-3 space-y-3.5 flex-1 text-xs">
                <p className="text-gray-600 line-clamp-3 leading-relaxed">{t.description}</p>

                {/* Looking for roles */}
                {lookingRoles.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block">
                      Looking For Roles:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lookingRoles.map((r, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Skills */}
                {reqSkills.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block">
                      Required Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {reqSkills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Rules */}
                {t.requirements && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-700">
                    <span className="font-semibold text-[11px] block text-gray-500 mb-0.5">Rules & Expectations:</span>
                    <p className="line-clamp-2">{t.requirements}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-6 pt-3 border-t bg-gray-50/50">
                <Button
                  className="w-full font-semibold"
                  disabled={!isOpen}
                  onClick={() => setSelectedTeamForJoin(t)}
                >
                  {isOpen ? 'Request to Join' : 'Recruitment Closed'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed">
            <Users size={36} className="mx-auto text-gray-400 mb-2" />
            <h4 className="text-lg font-bold text-gray-700">No teams found</h4>
            <p className="text-sm text-gray-500 mt-1">Be the first to create a team for this hackathon!</p>
            <Link href="/teams/create" className="inline-block mt-4">
              <Button>Create a Team</Button>
            </Link>
          </div>
        )}
      </div>

      <JoinRequestModal
        open={!!selectedTeamForJoin}
        onOpenChange={(open) => !open && setSelectedTeamForJoin(null)}
        team={selectedTeamForJoin}
        onSuccess={fetchTeams}
      />
    </>
  );
}

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-2xl text-primary">HackMate</Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <Link href="/hackathons" className="text-gray-600 hover:text-primary font-medium">Hackathons</Link>
            <Link href="/teams" className="text-primary font-medium">Teams</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-primary font-medium">Dashboard</Link>
          </nav>
          <NotificationDropdown />
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Discover Teams</h1>
            <p className="text-gray-500 text-lg">Find the perfect squad matching your skills and interests.</p>
          </div>
          <Link href="/teams/create">
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} /> Create a Team
            </Button>
          </Link>
        </div>
        
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading teams...</div>}>
          <TeamsList />
        </Suspense>
      </main>
    </div>
  );
}
