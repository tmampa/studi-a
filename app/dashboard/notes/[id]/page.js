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
  if (!text) return '';

  // Handle headings with different levels
  text = text.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mb-5 mt-6">$1</h1>');
  text = text.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-primary/90 mb-4 mt-5 pb-2 border-b border-border">$1</h2>');
  text = text.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white/90 mb-3 mt-4">$1</h3>');
  
  // Handle unordered lists
  text = text.replace(/^\* (.*$)/gm, '<li class="flex gap-2 items-baseline mb-1.5 text-sm"><span class="text-primary">•</span>$1</li>');
  text = text.replace(/^- (.*$)/gm, '<li class="flex gap-2 items-baseline mb-1.5 text-sm"><span class="text-primary">•</span>$1</li>');
  
  // Wrap lists in ul container
  text = text.replace(/((?:<li.*?>.*?<\/li>\n?)+)/g, '<ul class="space-y-1 my-3">$1</ul>');
  
  // Handle ordered lists
  text = text.replace(/^\d+\. (.*$)/gm, '<li class="flex gap-2 items-baseline mb-1.5 list-decimal ml-4 text-gray-300 text-sm">$1</li>');
  
  // Handle bold text
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/90 font-medium">$1</strong>');
  
  // Handle italic text
  text = text.replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>');
  
  // Handle inline code
  text = text.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono text-xs">$1</code>');
  
  // Handle code blocks
  text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-background/50 border border-border rounded-lg p-3 my-3 overflow-x-auto"><code class="text-gray-300 font-mono text-xs">$1</code></pre>');
  
  // Handle blockquotes
  text = text.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-primary bg-primary/5 pl-4 py-2 my-3 text-gray-300 italic text-sm">$1</blockquote>');
  
  // Handle horizontal rules
  text = text.replace(/^---$/gm, '<hr class="my-6 border-t border-border" />');
  
  // Format mathematical expressions
  text = text.replace(/\b([a-z])2\b/g, '$1²');
  text = text.replace(/\b([a-z])([2-9])\b/g, '$1^$2');
  
  // Split into paragraphs and handle remaining text
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => {
    if (!p.startsWith('<')) {
      // Only wrap in paragraph if not already a HTML element
      p = `<p class="mb-3 leading-relaxed text-gray-300 text-sm">${p.trim()}</p>`;
    }
    return renderMath(p);
  }).join('\n');
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
              <div 
                key={chapter.order} 
                className="p-8 rounded-lg bg-card/50 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-lg font-semibold">
                    {chapter.order}
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {chapter.title}
                  </h2>
                </div>
                <div 
                  className="prose prose-invert prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-strong:text-white/90 prose-strong:font-medium
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-background/50 prose-pre:border prose-pre:border-border
                    prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:text-gray-300
                    prose-li:text-gray-300 prose-li:marker:text-primary"
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