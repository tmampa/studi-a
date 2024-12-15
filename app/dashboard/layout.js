'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { isAuthenticated } from "@/lib/auth";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Don't render anything until we've checked authentication
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="w-64 flex-shrink-0" />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
