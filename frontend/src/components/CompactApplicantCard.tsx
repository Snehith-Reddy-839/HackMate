'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from './AvatarDisplay';
import FullApplicantProfileModal from './FullApplicantProfileModal';
import { 
  Check, X, Eye, Trophy, Rocket, Clock,  Link as LinkIcon, Globe, CheckCircle2, Circle, Code2 
} from 'lucide-react';

interface CompactApplicantCardProps {
  request: any;
  team: any;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
  isActionable?: boolean;
}

export default function CompactApplicantCard({
  request,
  team,
  onAccept,
  onReject,
  isActionable = true,
}: CompactApplicantCardProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const student = request.student || {};
  const profile = student.profile || {};

  // Count projects
  let projectCount = 0;
  try {
    if (profile.projects_list) {
      const parsed = typeof profile.projects_list === 'string' ? JSON.parse(profile.projects_list) : profile.projects_list;
      projectCount = Array.isArray(parsed) ? parsed.length : 0;
    } else if (profile.projects) {
      projectCount = profile.projects.split(',').length;
    }
  } catch (e) {}

  // Count hackathons
  let hackathonCount = profile.hackathon_experience || 0;
  try {
    if (profile.hackathons_history) {
      const parsed = typeof profile.hackathons_history === 'string' ? JSON.parse(profile.hackathons_history) : profile.hackathons_history;
      if (Array.isArray(parsed) && parsed.length > 0) {
        hackathonCount = parsed.length;
      }
    }
  } catch (e) {}

  // Requirement matching
  const teamSkillsList = (team?.required_skills || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const studentAllSkills = [
    profile.skills || '',
    profile.technologies || '',
    profile.languages || '',
    request.skills || '',
    request.technologies || ''
  ].join(',').toLowerCase();

  const skillsToDisplay = (request.skills || profile.skills || profile.technologies || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  const appliedRole = request.role || request.preferred_role || 'General Role';

  return (
    <>
      <Card className="flex flex-col justify-between hover:shadow-md transition-all border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start gap-3.5">
            <AvatarDisplay
              avatar={student.avatar || profile.avatar}
              seed={student.email || student.name}
              name={student.name}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-lg text-gray-900 truncate">{student.name}</h4>
                <Badge variant={request.status === 'ACCEPTED' ? 'default' : request.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                  {request.status.toLowerCase()}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {student.branch || 'CSE'} • Year {student.year || 2} • {student.section || 'A'}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-medium">Applying for:</span>
                <Badge variant="outline" className="bg-blue-50/70 text-blue-800 border-blue-200 font-semibold py-0.5">
                  {appliedRole}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 py-2 space-y-3 flex-1 text-xs">
          {/* Key Skills */}
          {skillsToDisplay.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillsToDisplay.map((s: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-[11px] font-normal py-0.5 bg-gray-100 text-gray-700">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Factual Requirement Checklist Preview */}
          {teamSkillsList.length > 0 && (
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Requirement Check
              </span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {teamSkillsList.map((reqSkill: string, i: number) => {
                  const isMatch = studentAllSkills.includes(reqSkill.toLowerCase());
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 font-medium ${
                        isMatch ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {isMatch ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Circle size={12} />}
                      {reqSkill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Experience & Stats Row */}
          <div className="flex items-center justify-between gap-2 py-1 border-t border-b border-gray-100 text-gray-600">
            <div className="flex items-center gap-1 font-semibold text-gray-800">
              <Trophy size={13} className="text-amber-500" />
              <span>{hackathonCount} Hackathons</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-gray-800">
              <Rocket size={13} className="text-indigo-500" />
              <span>{projectCount} Projects</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock size={13} />
              <span>{request.availability || profile.availability || 'Full-time'}</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 pt-0.5 text-gray-600">
            {(request.github || profile.github) && (
              <a href={request.github || profile.github} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
                <Code2 size={13} /> GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
                <LinkIcon size={13} /> LinkedIn
              </a>
            )}
            {profile.leetcode_link && (
              <a href={profile.leetcode_link} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
                <Code2 size={13} /> LeetCode
              </a>
            )}
            {(request.portfolio || profile.portfolio) && (
              <a href={request.portfolio || profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
                <Globe size={13} /> Portfolio
              </a>
            )}
          </div>

          {/* Application message snippet */}
          {(request.message || request.why_join) && (
            <p className="text-gray-600 italic bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 line-clamp-2">
              "{request.message || request.why_join}"
            </p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-3 flex flex-col gap-2 border-t bg-gray-50/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 h-8 text-xs font-semibold"
            onClick={() => setProfileOpen(true)}
          >
            <Eye size={14} /> View Full Profile
          </Button>

          {isActionable && request.status === 'PENDING' && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs font-semibold"
                onClick={() => onReject(request.id)}
              >
                <X size={14} className="mr-1" /> Reject
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                onClick={() => onAccept(request.id)}
              >
                <Check size={14} className="mr-1" /> Accept
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <FullApplicantProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        request={request}
        team={team}
      />
    </>
  );
}
