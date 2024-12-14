'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css';
import katex from 'katex';

function renderMath(text) {
  let result = text;
  
  // Replace display math ($$...$$)
  result = result.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true });
    } catch (error) {
      console.error('KaTeX error:', error);
      return match;
    }
  });
  
  // Replace inline math ($...$)
  result = result.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false });
    } catch (error) {
      console.error('KaTeX error:', error);
      return match;
    }
  });
  
  return result;
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Loading your notes...</p>
    </div>
  );
}

function ErrorState({ message, onRetry, onBack }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Oops!</h2>
            <p className="text-lg text-muted-foreground">{message}</p>
          </div>

          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="lg">
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNote = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const id = params?.id;
      // Validate ID format before making the request
      if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid note ID format');
      }

      const res = await fetch(`/api/notes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch note');
      }
      
      const data = await res.json();
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchNote();
    }
  }, [params?.id]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={fetchNote}
        onBack={handleBack}
      />
    );
  }

  if (!note) {
    return (
      <ErrorState 
        message="Note not found" 
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold">{note.title}</h1>
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span>{note.subject}</span>
              <span>•</span>
              <span>{note.difficulty}</span>
            </div>
          </div>

          <div className="space-y-8">
            {note.chapters.map((chapter) => (
              <div key={chapter.order} className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  {chapter.title}
                </h2>
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: chapter.content.split('\n').map(paragraph => 
                      `<p class="text-muted-foreground">${renderMath(paragraph)}</p>`
                    ).join('')
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 