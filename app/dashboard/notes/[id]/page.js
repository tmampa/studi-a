'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { use } from 'react';
import { ChevronLeft, Loader2, AlertCircle, Brain, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import 'katex/dist/katex.min.css';
import katex from 'katex';

function formatContent(text) {
  text = text.replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  
  // Format headings
  text = text.replace(/\*\*(.*?):\*\*/g, (match, title) => {
    return `<h2 class="text-lg font-semibold text-white mb-4 mt-6 border-b border-gray-700 pb-2">${title.trim()}</h2>`;
  });
  
  // Format list items
  text = text.replace(/- \*\*(.*?):\*\*/g, (match, content) => {
    return `<div class="flex gap-2 mb-2 items-baseline text-sm">
      <span class="text-blue-400">•</span>
      <div>
        <strong class="text-white">${content.trim()}</strong>:
      </div>
    </div>`;
  });
  
  // Format remaining bold text (not headings or list items)
  text = text.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    return `<strong class="text-white">${content.trim()}</strong>`;
  });
  
  // Format mathematical expressions
  text = text.replace(/\b([a-z])2\b/g, '$1²');
  text = text.replace(/\b([a-z])([2-9])\b/g, '$1^$2');
  
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map(p => {
    const rendered = renderMath(p.trim());
    return `<div class="mb-3 leading-relaxed text-gray-300 text-sm">${rendered}</div>`;
  }).join('');
}

function renderMath(text) {
  let result = text;
  
  // Replace display math ($$...$$)
  result = result.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { 
        displayMode: true,
        throwOnError: false
      });
    } catch (error) {
      console.error('KaTeX error:', error);
      return match;
    }
  });
  
  // Replace inline math ($...$)
  result = result.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { 
        displayMode: false,
        throwOnError: false
      });
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

export default function NotePage({ params }) {
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);

  const fetchNote = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/notes/${unwrappedParams.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch note');
      }

      const data = await res.json();
      setNote(data);
      
      // Check if note has a quiz
      setHasQuiz(Array.isArray(data.quiz) && data.quiz.length > 0);
    } catch (error) {
      console.error('Error fetching note:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [unwrappedParams.id]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    try {
      const res = await fetch(`/api/notes/${unwrappedParams.id}/flashcards`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate flashcards');
      }

      // Refresh note data to get updated flashcards
      await fetchNote();

      // Navigate to flashcards page
      router.push(`/dashboard/flashcards/${unwrappedParams.id}`);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError(error.message);
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch(`/api/notes/${unwrappedParams.id}/quiz`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      if (!data.success || !data.quiz) {
        throw new Error('Failed to generate quiz. Please try again.');
      }

      // Update quiz state
      setHasQuiz(true);

      // Navigate to quiz page
      router.push(`/dashboard/quiz/${unwrappedParams.id}`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error.message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleTakeQuiz = () => {
    router.push(`/dashboard/quiz/${unwrappedParams.id}`);
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

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 flex flex-col items-center space-y-4">
              <Brain className="w-8 h-8 text-blue-400" />
              <h3 className="font-semibold text-white">Flashcards</h3>
              {note.hasFlashcards ? (
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/dashboard/flashcards/${note._id}`)}
                >
                  View Flashcards
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={handleGenerateFlashcards}
                  disabled={generatingFlashcards}
                >
                  {generatingFlashcards ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Flashcards'
                  )}
                </Button>
              )}
            </Card>

            <Card className="p-6 flex flex-col items-center space-y-4">
              <GraduationCap className="w-8 h-8 text-green-400" />
              <h3 className="font-semibold text-white">Quiz</h3>
              {hasQuiz ? (
                <Button 
                  variant="default"
                  onClick={handleTakeQuiz}
                >
                  Take Quiz
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                >
                  {generatingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    'Generate Quiz'
                  )}
                </Button>
              )}
            </Card>
          </div>

          <div className="space-y-8">
            {note.chapters.map((chapter) => (
              <div key={chapter.order} className="space-y-4">
                <h2 className="text-xl font-bold text-white">
                  {chapter.title}
                </h2>
                <div 
                  className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-300"
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(chapter.content)
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