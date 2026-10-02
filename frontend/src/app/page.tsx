'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import { getCached } from '@/lib/api';
import { 
  Trophy, Users, Sparkles, ShieldCheck, ArrowRight, 
  MessageSquare, UserCheck, Flame, Compass, CheckCircle2, ChevronRight
} from 'lucide-react';

interface StatsSummary {
  total_students: number;
  active_hackathons: number;
  total_teams: number;
  open_teams: number;
  total_participants: number;
}

export default function Home() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCached<StatsSummary>('/stats/summary', undefined, 30000)
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch platform stats', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* SaaS Unified Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-radial from-slate-100/60 to-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-8">
            
            {/* Campus Verified Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-xs text-xs font-semibold text-gray-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Vasavi College of Engineering</span>
              <span className="text-gray-300">•</span>
              <span className="text-primary font-bold">Official Campus Squad Builder</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-gray-950 max-w-4xl mx-auto leading-[1.1]">
              Find Hackathons.{' '}
              <span className="bg-gradient-to-r from-gray-950 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Assemble Squads.
              </span>{' '}
              <span className="text-primary block mt-1">Win Together.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
              HackMate is the dedicated collaboration platform connecting VCE engineers across CSE, IT, ECE, EEE, MECH & CIVIL. Match by technical skill, build balanced rosters, and compete with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-4">
              <Link href="/hackathons" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-7 font-bold rounded-xl shadow-sm gap-2">
                  <Compass size={18} /> Explore Hackathons
                </Button>
              </Link>
              <Link href="/teams" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base h-12 px-7 font-bold rounded-xl border-gray-300 hover:bg-gray-100 gap-2">
                  <Users size={18} /> Find Teams Recruiting <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            {/* Live Campus Metrics Strip */}
            <div className="pt-14 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Active Hackathons</span>
                  {loading ? (
                    <Skeleton className="h-9 w-16 rounded-md my-1" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats?.active_hackathons ?? 0}</span>
                  )}
                  <span className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open for registration
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Recruiting Teams</span>
                  {loading ? (
                    <Skeleton className="h-9 w-16 rounded-md my-1" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats?.open_teams ?? 0}</span>
                  )}
                  <span className="text-[11px] font-medium text-blue-600 mt-1">Actively hiring teammates</span>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Registered Students</span>
                  {loading ? (
                    <Skeleton className="h-9 w-16 rounded-md my-1" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats?.total_students ?? 0}</span>
                  )}
                  <span className="text-[11px] font-medium text-purple-600 mt-1">Verified college peers</span>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Formed Squads</span>
                  {loading ? (
                    <Skeleton className="h-9 w-16 rounded-md my-1" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats?.total_teams ?? 0}</span>
                  )}
                  <span className="text-[11px] font-medium text-amber-600 mt-1">Cross-discipline teams</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-20 border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold tracking-wider uppercase text-primary bg-primary/5 px-3 py-1 rounded-full">
                Designed for Vasavi Hackers
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Everything you need to build winning squads
              </h2>
              <p className="text-gray-500 text-sm sm:text-base">
                Stop scrambling on WhatsApp groups before deadlines. HackMate delivers a structured matching ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-gray-200/70 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Skill-Based Recruitment</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Post detailed team criteria specifying required roles (Frontend, Backend, AI/ML, UI/UX, Pitch Lead) and stack proficiencies.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-gray-200/70 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Dedicated Squad Chat</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Private team chat rooms with instant optimistic delivery, persistent message logs, and member directory.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-gray-200/70 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Automated Team Management</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Review applicant profiles, approve or reject with one click, enforce max-capacity rules, and auto-close applications when full.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Section */}
        <section className="py-20 border-t border-gray-100 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12 text-center">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider uppercase text-gray-500">How It Works</span>
              <h2 className="text-3xl font-extrabold text-gray-900">From zero to registered squad in 3 steps</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h4 className="font-bold text-base text-gray-900">Discover Hackathons</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Browse college and national hackathons with live countdown timers, guidelines, and team size rules.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h4 className="font-bold text-base text-gray-900">Create or Apply to Teams</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Start your own squad as team leader, or send targeted join requests highlighting your key strengths.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h4 className="font-bold text-base text-gray-900">Collaborate & Win</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Communicate in the team chat, plan your tech stack, and submit your project before the deadline.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 font-bold rounded-xl bg-black text-white hover:bg-gray-800 shadow-sm">
                  Join HackMate Now <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* SaaS Footer */}
      <footer className="bg-white border-t border-gray-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">HackMate</span>
            <span>—</span>
            <span>Vasavi College of Engineering, Hyderabad</span>
          </div>
          <div className="flex gap-6">
            <Link href="/hackathons" className="hover:text-gray-900 transition-colors">Hackathons</Link>
            <Link href="/teams" className="hover:text-gray-900 transition-colors">Teams</Link>
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          </div>
          <div>
            © 2026 HackMate. Built for VCE Students.
          </div>
        </div>
      </footer>
    </div>
  );
}
