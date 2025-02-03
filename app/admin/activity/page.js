'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ActivityLog from '@/components/admin/ActivityLog';

export default function AdminActivityPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Verify token and fetch user details
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.isAdmin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <div className="container mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-600">
            Activity Log
          </h1>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl p-8">
          <ActivityLog />
        </div>
      </div>
    </div>
  );
}
