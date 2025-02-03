'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  FileText, 
  Shield 
} from 'lucide-react';

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        console.log('Fetching activities with token:', token.substring(0, 10) + '...');

        const response = await fetch('/api/admin/activities', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch activities. Status: ${response.status}. Message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received activities:', data);

        setActivities(data.activities || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <User className="w-5 h-5 text-blue-500" />;
      case 'note_created': return <FileText className="w-5 h-5 text-green-500" />;
      case 'admin_action': return <Shield className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-gray-500 animate-pulse">Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={activity._id} 
          className="flex items-center space-x-4 p-4 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
        >
          <div className="flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-grow">
            <p className="text-white font-semibold">{activity.description}</p>
            <p className="text-gray-400 text-sm">{activity.user?.name || 'System'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {formatDate(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
