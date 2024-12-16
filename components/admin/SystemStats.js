'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  UserCheck, 
  Clock 
} from 'lucide-react';

export default function SystemStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalAdmins: 0,
    recentUsers: 0,
    activeUsers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch('/api/admin/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        const statsData = data.stats || {};
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalNotes: statsData.totalNotes || 0,
          totalAdmins: statsData.totalAdmins || 0,
          recentUsers: statsData.recentUsers || 0,
          activeUsers: statsData.activeUsers || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching system stats:', error);
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-gray-500 animate-pulse">Loading statistics...</div>;
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-[#2a2a2a] rounded-xl p-6 flex items-center space-x-6 transform transition-all hover:scale-[1.05]">
      <div className={`p-4 rounded-full ${color} bg-opacity-20 flex items-center justify-center`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <div>
        <p className="text-gray-400 text-sm uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-6">
      <StatCard 
        icon={Users} 
        title="Total Users" 
        value={stats.totalUsers} 
        color="text-blue-500"
      />
      <StatCard 
        icon={Clock} 
        title="Recent Users" 
        value={stats.recentUsers} 
        color="text-green-500"
      />
      <StatCard 
        icon={FileText} 
        title="Total Notes" 
        value={stats.totalNotes} 
        color="text-purple-500"
      />
      <StatCard 
        icon={UserCheck} 
        title="Admin Users" 
        value={stats.totalAdmins} 
        color="text-red-500"
      />
    </div>
  );
}
