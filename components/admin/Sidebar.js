'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Activity, 
  LogOut,
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { 
      href: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard 
    },
    { 
      href: '/admin/users', 
      label: 'User Management', 
      icon: Users 
    },
    { 
      href: '/admin/notes', 
      label: 'Notes Management', 
      icon: FileText 
    },
    { 
      href: '/admin/activity', 
      label: 'Activity Log', 
      icon: Activity 
    },
    { 
      href: '/admin/settings', 
      label: 'System Settings', 
      icon: Settings 
    }
  ];

  const handleSignOut = () => {
    // Implement custom sign-out logic
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] min-h-screen h-screen overflow-y-hidden flex flex-col">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>
        
        <nav className="space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center p-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-[#2a2a2a] text-blue-400' 
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }
                `}
              >
                <Icon className="mr-3 w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto mb-6">
        <button 
          onClick={handleSignOut}
          className="
            w-full flex items-center justify-center 
            bg-[#2a2a2a] text-red-500 
            p-3 rounded-lg 
            hover:bg-red-500 hover:bg-opacity-20 
            transition-all duration-200
          "
        >
          <LogOut className="mr-3 w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
