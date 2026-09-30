'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { 
  Calendar, Users, MapPin, PlusCircle, ArrowRight, ShieldCheck, 
  Clock, ChevronDown, ChevronUp, Trash2, Sparkles, Archive, AlertCircle
} from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClosedDropdown, setShowClosedDropdown] = useState(false);

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
      const res = await api.get('/hackathons');
      setHackathons(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHackathons();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      api.get('/profiles/me')
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
      fetchHackathons();
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
      alert(`Hackathon "${name}" was successfully deleted.`);
      fetchHackathons();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete hackathon');
    }
  };

  // Separate active hackathons from closed / completed hackathons
  const activeHackathons = hackathons.filter(h => h.status === 'Registration Open');
  const closedHackathons = hackathons.filter(h => h.status === 'Registration Closed' || h.status === 'Completed');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-2xl text-primary">HackMate</Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6">
            <Link href="/hackathons" className="text-primary font-medium">Hackathons</Link>
            <Link href="/teams" className="text-gray-600 hover:text-primary font-medium">Teams</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-primary font-medium">Dashboard</Link>
            {isAdmin && (
              <Link href="/admin" className="text-amber-600 font-bold hover:text-amber-700">Admin Dashboard</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-12">
        {/* Top Header & Admin Add Action */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Vasavi College Events
              </span>
              {isAdmin && (
                <span className="text-xs uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Admin Controls Enabled
                </span>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Explore Hackathons</h1>
            <p className="text-gray-500 text-base mt-1">Discover active hackathons, form teams, and review past achievements.</p>
          </div>

          {isAdmin && (
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-5 py-2">
                <PlusCircle size={18} className="mr-2" /> Add Hackathon (Admin)
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

        {/* ================= SECTION 1: ACTIVE / REGISTRATION OPEN HACKATHONS ================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-emerald-600" size={22} /> 
              Active Hackathons 
              <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold ml-1">
                {activeHackathons.length} Open
              </Badge>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeHackathons.map((h) => (
              <Card key={h.id} className="flex flex-col border-emerald-100/80 bg-white hover:shadow-lg transition-all rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      Registration Open
                    </Badge>
                    <Badge variant="outline">{h.mode}</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 line-clamp-1">{h.name}</CardTitle>
                  <div className="text-xs text-gray-500 font-medium">Organized by <strong className="text-gray-700">{h.organizer}</strong></div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-2">{h.description}</p>
                  
                  {/* Live Metrics */}
                  <div className="flex gap-2 items-center flex-wrap pt-1">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs">
                      <Users size={13} className="mr-1" /> {h.teams_count || 0} Teams Registered
                    </Badge>
                    <Badge variant="outline" className="text-gray-600 text-xs">
                      {h.participants_count || 0} Students
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs pt-2 border-t text-gray-600 bg-gray-50/70 p-3 rounded-xl border">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <Clock size={14} /> 
                      <span>Reg. Deadline: {format(new Date(h.registration_deadline), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={14} /> <span>Event Date: {format(new Date(h.event_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={14} /> <span>Team Size: {h.team_size_min}-{h.team_size_max} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} /> <span>{h.location}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-3 border-t bg-gray-50/50 p-4">
                  <Link href={`/hackathons/${h.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-xs font-semibold">
                      Details <ArrowRight size={13} />
                    </Button>
                  </Link>
                  <Link href={`/teams?hackathon=${encodeURIComponent(h.name)}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs font-semibold">
                      Find Teams
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteHackathon(h.id, h.name)}
                      className="shrink-0 h-9 w-9 text-white shadow-xs"
                      title="Delete Hackathon (Admin)"
                    >
                      <Trash2 size={15} />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}

            {activeHackathons.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed p-8">
                <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
                <h3 className="font-bold text-gray-800 text-lg">No Active Hackathons Open for Registration</h3>
                <p className="text-sm text-gray-500 mt-1">Check the Past & Closed Hackathons dropdown below to see past events.</p>
              </div>
            )}
          </div>
        </section>

        {/* ================= SECTION 2: PAST / CLOSED HACKATHONS (COLLAPSIBLE DROPDOWN) ================= */}
        <section className="bg-white rounded-2xl border shadow-xs overflow-hidden">
          {/* Dropdown / Accordion Trigger Header */}
          <button
            onClick={() => setShowClosedDropdown(prev => !prev)}
            className="w-full px-6 py-5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                <Archive size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Past & Closed Hackathons
                  <Badge variant="secondary" className="bg-slate-200 text-slate-800 text-xs font-bold">
                    {closedHackathons.length}
                  </Badge>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click to {showClosedDropdown ? 'collapse' : 'view'} archived events, past deadlines, and previous teams.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span>{showClosedDropdown ? 'Hide Archived Events' : 'Show Archived Events'}</span>
              {showClosedDropdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {/* Collapsible Content */}
          {showClosedDropdown && (
            <div className="p-6 bg-slate-50/40 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {closedHackathons.map((h) => {
                  const isCompleted = h.status === 'Completed';
                  return (
                    <Card key={h.id} className="flex flex-col bg-white border-slate-200 hover:shadow-md transition-shadow rounded-2xl overflow-hidden opacity-95">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge 
                            className={
                              isCompleted
                                ? 'bg-slate-700 hover:bg-slate-800 text-white font-semibold'
                                : 'bg-amber-500 hover:bg-amber-600 text-white font-semibold'
                            }
                          >
                            {h.status}
                          </Badge>
                          <Badge variant="outline">{h.mode}</Badge>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-800 line-clamp-1">{h.name}</CardTitle>
                        <div className="text-xs text-gray-500 font-medium">Organized by {h.organizer}</div>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                        <p className="text-gray-500 text-xs line-clamp-2">{h.description}</p>
                        
                        {/* Metrics */}
                        <div className="flex gap-2 items-center text-xs">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                            {h.teams_count || 0} Teams
                          </Badge>
                          <Badge variant="outline" className="text-gray-500">
                            {h.participants_count || 0} Students
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border">
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock size={13} />
                            <span>Deadline Passed: {format(new Date(h.registration_deadline), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            <span>Event: {format(new Date(h.event_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} />
                            <span>{h.location}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2 pt-3 border-t bg-gray-50/50 p-4">
                        <Link href={`/hackathons/${h.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                            View Event History
                          </Button>
                        </Link>
                        <Link href={`/teams?hackathon=${encodeURIComponent(h.name)}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full text-xs font-semibold">
                            View Teams
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteHackathon(h.id, h.name)}
                            className="shrink-0 h-9 w-9 text-white shadow-xs"
                            title="Delete Hackathon (Admin)"
                          >
                            <Trash2 size={15} />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}

                {closedHackathons.length === 0 && (
                  <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                    No closed or past hackathons yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
