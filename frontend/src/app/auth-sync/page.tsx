'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function AuthSync() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const sessionWithToken = session as { accessToken?: string };
      if (sessionWithToken.accessToken) {
        localStorage.setItem('token', sessionWithToken.accessToken);
        
        api.get('/auth/me')
          .then(res => {
            const user = res.data;
            if (!user.roll_number || !user.branch || !user.year) {
              router.push('/complete-profile');
            } else {
              router.push('/dashboard');
            }
          })
          .catch(err => {
            console.error('Error fetching user profile:', err);
            setTimeout(() => setError(true), 0);
          });
      } else {
        setTimeout(() => setError(true), 0);
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-red-500 mb-4 font-medium">Authentication Failed</div>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
      <div className="text-gray-600 font-medium">Completing sign in...</div>
    </div>
  );
}
