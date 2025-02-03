'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudyNoteCard } from '@/components/ui/study-note-card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Clock, Loader2 } from 'lucide-react';
import { GenerateNotesDialog } from '@/components/generate-notes-dialog';
import { fetchWithAuth } from '@/lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth('/api/notes');
      setNotes(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('No authentication token found')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name || 'Student');
    }
    fetchNotes();
  }, []);

  const handleViewNote = (noteId) => {
    router.push(`/dashboard/notes/${noteId}`);
  };

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Hero Section */}
      <div className="hero-gradient hero-pattern">
        <div className="px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">
                  Welcome back{userName ? `, ${userName}` : ''}! 👋
                </h1>
                <p className="text-muted-foreground text-lg">
                  Ready to create some study notes?
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{notes.length} Notes</span>
                  </div>
                  {notes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Last updated {new Date(notes[0].createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button onClick={() => setDialogOpen(true)} size="lg" className="shadow-lg">
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
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading your notes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchNotes}>Try Again</Button>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">You haven't created any notes yet.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <StudyNoteCard
                key={note._id}
                title={note.title}
                subject={note.subject}
                date={note.createdAt}
                onView={() => handleViewNote(note._id)}
              />
            ))}
          </div>
        )}
      </div>

      <GenerateNotesDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </main>
  );
}