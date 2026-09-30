'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldAlert, CheckCircle2, UserPlus } from 'lucide-react';

interface JoinRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: any;
  onSuccess?: () => void;
}

export default function JoinRequestModal({
  open,
  onOpenChange,
  team,
  onSuccess,
}: JoinRequestModalProps) {
  const [formData, setFormData] = useState({
    role: '',
    skills: '',
    technologies: '',
    experience_summary: '',
    relevant_projects: '',
    availability: 'Full-time',
    why_join: '',
    contribution: '',
    message: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill student's profile data
  useEffect(() => {
    if (open) {
      api.get('/profiles/me')
        .then((res) => {
          const profile = res.data?.profile || {};
          setFormData(prev => ({
            ...prev,
            skills: profile.skills || '',
            technologies: profile.technologies || '',
            availability: profile.availability || 'Full-time',
            role: (team?.looking_for_roles?.split(',')[0] || profile.preferred_roles?.split(',')[0] || '').trim(),
          }));
        })
        .catch(() => {});
    }
  }, [open, team]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please agree to the team rules & regulations before submitting.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/requests/', {
        team_id: team.id,
        ...formData,
        preferred_role: formData.role,
      });
      alert('Application submitted successfully! The team leader will review your request.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit join request');
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  const lookingRoles = (team.looking_for_roles || '')
    .split(',')
    .map((r: string) => r.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="text-primary" /> Apply to Join {team.name}
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Hackathon: <strong>{team.hackathon_name}</strong> • Led by {team.leader?.name || 'Leader'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3 text-sm">
          {/* Team requirements summary */}
          {team.requirements && (
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl space-y-1 text-xs text-amber-900">
              <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldAlert size={14} className="text-amber-700" /> Team Rules & Requirements
              </span>
              <p className="leading-relaxed">{team.requirements}</p>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="role" className="font-semibold">Role you are applying for *</Label>
            {lookingRoles.length > 0 ? (
              <div className="space-y-2">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">-- Select a role looking for --</option>
                  {lookingRoles.map((r: string, i: number) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                  <option value="General Contributor">General Contributor</option>
                </select>
              </div>
            ) : (
              <Input
                id="role"
                name="role"
                required
                placeholder="e.g. Backend Developer, AI Specialist"
                value={formData.role}
                onChange={handleChange}
              />
            )}
          </div>

          {/* Skills & Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="skills" className="font-semibold">Relevant Skills *</Label>
              <Input
                id="skills"
                name="skills"
                required
                placeholder="e.g. Python, FastAPI, Docker"
                value={formData.skills}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="availability" className="font-semibold">Availability *</Label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="Full-time">Full-time during hackathon</option>
                <option value="Most of the day">Most of the day</option>
                <option value="Evenings only">Evenings only</option>
                <option value="Weekends">Weekends only</option>
                <option value="Custom">Custom schedule</option>
              </select>
            </div>
          </div>

          {/* Why join */}
          <div className="space-y-1.5">
            <Label htmlFor="why_join" className="font-semibold">Why do you want to join this team? *</Label>
            <textarea
              id="why_join"
              name="why_join"
              rows={2}
              required
              placeholder="Explain why this team's theme or idea interests you..."
              value={formData.why_join}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-white p-3 text-sm shadow-sm"
            />
          </div>

          {/* What can you contribute */}
          <div className="space-y-1.5">
            <Label htmlFor="contribution" className="font-semibold">What can you contribute to the team? *</Label>
            <textarea
              id="contribution"
              name="contribution"
              rows={2}
              required
              placeholder="e.g. I can build the backend APIs, connect MongoDB, and deploy on AWS..."
              value={formData.contribution}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-white p-3 text-sm shadow-sm"
            />
          </div>

          {/* Short personal message */}
          <div className="space-y-1.5">
            <Label htmlFor="message" className="font-semibold">Personal Note / Message (Optional)</Label>
            <Input
              id="message"
              name="message"
              placeholder="Any additional notes or contact preferences"
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="agreement_cb"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="agreement_cb" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
              I have reviewed the team requirements and promise to collaborate actively, respect team rules, and commit to the hackathon.
            </label>
          </div>

          <Button
            type="submit"
            disabled={!agreed || loading}
            className="w-full h-11 text-base font-semibold"
          >
            {loading ? 'Submitting Application...' : 'Send Join Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
