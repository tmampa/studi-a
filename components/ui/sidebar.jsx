import Link from 'next/link';
import { Home, BookOpen, Settings, LogOut } from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="h-screen w-64 bg-card border-r border-border">
      <div className="p-6">
        <h2 className="text-lg font-bold">Studi-a</h2>
      </div>
      
      <nav className="px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-8 px-8 w-64">
        <button className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-destructive/90 hover:text-destructive-foreground text-muted-foreground transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
} 