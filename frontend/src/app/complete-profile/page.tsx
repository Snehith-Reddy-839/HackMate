'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import AvatarPicker from '@/components/AvatarPicker';
import NotificationDropdown from '@/components/NotificationDropdown';
import { 
  User, Code2, Trophy, Clock, Plus, Trash2, CheckCircle2, 
  Sparkles, ShieldCheck, ArrowRight,  Link as LinkIcon, Globe, Phone
} from 'lucide-react';

const PREFERRED_ROLES_OPTIONS = [
  'Frontend',
  'Backend',
  'AI/ML',
  'UI/UX',
  'Research',
  'Hardware',
  'Presentation/Pitch',
  'Documentation',
  'Other'
];

interface HackathonItem {
  name: string;
  year: string;
  role: string;
  result: string;
  project_link: string;
  deployed_url?: string;
}

interface ProjectItem {
  title: string;
  description: string;
  tech: string;
  github: string;
  demo: string;
  deployed_url?: string;
  contribution: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'basic' | 'tech' | 'experience' | 'availability'>('basic');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // User Core State
  const [userState, setUserState] = useState({
    name: '',
    email: '',
    roll_number: '',
    branch: 'CSE',
    year: 2,
    section: 'A',
    avatar: 'animal:panda',
  });

  // Profile Extended State
  const [profileState, setProfileState] = useState({
    bio: '',
    languages: 'Python, TypeScript',
    frameworks: 'React, FastAPI, Next.js',
    tools: 'Git, Docker, Figma',
    skills: 'Python, React, FastAPI, Machine Learning',
    skills_proficiency: {} as Record<string, string>,
    github: '',
    linkedin: '',
    portfolio: '',
    leetcode_link: '',
    certifications: '',
    courses: '',
    experience: '',
    hackathon_experience: 0,
    achievements: '',
    availability: 'Full-time',
    preferred_roles: [] as string[],
    working_style: 'Collaborative & Agile',
    communication_pref: 'Discord',
    phone: '',
    show_phone: false,
  });

  // Dynamic Lists
  const [hackathonsList, setHackathonsList] = useState<HackathonItem[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);

  useEffect(() => {
    api.get('/profiles/me')
      .then((res) => {
        const u = res.data;
        const p = u.profile || {};

        setUserState({
          name: u.name || '',
          email: u.email || '',
          roll_number: u.roll_number || '',
          branch: u.branch || 'CSE',
          year: u.year || 2,
          section: u.section || 'A',
          avatar: u.avatar || p.avatar || 'animal:panda',
        });

        // Parse proficiencies
        let profMap: Record<string, string> = {};
        try {
          if (p.skills_proficiency) {
            profMap = typeof p.skills_proficiency === 'string' ? JSON.parse(p.skills_proficiency) : p.skills_proficiency;
          }
        } catch (e) {}

        // Parse Hackathons
        let hList: HackathonItem[] = [];
        try {
          if (p.hackathons_history) {
            hList = typeof p.hackathons_history === 'string' ? JSON.parse(p.hackathons_history) : p.hackathons_history;
          }
        } catch (e) {}
        setHackathonsList(hList);

        // Parse Projects
        let pList: ProjectItem[] = [];
        try {
          if (p.projects_list) {
            pList = typeof p.projects_list === 'string' ? JSON.parse(p.projects_list) : p.projects_list;
          }
        } catch (e) {}
        setProjectsList(pList);

        // Parse Preferred roles
        const rolesArr = (p.preferred_roles || '')
          .split(',')
          .map((r: string) => r.trim())
          .filter(Boolean);

        setProfileState({
          bio: p.bio || '',
          languages: p.languages || '',
          frameworks: p.frameworks || '',
          tools: p.tools || '',
          skills: p.skills || '',
          skills_proficiency: profMap,
          github: p.github || '',
          linkedin: p.linkedin || '',
          portfolio: p.portfolio || '',
          leetcode_link: p.leetcode_link || '',
          certifications: p.certifications || '',
          courses: p.courses || '',
          experience: p.experience || '',
          hackathon_experience: p.hackathon_experience || hList.length,
          achievements: p.achievements || '',
          availability: p.availability || 'Full-time',
          preferred_roles: rolesArr,
          working_style: p.working_style || 'Collaborative & Agile',
          communication_pref: p.communication_pref || 'Discord',
          phone: p.phone || '',
          show_phone: p.show_phone || false,
        });
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserState(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) || 1 : value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfileState(prev => ({ ...prev, [name]: checked }));
    } else {
      setProfileState(prev => ({ ...prev, [name]: value }));
    }
  };

  const togglePreferredRole = (role: string) => {
    setProfileState(prev => {
      const exists = prev.preferred_roles.includes(role);
      const updated = exists ? prev.preferred_roles.filter(r => r !== role) : [...prev.preferred_roles, role];
      return { ...prev, preferred_roles: updated };
    });
  };

  const setProficiency = (skill: string, level: string) => {
    setProfileState(prev => ({
      ...prev,
      skills_proficiency: {
        ...prev.skills_proficiency,
        [skill.trim()]: level,
      }
    }));
  };

  // Hackathon dynamic helpers
  const addHackathon = () => {
    setHackathonsList(prev => [...prev, { name: '', year: '2026', role: 'Developer', result: 'Finalist', project_link: '' }]);
  };
  const updateHackathon = (index: number, field: keyof HackathonItem, val: string) => {
    setHackathonsList(prev => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };
  const removeHackathon = (index: number) => {
    setHackathonsList(prev => prev.filter((_, i) => i !== index));
  };

  // Projects dynamic helpers
  const addProject = () => {
    setProjectsList(prev => [...prev, { title: '', description: '', tech: '', github: '', demo: '', contribution: '' }]);
  };
  const updateProject = (index: number, field: keyof ProjectItem, val: string) => {
    setProjectsList(prev => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };
  const removeProject = (index: number) => {
    setProjectsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Update Core User
      await api.put('/profiles/me/user', {
        roll_number: userState.roll_number,
        branch: userState.branch,
        year: userState.year,
        section: userState.section,
        avatar: userState.avatar,
      });

      // 2. Update Student Profile
      await api.put('/profiles/me/profile', {
        avatar: userState.avatar,
        bio: profileState.bio,
        languages: profileState.languages,
        frameworks: profileState.frameworks,
        tools: profileState.tools,
        skills: profileState.skills,
        skills_proficiency: JSON.stringify(profileState.skills_proficiency),
        github: profileState.github,
        linkedin: profileState.linkedin,
        portfolio: profileState.portfolio,
        leetcode_link: profileState.leetcode_link,
        certifications: profileState.certifications,
        courses: profileState.courses,
        experience: profileState.experience,
        hackathon_experience: hackathonsList.length || profileState.hackathon_experience,
        hackathons_history: JSON.stringify(hackathonsList),
        projects_list: JSON.stringify(projectsList),
        achievements: profileState.achievements,
        availability: profileState.availability,
        preferred_roles: profileState.preferred_roles.join(', '),
        working_style: profileState.working_style,
        communication_pref: profileState.communication_pref,
        phone: profileState.phone,
        show_phone: profileState.show_phone,
      });

      alert('Profile updated successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Profile...</div>;
  }

  const currentSkillTokens = profileState.skills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-2xl text-primary">HackMate</Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <Link href="/hackathons" className="text-gray-600 hover:text-primary font-medium">Hackathons</Link>
            <Link href="/teams" className="text-gray-600 hover:text-primary font-medium">Teams</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-primary font-medium">Dashboard</Link>
          </nav>
          <NotificationDropdown />
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full space-y-8">
        {/* Top Title & Save Button */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Student Profile & Preferences</h1>
            <p className="text-gray-500 text-sm">Build your verified profile to get discovered and accepted into top teams.</p>
          </div>
          <Button onClick={handleSaveAll} disabled={saving} className="font-bold px-6 h-11">
            {saving ? 'Saving...' : 'Save & Update Profile'}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'basic' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User size={15} /> 1. Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tech' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Code2 size={15} /> 2. Technical Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'experience' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Trophy size={15} /> 3. Hackathons & Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'availability' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock size={15} /> 4. Availability & Style
          </button>
        </div>

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
            <h3 className="text-xl font-bold border-b pb-3">Basic Student Information</h3>

            {/* Avatar Picker Hero */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <AvatarDisplay avatar={userState.avatar} seed={userState.email || userState.name} size="2xl" />
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="font-bold text-gray-900 text-lg">Profile Avatar</h4>
                <p className="text-xs text-gray-500 max-w-md">
                  Assigned your deterministic cute animal avatar. You can customize your animal or upload your own profile photo anytime!
                </p>
                <div className="pt-1">
                  <AvatarPicker
                    currentAvatar={userState.avatar}
                    onSelect={(newAvatar) => setUserState(prev => ({ ...prev, avatar: newAvatar }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" value={userState.name} disabled className="bg-gray-50 text-gray-700" />
                <span className="text-[10px] text-gray-400">Authenticated via College Google Account</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">College Email *</Label>
                <Input id="email" name="email" value={userState.email} disabled className="bg-gray-50 text-gray-700" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="roll_number">Roll Number *</Label>
                <Input id="roll_number" name="roll_number" required value={userState.roll_number} onChange={handleUserChange} placeholder="1602-21-733-xxx" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch *</Label>
                <select id="branch" name="branch" value={userState.branch} onChange={handleUserChange} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm">
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="AIML">AI/ML</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Year *</Label>
                <select id="year" name="year" value={userState.year} onChange={handleUserChange} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm">
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="section">Section</Label>
                <Input id="section" name="section" value={userState.section} onChange={handleUserChange} placeholder="e.g. A, B, C" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Short Bio (1-2 lines)</Label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={profileState.bio}
                onChange={handleProfileChange}
                placeholder="Passionate about building full-stack web applications and machine learning prototypes..."
                className="flex w-full rounded-md border border-input bg-white p-3 text-sm shadow-sm"
              />
            </div>

            {/* Privacy Phone Section */}
            <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="font-semibold flex items-center gap-1.5 text-xs text-gray-700">
                  <Phone size={14} /> Contact Phone Number (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_phone"
                    name="show_phone"
                    checked={profileState.show_phone}
                    onChange={handleProfileChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="show_phone" className="text-xs text-gray-600 font-normal cursor-pointer">
                    Share phone with team members
                  </Label>
                </div>
              </div>
              <Input
                id="phone"
                name="phone"
                value={profileState.phone}
                onChange={handleProfileChange}
                placeholder="+91 9876543210"
                className="bg-white text-xs"
              />
              <p className="text-[11px] text-gray-400">
                🔒 Privacy guarantee: Your phone number is never shown publicly unless you explicitly enable sharing above.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={() => setActiveTab('tech')} className="gap-2">
                Next: Technical Profile <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL PROFILE */}
        {activeTab === 'tech' && (
          <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
            <h3 className="text-xl font-bold border-b pb-3">Technical Profile & Skills</h3>

            <div className="space-y-1.5">
              <Label htmlFor="skills" className="font-semibold">Core Skills & Technologies (Comma-Separated) *</Label>
              <Input
                id="skills"
                name="skills"
                value={profileState.skills}
                onChange={handleProfileChange}
                placeholder="Python, React, FastAPI, Machine Learning, Docker, Figma"
              />
              <p className="text-xs text-gray-500">These will be matched with team requirements.</p>
            </div>

            {/* Proficiency Matrix */}
            {currentSkillTokens.length > 0 && (
              <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500 block">
                  Skill Proficiency Matrix
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentSkillTokens.map((skill, i) => {
                    const currentLvl = profileState.skills_proficiency[skill] || 'Intermediate';
                    return (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border text-xs">
                        <span className="font-semibold text-gray-800">{skill}</span>
                        <div className="flex gap-1">
                          {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setProficiency(skill, lvl)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                currentLvl === lvl
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Languages, Frameworks, Tools breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="languages">Programming Languages</Label>
                <Input id="languages" name="languages" value={profileState.languages} onChange={handleProfileChange} placeholder="Python, C++, Java, JS" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="frameworks">Frameworks & Libs</Label>
                <Input id="frameworks" name="frameworks" value={profileState.frameworks} onChange={handleProfileChange} placeholder="React, Node, PyTorch" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tools">Tools & Cloud</Label>
                <Input id="tools" name="tools" value={profileState.tools} onChange={handleProfileChange} placeholder="Docker, Git, AWS, Figma" />
              </div>
            </div>

            {/* Preferred Roles Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <Label className="font-semibold block">Preferred Team Roles</Label>
              <div className="flex flex-wrap gap-2">
                {PREFERRED_ROLES_OPTIONS.map((role) => {
                  const isSelected = profileState.preferred_roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => togglePreferredRole(role)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected ? `✓ ${role}` : `+ ${role}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social & Portfolio URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="github" className="flex items-center gap-1.5 text-xs"><Code2 size={14}/> GitHub URL</Label>
                <Input id="github" name="github" value={profileState.github} onChange={handleProfileChange} placeholder="https://github.com/username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin" className="flex items-center gap-1.5 text-xs"><LinkIcon size={14}/> LinkedIn URL</Label>
                <Input id="linkedin" name="linkedin" value={profileState.linkedin} onChange={handleProfileChange} placeholder="https://linkedin.com/in/username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leetcode_link" className="flex items-center gap-1.5 text-xs"><Code2 size={14}/> LeetCode Profile</Label>
                <Input id="leetcode_link" name="leetcode_link" value={profileState.leetcode_link} onChange={handleProfileChange} placeholder="https://leetcode.com/u/username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="portfolio" className="flex items-center gap-1.5 text-xs"><Globe size={14}/> Portfolio / Website</Label>
                <Input id="portfolio" name="portfolio" value={profileState.portfolio} onChange={handleProfileChange} placeholder="https://myportfolio.dev" />
              </div>
            </div>

            {/* Certifications & Relevant Courses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="certifications">Certifications (Optional)</Label>
                <Input id="certifications" name="certifications" value={profileState.certifications} onChange={handleProfileChange} placeholder="AWS Certified, Deep Learning Specialization" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="courses">Relevant Coursework</Label>
                <Input id="courses" name="courses" value={profileState.courses} onChange={handleProfileChange} placeholder="Data Structures, DBMS, Machine Learning" />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>Back</Button>
              <Button type="button" onClick={() => setActiveTab('experience')} className="gap-2">
                Next: Hackathons & Projects <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: HACKATHONS & PROJECTS */}
        {activeTab === 'experience' && (
          <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-8">
            {/* Hackathons History */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy size={20} className="text-amber-500" /> Previous Hackathons Attended
                  </h3>
                  <p className="text-xs text-gray-500">Showcase your track record in hackathons.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addHackathon} className="gap-1.5 text-xs font-semibold">
                  <Plus size={14} /> Add Hackathon
                </Button>
              </div>

              {hackathonsList.map((h, idx) => (
                <div key={idx} className="p-4 rounded-xl border bg-gray-50/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-gray-500">Hackathon #{idx + 1}</span>
                    <button type="button" onClick={() => removeHackathon(idx)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Hackathon Name *</Label>
                      <Input value={h.name} onChange={(e) => updateHackathon(idx, 'name', e.target.value)} placeholder="e.g. Smart India Hackathon" className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Year</Label>
                      <Input value={h.year} onChange={(e) => updateHackathon(idx, 'year', e.target.value)} placeholder="2025" className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Role in Team</Label>
                      <Input value={h.role} onChange={(e) => updateHackathon(idx, 'role', e.target.value)} placeholder="e.g. ML Lead, Backend" className="bg-white text-xs mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Result / Achievement</Label>
                      <Input value={h.result} onChange={(e) => updateHackathon(idx, 'result', e.target.value)} placeholder="e.g. Winner, Top 5 Finalist, Completed" className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Project Repository / Code Link (Optional)</Label>
                      <Input value={h.project_link} onChange={(e) => updateHackathon(idx, 'project_link', e.target.value)} placeholder="https://github.com/..." className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Deployed Website URL (Optional)</Label>
                      <Input value={h.deployed_url || ''} onChange={(e) => updateHackathon(idx, 'deployed_url', e.target.value)} placeholder="https://myhackathonapp.vercel.app" className="bg-white text-xs mt-1" />
                    </div>
                  </div>
                </div>
              ))}

              {hackathonsList.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-500">
                  No hackathons added yet. If you are a beginner, that's completely fine!
                </div>
              )}
            </div>

            {/* Projects Showcase */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-indigo-600" /> Featured Projects
                  </h3>
                  <p className="text-xs text-gray-500">Highlight your personal, academic, or open-source projects.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addProject} className="gap-1.5 text-xs font-semibold">
                  <Plus size={14} /> Add Project
                </Button>
              </div>

              {projectsList.map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl border bg-gray-50/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-gray-500">Project #{idx + 1}</span>
                    <button type="button" onClick={() => removeProject(idx)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Project Title *</Label>
                      <Input value={p.title} onChange={(e) => updateProject(idx, 'title', e.target.value)} placeholder="e.g. HemoScan AI" className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Technologies Used</Label>
                      <Input value={p.tech} onChange={(e) => updateProject(idx, 'tech', e.target.value)} placeholder="React, Python, FastAPI, TensorFlow" className="bg-white text-xs mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Short Description</Label>
                    <textarea
                      value={p.description}
                      onChange={(e) => updateProject(idx, 'description', e.target.value)}
                      rows={2}
                      placeholder="Brief overview of what this project accomplishes..."
                      className="flex w-full rounded-md border border-input bg-white p-2.5 text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">GitHub Repository (Optional)</Label>
                      <Input value={p.github} onChange={(e) => updateProject(idx, 'github', e.target.value)} placeholder="https://github.com/..." className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Deployed Website URL (Optional)</Label>
                      <Input value={p.demo} onChange={(e) => updateProject(idx, 'demo', e.target.value)} placeholder="https://myproject.vercel.app" className="bg-white text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Your Contribution</Label>
                      <Input value={p.contribution} onChange={(e) => updateProject(idx, 'contribution', e.target.value)} placeholder="Built backend API & model" className="bg-white text-xs mt-1" />
                    </div>
                  </div>
                </div>
              ))}

              {projectsList.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-500">
                  No projects added yet. Click "Add Project" to showcase your work.
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="space-y-1.5">
              <Label htmlFor="achievements" className="font-semibold">Achievements & Open-Source Contributions</Label>
              <textarea
                id="achievements"
                name="achievements"
                rows={2}
                value={profileState.achievements}
                onChange={handleProfileChange}
                placeholder="e.g. 500+ problems solved on LeetCode, Contributor to LangChain, College Coding Contest Winner"
                className="flex w-full rounded-md border border-input bg-white p-3 text-xs shadow-sm"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab('tech')}>Back</Button>
              <Button type="button" onClick={() => setActiveTab('availability')} className="gap-2">
                Next: Availability & Style <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* TAB 4: AVAILABILITY & WORKING STYLE */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
            <h3 className="text-xl font-bold border-b pb-3">Availability & Team Preferences</h3>

            <div className="space-y-1.5">
              <Label htmlFor="availability" className="font-semibold">Availability During Hackathons *</Label>
              <select
                id="availability"
                name="availability"
                value={profileState.availability}
                onChange={handleProfileChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="Full-time">Full-time (Available entire hackathon weekend)</option>
                <option value="Most of the day">Most of the day (10+ hours/day)</option>
                <option value="Evenings only">Evenings only (After college classes)</option>
                <option value="Weekends">Weekends only</option>
                <option value="Custom">Custom / Flexible</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="working_style">Preferred Working Style</Label>
                <select
                  id="working_style"
                  name="working_style"
                  value={profileState.working_style}
                  onChange={handleProfileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="Collaborative & Agile">Collaborative & Agile (Daily syncs)</option>
                  <option value="Autonomous & Async">Autonomous & Async (Task-focused)</option>
                  <option value="Pair Programming">Pair Programming (Hands-on together)</option>
                  <option value="Fast-paced & Intense">Fast-paced & Intense sprint</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="communication_pref">Preferred Communication</Label>
                <select
                  id="communication_pref"
                  name="communication_pref"
                  value={profileState.communication_pref}
                  onChange={handleProfileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="Discord">Discord (Voice & Channels)</option>
                  <option value="WhatsApp">WhatsApp (Fast texting)</option>
                  <option value="Slack">Slack / Google Meet</option>
                  <option value="In-person">In-person on Campus</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="experience">General Team Experience / Notes</Label>
              <textarea
                id="experience"
                name="experience"
                rows={3}
                value={profileState.experience}
                onChange={handleProfileChange}
                placeholder="Worked with 3 teams in college clubs, comfortable managing git merges and coordinating features..."
                className="flex w-full rounded-md border border-input bg-white p-3 text-xs shadow-sm"
              />
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveTab('experience')}>Back</Button>
              <Button type="button" onClick={handleSaveAll} disabled={saving} className="font-bold px-8 h-11 text-base">
                {saving ? 'Saving...' : 'Save & Finalize Profile'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
