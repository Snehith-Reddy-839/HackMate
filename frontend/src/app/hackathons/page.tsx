'use client';
import { useEffect, useState } from 'react';
import { api, getCached } from '@/lib/api';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { Tooltip } from '@/components/ui/tooltip';
import { HackathonCardSkeleton } from '@/components/skeletons';
import { format } from 'date-fns';
import { 
  Calendar, Users, MapPin, PlusCircle, ArrowRight, ShieldCheck, 
  Clock, ChevronDown, ChevronUp, Trash2, Sparkles, Archive, AlertCircle,
  Search, Filter, Globe, ExternalLink
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

interface Hackathon {
  id: number;
  name: string;
  status: string;
  mode: string;
  organizer: string;
  description: string;
  event_date: string;
  registration_deadline: string;
  team_size_min: number;
  team_size_max: number;
  location: string;
  teams_count?: number;
  participants_count?: number;
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClosedDropdown, setShowClosedDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  const [formData, setFormData] = useState({
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

  const fetchHackathons = async () => {
    try {
      const res = await getCached<Hackathon[]>('/hackathons', undefined, 20000);
      setHackathons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      getCached('/profiles/me', undefined, 20000)
        .then((res) => {
          if (String(res.data?.role).toLowerCase() === 'admin') {
            setIsAdmin(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('team_size') ? parseInt(value) || 1 : value,
    }));
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/hackathons/', {
        ...formData,
        registration_deadline: new Date(formData.registration_deadline).toISOString(),
        event_date: new Date(formData.event_date).toISOString(),
      });
      alert('Hackathon created successfully!');
      setOpenModal(false);
      setFormData({
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
      await fetchHackathons();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHackathon = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete hackathon "${name}" from the database?`)) {
      return;
    }
    try {
      await api.delete(`/hackathons/${id}`);
      alert(`Hackathon "${name}" was deleted successfully.`);
      fetchHackathons();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete hackathon');
    }
  };

  // Filter hackathons
  const filteredHackathons = hackathons.filter((h) => {
    const matchesSearch = 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = modeFilter === 'All' || h.mode.toLowerCase() === modeFilter.toLowerCase();
    return matchesSearch && matchesMode;
  });

  const activeHackathons = filteredHackathons.filter(h => h.status === 'Registration Open');
  const closedHackathons = filteredHackathons.filter(h => h.status === 'Registration Closed' || h.status === 'Completed');

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Unified SaaS Navbar */}
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Top Header & Admin Add Action */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-gray-200/80 pb-6 bg-white p-6 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Vasavi College Events
              </span>
              {isAdmin && (
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Admin Mode
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950">Explore Hackathons</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Discover upcoming events, browse competing squads, or inspect archived leaderboards.</p>
          </div>

          {isAdmin && (
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 px-5">
                <PlusCircle size={16} className="mr-2" /> Post Hackathon (Admin)
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <ShieldCheck className="text-primary" /> Create New Hackathon
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateHackathon} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hackathon Name *</label>
                    <Input name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Smart India Hackathon 2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organizer *</label>
                      <Input name="organizer" required value={formData.organizer} onChange={handleChange} placeholder="e.g. VCE CSE Dept" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mode *</label>
                      <select name="mode" value={formData.mode} onChange={handleChange} className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-background">
                        <option value="Offline">Offline</option>
                        <option value="Online">Online</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea name="description" required rows={3} value={formData.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md text-sm" placeholder="Provide problem statement, guidelines, or event overview..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline *</label>
                      <Input name="registration_deadline" type="date" required value={formData.registration_deadline} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                      <Input name="event_date" type="date" required value={formData.event_date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                      <Input name="location" required value={formData.location} onChange={handleChange} placeholder="e.g. VCE Campus / Hyderabad" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Team Size</label>
                      <Input name="team_size_min" type="number" min={1} max={10} value={formData.team_size_min} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                      <Input name="team_size_max" type="number" min={1} max={10} value={formData.team_size_max} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Official Website URL (Optional)</label>
                    <Input name="official_url" value={formData.official_url} onChange={handleChange} placeholder="https://smartindiahackathon.gov.in" />
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={loading}>
                    {loading ? 'Creating...' : 'Publish Hackathon'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search & Mode Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Offline', 'Online', 'Hybrid'].map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  modeFilter === mode
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 1: ACTIVE / REGISTRATION OPEN HACKATHONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-emerald-600" size={20} /> 
              Active Hackathons 
              <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold ml-1">
                {activeHackathons.length} Open
              </Badge>
            </h2>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <HackathonCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeHackathons.map((h) => (
                <Card key={h.id} className="flex flex-col border border-emerald-100/90 bg-white hover:shadow-md transition-all rounded-2xl overflow-hidden shadow-xs">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-emerald-600 text-white font-semibold text-[11px]">
                        Registration Open
                      </Badge>
                      <Badge variant="outline" className="text-xs">{h.mode}</Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-950 line-clamp-1">{h.name}</CardTitle>
                    <div className="text-xs text-gray-500 font-medium">Organized by <strong className="text-gray-700">{h.organizer}</strong></div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex-1 space-y-4">
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">{h.description}</p>
                    
                    {/* Live Metrics */}
                    <div className="flex gap-2 items-center flex-wrap pt-1">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold text-xs py-0.5">
                        <Users size={12} className="mr-1" /> {h.teams_count || 0} Teams Registered
                      </Badge>
                      <Badge variant="outline" className="text-gray-600 text-xs py-0.5">
                        {h.participants_count || 0} Students
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                        <Clock size={13} /> 
                        <span>Reg. Deadline: {formatSafeDate(h.registration_deadline)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={13} /> <span>Event Date: {formatSafeDate(h.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={13} /> <span>Team Size: {h.team_size_min}-{h.team_size_max} members</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 truncate">
                        <MapPin size={13} /> <span>{h.location}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 p-4 pt-3 border-t border-gray-100 bg-gray-50/40">
                    <Link href={`/hackathons/${h.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-xs font-bold rounded-xl h-9">
                        Details <ArrowRight size={13} />
                      </Button>
                    </Link>
                    <Link href={`/teams?hackathon=${encodeURIComponent(h.name)}`} className="flex-1">
                      <Button size="sm" className="w-full text-xs font-bold rounded-xl h-9 bg-black text-white hover:bg-gray-800">
                        Find Teams
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Tooltip content="Permanently delete hackathon">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteHackathon(h.id, h.name)}
                          className="shrink-0 h-9 w-9 text-white rounded-xl shadow-xs"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Tooltip>
                    )}
                  </CardFooter>
                </Card>
              ))}

              {activeHackathons.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 p-8 space-y-2">
                  <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
                  <h3 className="font-bold text-gray-800 text-base">No Matching Active Hackathons</h3>
                  <p className="text-xs text-gray-400">Try adjusting your search terms or filter settings above.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 2: PAST / CLOSED HACKATHONS */}
        <section className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <button
            onClick={() => setShowClosedDropdown(prev => !prev)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/60 hover:bg-slate-100/60 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                <Archive size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Past & Closed Hackathons
                  <Badge variant="secondary" className="bg-slate-200 text-slate-800 text-xs font-bold">
                    {closedHackathons.length}
                  </Badge>
                </h3>
                <p className="text-xs text-gray-400">
                  {showClosedDropdown ? 'Click to hide archived events' : 'Click to view past deadlines and event history'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span>{showClosedDropdown ? 'Hide' : 'Show'}</span>
              {showClosedDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {showClosedDropdown && (
            <div className="p-6 bg-slate-50/30 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {closedHackathons.map((h) => {
                  const isCompleted = h.status === 'Completed';
                  return (
                    <Card key={h.id} className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs opacity-90 hover:opacity-100 transition-opacity">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge 
                            className={
                              isCompleted
                                ? 'bg-slate-700 text-white font-semibold text-[11px]'
                                : 'bg-amber-500 text-white font-semibold text-[11px]'
                            }
                          >
                            {h.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{h.mode}</Badge>
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">{h.name}</CardTitle>
                        <div className="text-xs text-gray-500 font-medium">Organized by {h.organizer}</div>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 flex-1 space-y-3">
                        <p className="text-gray-500 text-xs line-clamp-2">{h.description}</p>
                        
                        <div className="space-y-1 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock size={12} />
                            <span>Deadline: {formatSafeDate(h.registration_deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>Event: {formatSafeDate(h.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} />
                            <span>{h.location}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2 p-4 pt-3 border-t border-gray-100 bg-gray-50/40">
                        <Link href={`/hackathons/${h.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl h-8">
                            View Event
                          </Button>
                        </Link>
                        <Link href={`/teams?hackathon=${encodeURIComponent(h.name)}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full text-xs font-semibold rounded-xl h-8">
                            View Teams
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Tooltip content="Permanently delete hackathon">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteHackathon(h.id, h.name)}
                              className="shrink-0 h-8 w-8 text-white rounded-xl shadow-xs"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </Tooltip>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
