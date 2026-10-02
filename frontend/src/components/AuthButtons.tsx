'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, invalidateCache } from '@/lib/api';

export default function AuthButtons() {
  const { data: session, status } = useSession();
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setHasToken(false);
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    
    api.get('/profiles/me')
      .then(res => {
        setHasToken(true);
        if (String(res.data?.role).toLowerCase() === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setHasToken(false);
        setIsAdmin(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    invalidateCache();
    if (session) {
      signOut({ redirect: false });
    }
    setHasToken(false);
    setIsAdmin(false);
    router.refresh();
  };

  const isLoggedIn = status === 'authenticated' || hasToken;

  if (status === 'loading') {
    return <div className="w-24"></div>; // Placeholder
  }

  if (isLoggedIn) {
    return (
      <div className="flex gap-3 items-center">
        {isAdmin && (
          <Link href="/admin">
            <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 font-bold">
              Admin Panel
            </Button>
          </Link>
        )}
        <Link href="/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
        <Button onClick={handleLogout}>Log out</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <Link href="/login">
        <Button variant="outline">Log in</Button>
      </Link>
      <Link href="/register">
        <Button>Sign up</Button>
      </Link>
    </div>
  );
}
