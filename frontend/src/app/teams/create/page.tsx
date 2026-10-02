'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Trophy, CheckCircle2, Users, Sparkles, ShieldAlert } from 'lucide-react';

const COMMON_ROLES = [
  'AI/ML Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'Mobile App Developer',
  'Cloud / DevOps',
  'Hardware / IoT',
  'Research & Documentation'
];

function CreateTeamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledHackathon = searchParams.get('hackathon') || '';

  const [hackathons, setHackathons] = useState<any[]>([]);
  const [isCustom, setIsCustom] = useState(!prefilledHackathon);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_members: 4,
    requirements: '',
    looking_for_roles: '',
    required_skills: '',
    availability_requirements: 'Full-time during hackathon weekend',
    hackathon_name: prefilledHackathon
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    api.get('/hackathons')
      .then((res) => {
        setHackathons(res.data);
        if (prefilledHackathon) {
          setFormData(prev => ({ ...prev, hackathon_name: prefilledHackathon }));
          setIsCustom(false);
        } else if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, hackathon_name: res.data[0].name }));
          setIsCustom(false);
        } else {
          setIsCustom(true);
        }
      })
      .catch(() => {});
  }, [prefilledHackathon, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleRole = (role: string) => {
    let updated: string[];
    if (selectedRoles.includes(role)) {
      updated = selectedRoles.filter(r => r !== role);
    } else {
      updated = [...selectedRoles, role];
    }
    setSelectedRoles(updated);
    setFormData(prev => ({ ...prev, looking_for_roles: updated.join(', ') }));
  };

  const handleHackathonSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustom(true);
      setFormData(prev => ({ ...prev, hackathon_name: '' }));
    } else {
      setIsCustom(false);
      setFormData(prev => ({ ...prev, hackathon_name: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      alert('You must be logged in to create a team.');
      router.push('/login');
      return;
    }

    if (!formData.hackathon_name.trim()) {
      alert('Please select or specify a hackathon name.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/teams/', {
        ...formData,
        max_members: parseInt(formData.max_members.toString()),
        hackathon_name: formData.hackathon_name.trim()
      });
      alert('Team created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Error creating team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-12 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create a Team</h1>
          <p className="text-gray-500 text-sm">Form a new squad and specify what talent you need.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border shadow-sm">
        
        {/* Hackathon Target */}
        <div className="space-y-3 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <Label htmlFor="hackathon_select" className="font-semibold text-blue-950 flex items-center gap-2">
              <Trophy size={16} className="text-primary" /> Target Hackathon *
            </Label>
            {prefilledHackathon && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                <CheckCircle2 size={12} /> Auto-Selected
              </Badge>
            )}
          </div>

          {!prefilledHackathon && hackathons.length > 0 ? (
            <div className="space-y-2">
              <select
                id="hackathon_select"
                value={isCustom ? '__custom__' : formData.hackathon_name}
                onChange={handleHackathonSelect}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name} ({h.mode})
                  </option>
                ))}
                <option value="__custom__">+ Other / Custom Hackathon</option>
              </select>

              {isCustom && (
                <Input
                  name="hackathon_name"
                  required
                  placeholder="Enter custom hackathon name"
                  value={formData.hackathon_name}
                  onChange={handleChange}
                  className="bg-white"
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="hackathon_name"
                name="hackathon_name"
                required
                value={formData.hackathon_name}
                onChange={handleChange}
                placeholder="Hackathon Name"
                className="bg-white font-medium"
              />
            </div>
          )}
        </div>

        {/* Team Basic Info */}
        <div className="space-y-2">
          <Label htmlFor="name">Team Name *</Label>
          <Input 
            id="name" 
            name="name" 
            required 
            onChange={handleChange} 
            value={formData.name} 
            placeholder="e.g. Code Ninjas, Team Phoenix"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Team Project Idea / Description *</Label>
          <textarea
            id="description"
            name="description"
            className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            required
            onChange={handleChange}
            value={formData.description}
            placeholder="Briefly describe the problem you want to solve or project idea..."
          />
        </div>

        {/* Roles Looking For */}
        <div className="space-y-2.5">
          <Label className="font-semibold flex items-center gap-1.5">
            <Users size={16} className="text-primary" /> Roles Looking For (Select all that apply)
          </Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {COMMON_ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isSelected ? `✓ ${role}` : `+ ${role}`}
                </button>
              );
            })}
          </div>
          <Input
            name="looking_for_roles"
            value={formData.looking_for_roles}
            onChange={handleChange}
            placeholder="e.g. AI/ML Developer, UI/UX Designer, Frontend Engineer"
            className="mt-2 text-xs"
          />
        </div>

        {/* Required Skills */}
        <div className="space-y-2">
          <Label htmlFor="required_skills" className="font-semibold flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500" /> Required Skills (Comma Separated)
          </Label>
          <Input 
            id="required_skills" 
            name="required_skills" 
            placeholder="e.g. Python, React, Machine Learning, FastAPI, Figma" 
            onChange={handleChange} 
            value={formData.required_skills} 
          />
          <p className="text-xs text-gray-500">
            These will be factually matched against applicants' verified profiles on your dashboard.
          </p>
        </div>

        {/* Team Rules & Expectations */}
        <div className="space-y-2">
          <Label htmlFor="requirements" className="font-semibold flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-indigo-600" /> Team Requirements & Rules *
          </Label>
          <textarea
            id="requirements" 
            name="requirements" 
            rows={3}
            placeholder="e.g. Looking for someone who can build the ML model and integrate with FastAPI. Must attend daily team standup meetings." 
            required 
            onChange={handleChange} 
            value={formData.requirements} 
            className="flex w-full rounded-md border border-input bg-background p-3 text-sm shadow-sm"
          />
        </div>

        {/* Max Members & Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_members">Max Team Size *</Label>
            <Input 
              id="max_members" 
              name="max_members" 
              type="number" 
              min="2" 
              max="10" 
              required 
              onChange={handleChange} 
              value={formData.max_members} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability_requirements">Expected Availability</Label>
            <Input 
              id="availability_requirements" 
              name="availability_requirements" 
              value={formData.availability_requirements}
              onChange={handleChange}
              placeholder="e.g. Full-time on weekend"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={submitting}>
          {submitting ? 'Creating Team...' : 'Create Team & Open Recruitment'}
        </Button>
      </form>
    </main>
  );
}

export default function CreateTeamPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* SaaS Navbar */}
      <Navbar />

      <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading form...</div>}>
        <CreateTeamForm />
      </Suspense>
    </div>
  );
}
