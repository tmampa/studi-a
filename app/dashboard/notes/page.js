'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sidebar } from '@/components/ui/sidebar';
import { Plus, Search, Loader2, BookOpen, Brain, FileText, Trash2 } from 'lucide-react';
import { GenerateNotesDialog } from '@/components/generate-notes-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from "@/components/ui/use-toast";

export default function NotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/notes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch notes');
      }
      
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewNote = (noteId) => {
    router.push(`/dashboard/notes/${noteId}`);
  };

  const handleGenerateQuiz = (noteId) => {
    router.push(`/dashboard/quiz/${noteId}`);
  };

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notes/${noteToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete note');
      }

      setNotes(notes.filter(note => note._id !== noteToDelete._id));
      toast({
        title: "Note deleted",
        description: "The note has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const MainContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your notes...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">My Notes</h1>
              <p className="text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} available
              </p>
            </div>

            <Button onClick={() => setDialogOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Generate Notes
            </Button>
          </div>

          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
              {error}
              <Button variant="outline" size="sm" onClick={fetchNotes} className="ml-4">
                Try Again
              </Button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "We couldn't find any notes matching your search"
                  : "Get started by generating your first note"}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Notes
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <Card key={note._id} className="p-6 flex flex-col">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-semibold line-clamp-2">
                        {note.title}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(note)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {note.subject && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {note.subject}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {note.flashcards && (
                        <div className="flex items-center gap-1">
                          <Brain className="w-4 h-4" />
                          {note.flashcards.length} cards
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {note.chapters?.length || 0} chapters
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewNote(note._id)}
                    >
                      View Note
                    </Button>
                    <Button 
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleGenerateQuiz(note._id)}
                    >
                      Quiz
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <GenerateNotesDialog 
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={fetchNotes}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete Note"
          description="Are you sure you want to delete this note? This action cannot be undone."
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <MainContent />
      </div>
    </div>
  );
}
