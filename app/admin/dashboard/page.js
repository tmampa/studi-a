'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import UserManagement from '@/components/admin/UserManagement';
import SystemStats from '@/components/admin/SystemStats';
import ActivityLog from '@/components/admin/ActivityLog';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

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
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-400">Loading Dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            Admin Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400">System Active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* System Statistics */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.02]">
            <h2 className="text-2xl font-bold mb-6 text-blue-400 border-b border-[#2a2a2a] pb-4">
              System Overview
            </h2>
            <SystemStats />
          </div>

          {/* User Management */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.02]">
            <h2 className="text-2xl font-bold mb-6 text-purple-400 border-b border-[#2a2a2a] pb-4">
              User Management
            </h2>
            <UserManagement />
          </div>

          {/* Activity Log */}
          <div className="col-span-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.02]">
            <h2 className="text-2xl font-bold mb-6 text-green-400 border-b border-[#2a2a2a] pb-4">
              Recent Activity
            </h2>
            <ActivityLog />
          </div>
        </div>
      </div>
    </div>
  );
}
