'use client';

import { useState, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus 
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data.users || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleUserAction = async (userId, action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action })
      });

      if (!response.ok) throw new Error('Action failed');
      
      const updatedData = await response.json();
      setUsers(updatedData.users || []);
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-500 animate-pulse">Loading users...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2a2a2a]">
            <th className="py-4 text-left text-gray-400 font-medium">Name</th>
            <th className="py-4 text-left text-gray-400 font-medium">Email</th>
            <th className="py-4 text-left text-gray-400 font-medium">Role</th>
            <th className="py-4 text-right text-gray-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr 
              key={user._id} 
              className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"
            >
              <td className="py-4 text-white font-semibold">{user.name}</td>
              <td className="py-4 text-gray-400">{user.email}</td>
              <td className="py-4">
                <span 
                  className={`
                    px-3 py-1 rounded-full text-xs font-bold
                    ${user.isAdmin 
                      ? 'bg-blue-500 bg-opacity-20 text-blue-400' 
                      : 'bg-gray-500 bg-opacity-20 text-gray-400'
                    }
                  `}
                >
                  {user.isAdmin ? 'Admin' : 'User'}
                </span>
              </td>
              <td className="py-4 text-right">
                <div className="flex justify-end items-center space-x-2">
                  {!user.isAdmin ? (
                    <button 
                      onClick={() => handleUserAction(user._id, 'makeAdmin')}
                      className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors group"
                      title="Make Admin"
                    >
                      <UserPlus className="w-5 h-5 text-green-500 group-hover:scale-110" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUserAction(user._id, 'removeAdmin')}
                      className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors group"
                      title="Remove Admin"
                    >
                      <UserMinus className="w-5 h-5 text-red-500 group-hover:scale-110" />
                    </button>
                  )}
                  <button 
                    className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors group"
                    title="More Options"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:scale-110" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
