'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function FlashcardsPage() {
  const router = useRouter();
  const params = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingFront, setShowingFront] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.id) {
      fetchFlashcards();
    }
  }, [params?.id]);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/notes/${params.id}/flashcards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch flashcards');
      }
      
      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error('Invalid flashcard data received');
      }

      setFlashcards(data.flashcards);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowingFront(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowingFront(true);
    }
  };

  const handleFlip = () => {
    setShowingFront(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.back()}>Go Back</Button>
            <Button variant="outline" onClick={fetchFlashcards}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Flashcards Found</h1>
          <p className="text-muted-foreground mb-6">This note doesn't have any flashcards yet.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </p>
        </div>

        <Card 
          className="min-h-[300px] flex items-center justify-center p-8 mb-8 cursor-pointer transition-all duration-300 hover:shadow-lg"
          onClick={handleFlip}
        >
          <div className="text-center">
            <p className="text-lg font-medium">
              {showingFront ? currentCard.front : currentCard.back}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Click to {showingFront ? 'see answer' : 'hide answer'}
            </p>
          </div>
        </Card>

        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={handleFlip}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Flip
          </Button>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
