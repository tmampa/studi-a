'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { StudyNoteCard } from '@/components/ui/study-note-card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Clock } from 'lucide-react';

// Dummy data for study notes
const dummyNotes = [
  {
    id: 1,
    title: 'Introduction to React Hooks',
    subject: 'Web Development',
    date: '2024-01-15',
  },
  {
    id: 2,
    title: 'Advanced JavaScript Concepts',
    subject: 'Programming',
    date: '2024-01-14',
  },
  {
    id: 3,
    title: 'CSS Grid and Flexbox',
    subject: 'Web Design',
    date: '2024-01-13',
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleGenerateNotes = () => {
    // TODO: Implement note generation
    console.log('Generating notes...');
  };

  const handleViewNote = (noteId) => {
    // TODO: Implement note viewing
    console.log('Viewing note:', noteId);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="hero-gradient hero-pattern">
          <div className="px-8 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight">
                    Welcome back, {user.name}! 👋
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Ready to create some study notes?
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{dummyNotes.length} Notes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Last updated {new Date(dummyNotes[0].date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleGenerateNotes} size="lg" className="shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Generate Study Notes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Your Study Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyNotes.map((note) => (
              <StudyNoteCard
                key={note.id}
                title={note.title}
                subject={note.subject}
                date={note.date}
                onView={() => handleViewNote(note.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 