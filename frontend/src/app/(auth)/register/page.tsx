'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    branch: '',
    year: 1,
    section: ''
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (status === 'authenticated' || token) {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', formData);
      // Auto-login after registration
      const loginData = new FormData();
      loginData.append('username', formData.email);
      loginData.append('password', formData.password);
      const res = await api.post('/auth/login', loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || d.message).join(', '));
      } else {
        setError('Registration failed. Please verify your details or log in.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-gray-600 hover:text-primary font-medium">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Home
      </Link>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create an Account</h2>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input name="name" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <input name="email" type="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Roll Number</label>
              <input name="roll_number" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <select name="branch" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange}>
                <option value="">Select</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select name="year" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <input name="section" type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" onChange={handleChange} />
            </div>
          </div>

          <div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 mt-4">
              Register
            </button>
          </div>
          
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div>
            <button type="button" onClick={() => signIn('google', { callbackUrl: '/auth-sync' })} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center text-sm mt-4">
            Already have an account? <Link href="/login" className="font-medium text-primary hover:text-black">Log in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
