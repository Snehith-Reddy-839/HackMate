'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AvatarDisplay from '@/components/AvatarDisplay';
import NotificationDropdown from '@/components/NotificationDropdown';
import { api, getCached, invalidateCache } from '@/lib/api';
import { 
  Menu, X, Home, Users, Trophy, ShieldCheck, LogOut, 
  LogIn, UserPlus, Sparkles, User, ExternalLink
} from 'lucide-react';

interface NavbarProps {
  hideAuth?: boolean;
}

export default function Navbar({ hideAuth = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && status !== 'authenticated') {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Use cached user profile fetch to avoid redundant network calls
    getCached('/profiles/me', undefined, 20000)
      .then((res) => {
        setUser(res.data);
        if (String(res.data?.role).toLowerCase() === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        // Token might be invalid or expired
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [status]);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    invalidateCache();
    if (session) {
      await signOut({ redirect: false });
    }
    setUser(null);
    setIsAdmin(false);
    router.push('/login');
  };

  const navLinks = [
    { href: '/hackathons', label: 'Hackathons', icon: Trophy },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/dashboard', label: 'Dashboard', icon: Home },
  ];

  const isLoggedIn = !!user || status === 'authenticated';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
                HM
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-primary transition-colors">
                  HackMate
                </span>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase -mt-1 hidden sm:block">
                  Vasavi College
                </span>
              </div>
            </Link>

            {/* Platform pill badge */}
            <span className="hidden lg:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Campus Hub
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-bold shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                  {link.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <ShieldCheck size={16} /> Admin Portal
              </Link>
            )}
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            {isLoggedIn && <NotificationDropdown />}

            {/* User Profile / Auth buttons */}
            {!hideAuth && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                    <Link
                      href="/complete-profile"
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                      title="Edit Profile"
                    >
                      <AvatarDisplay
                        avatar={user?.avatar || user?.profile?.avatar}
                        seed={user?.email || user?.name || 'User'}
                        name={user?.name}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-gray-800 hidden sm:inline max-w-[120px] truncate">
                        {user?.name || 'Profile'}
                      </span>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="font-semibold text-xs h-9">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="font-semibold text-xs h-9 bg-black hover:bg-gray-800 text-white shadow-xs">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="h-9 w-9 text-gray-700"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
                  {link.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-700 hover:bg-amber-50"
              >
                <ShieldCheck size={18} /> Admin Portal
              </Link>
            )}

            {isLoggedIn && (
              <Link
                href="/complete-profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-1 pt-2.5"
              >
                <User size={18} className="text-gray-400" /> My Profile & Skills
              </Link>
            )}
          </nav>

          {!isLoggedIn ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full text-sm font-semibold h-10">
                  Log in
                </Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button className="w-full text-sm font-semibold h-10 bg-black text-white">
                  Create an Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full text-sm font-semibold h-10 text-red-600 hover:bg-red-50 border-red-200"
              >
                <LogOut size={16} className="mr-2" /> Log out ({user?.name || 'Account'})
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
