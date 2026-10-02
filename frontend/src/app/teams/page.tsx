'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, getCached } from '@/lib/api';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import Navbar from '@/components/Navbar';
import { Tooltip } from '@/components/ui/tooltip';
import { TeamCardSkeleton } from '@/components/skeletons';
import JoinRequestModal from '@/components/JoinRequestModal';
import { Users, PlusCircle, Sparkles, Trophy, Search, Filter, ArrowRight, UserPlus } from 'lucide-react';

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
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get('hackathon');
  const [selectedTeamForJoin, setSelectedTeamForJoin] = useState<Team | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await getCached<Team[]>('/teams/', undefined, 15000);
      let allTeams: Team[] = res.data;
      if (hackathonFilter) {
        setTeams(allTeams.filter(t => t.hackathon_name.toLowerCase() === hackathonFilter.toLowerCase()));
      } else {
        setTeams(allTeams);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [hackathonFilter]);

  const filteredTeams = teams.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hackathon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.required_skills && t.required_skills.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.looking_for_roles && t.looking_for_roles.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || t.recruitment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (fetching) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams by name, skill, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['All', 'Open', 'Closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {status === 'All' ? 'All Squads' : status === 'Open' ? 'Recruiting Only' : 'Full / Closed'}
            </button>
          ))}
        </div>
      </div>

      {hackathonFilter && (
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-gray-600 bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl">
          <span>Filtering teams for: <strong>{hackathonFilter}</strong></span>
          <Link href="/teams" className="text-primary hover:underline ml-auto font-bold">
            Clear Filter
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((t) => {
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
            <Card key={t.id} className="flex flex-col justify-between hover:shadow-md transition-all bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge 
                    variant={isOpen ? 'default' : 'secondary'} 
                    className={`text-[10px] font-bold ${
                      isOpen 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isOpen ? 'Recruiting' : 'Closed'}
                  </Badge>
                  <span className="text-xs text-gray-400 font-medium">Max {t.max_members} Members</span>
                </div>

                <CardTitle className="text-xl font-bold tracking-tight text-gray-950">
                  <Link href={`/teams/${t.id}`} className="hover:text-primary transition-colors">
                    {t.name}
                  </Link>
                </CardTitle>
                
                <div className="flex items-center gap-1.5 pt-1 text-xs text-primary font-semibold truncate">
                  <Trophy size={13} className="shrink-0" /> {t.hackathon_name}
                </div>

                {t.leader && (
                  <div className="flex items-center gap-2 pt-2 text-xs text-gray-500">
                    <AvatarDisplay
                      avatar={t.leader.avatar}
                      seed={t.leader.name}
                      name={t.leader.name}
                      size="sm"
                    />
                    <span className="truncate">Led by <strong className="text-gray-700">{t.leader.name}</strong> ({t.leader.branch || 'CSE'})</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-5 py-2 space-y-3 flex-1 text-xs">
                <p className="text-gray-600 line-clamp-2 leading-relaxed">{t.description}</p>

                {/* Looking for roles */}
                {lookingRoles.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block">
                      Looking For Roles:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {lookingRoles.map((r, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50/80 text-blue-800 border-blue-200 text-[10px] py-0 px-2">
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
                    <div className="flex flex-wrap gap-1">
                      {reqSkills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-2">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Rules */}
                {t.requirements && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 text-gray-600 text-[11px]">
                    <span className="font-semibold block text-gray-500 mb-0.5">Expectations:</span>
                    <p className="line-clamp-2">{t.requirements}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-3 border-t border-gray-100 bg-gray-50/40 flex gap-2">
                <Link href={`/teams/${t.id}`} className="flex-1">
                  <Button variant="outline" className="w-full text-xs font-bold rounded-xl h-9">
                    View Squad
                  </Button>
                </Link>
                <Button
                  className={`flex-1 font-bold text-xs rounded-xl h-9 ${
                    isOpen ? 'bg-black text-white hover:bg-gray-800' : ''
                  }`}
                  disabled={!isOpen}
                  onClick={() => setSelectedTeamForJoin(t)}
                >
                  {isOpen ? (
                    <span className="flex items-center justify-center gap-1">
                      <UserPlus size={14} /> Apply
                    </span>
                  ) : (
                    'Closed'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200 p-8 space-y-3">
            <Users size={36} className="mx-auto text-gray-400 mb-2" />
            <h4 className="text-base font-bold text-gray-800">No teams match your criteria</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Try resetting your search or filter settings, or start a new squad for your hackathon.
            </p>
            <Link href="/teams/create" className="inline-block pt-1">
              <Button size="sm" className="rounded-xl font-bold text-xs h-9">Create a Team</Button>
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
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* SaaS Navbar */}
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950">Discover Teams</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Connect with student creators, browse open vacancies, and join hackathon squads.</p>
          </div>
          <Link href="/teams/create" className="shrink-0">
            <Button className="flex items-center gap-2 font-bold text-xs sm:text-sm h-10 px-5 rounded-xl bg-black text-white hover:bg-gray-800 shadow-xs">
              <PlusCircle size={16} /> Create a Team
            </Button>
          </Link>
        </div>
        
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        }>
          <TeamsList />
        </Suspense>
      </main>
    </div>
  );
}
