import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, BookOpen, LogOut, BarChart } from 'lucide-react';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
    { id: 'notes', icon: BookOpen, label: 'My Notes', href: '/dashboard/notes' },
    { id: 'stats', icon: BarChart, label: 'Study Stats', href: '/dashboard/stats' },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Studi-A</h2>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;