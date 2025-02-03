'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, RotateCcw, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './styles.module.css';

export default function FlashcardsPage() {
  const router = useRouter();
  const params = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slideDirection, setSlideDirection] = useState('');

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
      setSlideDirection('right');
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSlideDirection('');
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSlideDirection('left');
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setSlideDirection('');
      }, 300);
    }
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === ' ') {
      handleFlip();
      event.preventDefault();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentIndex, flashcards.length]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Loader2 className={styles.loadingIcon} />
          <p>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <h1>Error</h1>
          <p>{error}</p>
          <div className={styles.buttonGroup}>
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
      <div className={styles.container}>
        <div className={styles.emptyWrapper}>
          <h1>No Flashcards Found</h1>
          <p>This note doesn't have any flashcards yet.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={styles.backButton}
          >
            <ArrowLeft className={styles.icon} />
            Back to Note
          </Button>
          <div className={styles.counter}>
            Card {currentIndex + 1} of {flashcards.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrapper}>
          <div 
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className={styles.scene}>
          <div 
            className={`${styles.card} ${isFlipped ? styles.isFlipped : ''}`}
            onClick={handleFlip}
          >
            <div className={styles.cardFront}>
              <div className={styles.cardContent}>
                <div className={styles.questionText}>
                  {currentCard.front}
                </div>
                <div className={styles.hintText}>
                  Click to flip
                </div>
              </div>
            </div>
            <div className={styles.cardBack}>
              <div className={styles.cardContent}>
                <div className={styles.answerText}>
                  {currentCard.back}
                </div>
                <div className={styles.hintText}>
                  Click to flip back
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={styles.navButton}
          >
            <ChevronLeft className={styles.icon} />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={handleFlip}
            className={styles.flipButton}
          >
            <RotateCcw className={styles.icon} />
            Flip
          </Button>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className={styles.navButton}
          >
            Next
            <ChevronRight className={styles.icon} />
          </Button>
        </div>

        {/* Keyboard shortcuts */}
        <div className={styles.shortcuts}>
          <p>Keyboard shortcuts: ← Previous | Space Flip | → Next</p>
        </div>
      </div>
    </div>
  );
}
