'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from './AvatarDisplay';
import { 
  CheckCircle2, Circle, ExternalLink,  Link as LinkIcon, Code2, Globe, 
  Trophy, Briefcase, Sparkles, Clock, MessageSquare, HeartHandshake, FileText
} from 'lucide-react';

interface FullApplicantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  team: any;
}

export default function FullApplicantProfileModal({
  open,
  onOpenChange,
  request,
  team,
}: FullApplicantProfileModalProps) {
  if (!request) return null;

  const student = request.student || {};
  const profile = student.profile || {};

  // Parse JSON data safely
  let skillsProficiency: Record<string, string> = {};
  try {
    if (profile.skills_proficiency) {
      skillsProficiency = typeof profile.skills_proficiency === 'string' 
        ? JSON.parse(profile.skills_proficiency) 
        : profile.skills_proficiency;
    }
  } catch (e) {}

  let projectsList: any[] = [];
  try {
    if (profile.projects_list) {
      projectsList = typeof profile.projects_list === 'string'
        ? JSON.parse(profile.projects_list)
        : profile.projects_list;
    }
  } catch (e) {}

  let hackathonsHistory: any[] = [];
  try {
    if (profile.hackathons_history) {
      hackathonsHistory = typeof profile.hackathons_history === 'string'
        ? JSON.parse(profile.hackathons_history)
        : profile.hackathons_history;
    }
  } catch (e) {}

  // Requirement Matching logic (Factual Checklist only)
  const teamSkillsList = (team.required_skills || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const studentAllSkills = [
    profile.skills || '',
    profile.technologies || '',
    profile.languages || '',
    profile.frameworks || '',
    profile.tools || '',
    request.skills || '',
    request.technologies || ''
  ].join(',').toLowerCase();

  const requirementMatches = teamSkillsList.map((reqSkill: string) => {
    const isMatched = studentAllSkills.includes(reqSkill.toLowerCase());
    return {
      skill: reqSkill,
      matched: isMatched,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <AvatarDisplay
                avatar={student.avatar || profile.avatar}
                seed={student.email || student.name}
                size="xl"
                className="border-4 border-white/20 shadow-lg"
              />
              <div className="space-y-1">
                <DialogTitle className="text-2xl sm:text-3xl text-white font-bold">
                  {student.name}
                </DialogTitle>
                <div className="text-blue-100 text-sm font-medium">
                  {student.branch || 'Engineering'} • Year {student.year || 1} • Section {student.section || 'A'}
                </div>
                <div className="text-xs text-blue-200">
                  {student.email} {profile.show_phone && profile.phone ? `• ${profile.phone}` : ''}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Factual Requirement Match Checklist */}
          {teamSkillsList.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" /> Team Requirement Matching
                </h3>
                <span className="text-xs text-blue-700 font-medium">Factual Profile Check</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {requirementMatches.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border ${
                      item.matched
                        ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {item.matched ? (
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Circle size={14} className="text-gray-400 shrink-0" />
                    )}
                    <span>
                      {item.skill} {item.matched ? '(Listed in Profile)' : '(Not listed)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Submission Specifics */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-primary" /> Application Submission Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
              <div>
                <span className="text-xs text-gray-500 block">Applied Role</span>
                <span className="font-semibold text-gray-900">{request.role || request.preferred_role || 'General Member'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Availability for Hackathon</span>
                <span className="font-semibold text-gray-900">{request.availability || profile.availability || 'Full-time'}</span>
              </div>
            </div>

            {request.message && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">Message to Team Leader</span>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-xl border italic">
                  "{request.message}"
                </p>
              </div>
            )}

            {request.why_join && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                  <HeartHandshake size={14} /> Why they want to join
                </span>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border">
                  {request.why_join}
                </p>
              </div>
            )}

            {request.contribution && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                  <Sparkles size={14} /> Proposed Contribution
                </span>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border">
                  {request.contribution}
                </p>
              </div>
            )}
          </div>

          {/* Technical Profile & Skills */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Code2 size={16} className="text-primary" /> Technical Profile & Proficiencies
            </h3>

            {profile.bio && (
              <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
            )}

            {/* Skills & Proficiency Badges */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase block">Skills</span>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || profile.technologies || request.skills || '')
                  .split(',')
                  .map((s: string, i: number) => {
                    const trimmed = s.trim();
                    if (!trimmed) return null;
                    const prof = skillsProficiency[trimmed];
                    return (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="py-1 px-2.5 text-xs font-medium flex items-center gap-1.5"
                      >
                        {trimmed}
                        {prof && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            prof === 'Advanced'
                              ? 'bg-purple-100 text-purple-800'
                              : prof === 'Intermediate'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {prof}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
              </div>
            </div>

            {/* Languages, Frameworks, Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              {profile.languages && (
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="font-semibold text-gray-500 block mb-1">Languages</span>
                  <span className="text-gray-800">{profile.languages}</span>
                </div>
              )}
              {profile.frameworks && (
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="font-semibold text-gray-500 block mb-1">Frameworks</span>
                  <span className="text-gray-800">{profile.frameworks}</span>
                </div>
              )}
              {profile.tools && (
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="font-semibold text-gray-500 block mb-1">Tools & Platforms</span>
                  <span className="text-gray-800">{profile.tools}</span>
                </div>
              )}
            </div>

            {/* Social / Portfolio Links */}
            <div className="pt-2 flex flex-wrap gap-3">
              {(request.github || profile.github) && (
                <a
                  href={request.github || profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Code2 size={14} /> GitHub Profile <ExternalLink size={12} />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <LinkIcon size={14} /> LinkedIn <ExternalLink size={12} />
                </a>
              )}
              {profile.leetcode_link && (
                <a
                  href={profile.leetcode_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Code2 size={14} /> LeetCode <ExternalLink size={12} />
                </a>
              )}
              {(request.portfolio || profile.portfolio) && (
                <a
                  href={request.portfolio || profile.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Globe size={14} /> Portfolio Website <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Hackathons & Experience */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" /> Hackathon History & Experience
            </h3>

            {hackathonsHistory.length > 0 ? (
              <div className="space-y-3">
                {hackathonsHistory.map((h: any, i: number) => (
                  <div key={i} className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{h.name}</span>
                      <Badge variant="outline" className="bg-white text-amber-800">{h.year || 'Past'}</Badge>
                    </div>
                    <div className="text-gray-600">
                      <strong>Role:</strong> {h.role || 'Participant'} • <strong>Result:</strong> {h.result || 'Completed'}
                    </div>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {h.project_link && (
                        <a href={h.project_link} target="_blank" rel="noreferrer" className="text-gray-700 hover:underline flex items-center gap-1">
                          <Code2 size={11} /> Code Repo <ExternalLink size={10} />
                        </a>
                      )}
                      {h.deployed_url && (
                        <a href={h.deployed_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-medium hover:underline flex items-center gap-1">
                          <Globe size={11} /> Deployed Website <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {profile.hackathon_experience ? `${profile.hackathon_experience} previous hackathons attended` : 'No past hackathons listed'}
              </p>
            )}

            {profile.experience && (
              <div className="bg-gray-50 p-3 rounded-xl border text-xs text-gray-700">
                <span className="font-semibold block mb-1">General Experience:</span>
                {profile.experience}
              </div>
            )}
          </div>

          {/* Projects Showcase */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-600" /> Projects Showcase
            </h3>

            {projectsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectsList.map((p: any, i: number) => (
                  <div key={i} className="bg-gray-50 border p-4 rounded-xl space-y-2 text-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{p.title || p.name}</h4>
                      <p className="text-gray-600 mt-1 line-clamp-3">{p.description}</p>
                      {p.tech && <Badge variant="outline" className="mt-2 text-[10px]">{p.tech}</Badge>}
                      {p.contribution && (
                        <p className="text-gray-500 mt-2 italic"><strong>Contribution:</strong> {p.contribution}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2 border-t mt-2">
                      {p.github && (
                        <a href={p.github} target="_blank" rel="noreferrer" className="text-gray-700 hover:underline flex items-center gap-1">
                          <Code2 size={12} /> Code Repo <ExternalLink size={10} />
                        </a>
                      )}
                      {(p.demo || p.deployed_url) && (
                        <a href={p.demo || p.deployed_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-medium hover:underline flex items-center gap-1">
                          <Globe size={12} /> Deployed Website <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : profile.projects ? (
              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border">{profile.projects}</p>
            ) : (
              <p className="text-xs text-gray-500 italic">No projects listed</p>
            )}
          </div>

          {/* Working Style & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-4 rounded-xl border space-y-1">
              <span className="font-semibold text-gray-500 uppercase block">Working Style</span>
              <p className="text-gray-800 font-medium">{profile.working_style || 'Collaborative & Flexible'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border space-y-1">
              <span className="font-semibold text-gray-500 uppercase block">Communication Platform</span>
              <p className="text-gray-800 font-medium">{profile.communication_pref || 'Discord / WhatsApp'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
