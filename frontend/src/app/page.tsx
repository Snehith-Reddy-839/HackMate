'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AuthButtons from '@/components/AuthButtons';
import { api } from '@/lib/api';

interface StatsSummary {
  total_students: number;
  active_hackathons: number;
  total_teams: number;
  open_teams: number;
  total_participants: number;
}

export default function Home() {
  const [stats, setStats] = useState<StatsSummary>({
    total_students: 0,
    active_hackathons: 0,
    total_teams: 0,
    open_teams: 0,
    total_participants: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/summary');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch platform stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="font-bold text-2xl text-primary">HackMate</div>
        <nav className="hidden md:flex gap-6">
          <Link href="/hackathons" className="text-gray-600 hover:text-primary font-medium">Hackathons</Link>
          <Link href="/teams" className="text-gray-600 hover:text-primary font-medium">Teams</Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-primary font-medium">Dashboard</Link>
        </nav>
        <AuthButtons />
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            Find Hackathons.<br/>
            Find Teammates.<br/>
            <span className="text-primary">Build Together.</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The exclusive team-building platform for Vasavi College students. 
            Connect with peers, form perfect teams, and win hackathons.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/hackathons">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8">
                Explore Hackathons
              </Button>
            </Link>
            <Link href="/teams">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
                Find a Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Dynamic Stats (Accurate Data) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-5xl w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <div className="text-4xl font-bold text-primary mb-2">{stats.active_hackathons}</div>
            <div className="text-gray-600 font-medium">Active Hackathons</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <div className="text-4xl font-bold text-primary mb-2">{stats.open_teams}</div>
            <div className="text-gray-600 font-medium">Teams Recruiting</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <div className="text-4xl font-bold text-primary mb-2">{stats.total_students}</div>
            <div className="text-gray-600 font-medium">Registered Students</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <div className="text-4xl font-bold text-primary mb-2">{stats.total_teams}</div>
            <div className="text-gray-600 font-medium">Teams Formed</div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white py-8 text-center text-gray-500 border-t">
        <p>© 2026 HackMate for Vasavi College of Engineering. All rights reserved.</p>
      </footer>
    </div>
  );
}
