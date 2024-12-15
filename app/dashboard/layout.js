'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import ChatWindow from '@/components/chat/chat-window';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
        } else {
          setMounted(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Don't render anything until we've checked authentication
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="container mx-auto max-w-5xl">
          {children}
        </div>
      </main>
      <div className="w-[400px] p-4 border-l">
        <ChatWindow />
      </div>
    </div>
  );
}
