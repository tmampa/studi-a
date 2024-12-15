'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { use } from 'react';
import ReactConfetti from 'react-confetti';

function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="mt-2 text-sm text-gray-400">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
      <p className="text-gray-400 text-center mb-4">{message}</p>
      <div className="flex gap-4">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export default function QuizPage({ params }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const id = unwrappedParams?.id;
      if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid note ID format');
      }

      const res = await fetch(`/api/notes/${id}/quiz`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch quiz');
      }
      
      if (!data.quiz || !Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error('No quiz found. Try generating one first.');
      }

      // Validate quiz structure
      data.quiz.forEach((q, index) => {
        if (!q.question) throw new Error(`Question ${index + 1} is invalid`);
        if (!Array.isArray(q.options)) throw new Error(`Options for question ${index + 1} are invalid`);
        if (q.options.length !== 4) throw new Error(`Question ${index + 1} does not have exactly 4 options`);
        if (typeof q.correctAnswer !== 'number') throw new Error(`Question ${index + 1} has an invalid answer format`);
      });
      
      setQuiz(data.quiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [unwrappedParams?.id]);

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null || quizComplete) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === quiz[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion === quiz.length - 1) {
      setQuizComplete(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setQuizComplete(false);
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onBack={handleBack} onRetry={fetchQuiz} />;
  if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
    return (
      <ErrorState 
        message="No quiz found. Try generating one first." 
        onBack={handleBack}
      />
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / quiz.length) * 100);
    const passed = percentage >= 70; // Pass threshold is 70%

    return (
      <>
        {passed && <ReactConfetti width={windowSize.width} height={windowSize.height} />}
        <div className="min-h-screen bg-gray-900 p-6">
          <div className="max-w-2xl mx-auto">
            <Button onClick={handleBack} variant="ghost" className="mb-6">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Quiz Complete!</h2>
                <div className={`text-6xl font-bold mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
                  {percentage}%
                </div>
                <p className="text-xl text-gray-300 mb-6">
                  You got {score} out of {quiz.length} questions correct
                </p>
                {passed ? (
                  <div className="text-green-500 text-lg mb-6">
                    <Check className="h-8 w-8 mx-auto mb-2" />
                    Congratulations! You passed the quiz!
                  </div>
                ) : (
                  <div className="text-red-500 text-lg mb-6">
                    <X className="h-8 w-8 mx-auto mb-2" />
                    Keep practicing! You need 70% to pass.
                  </div>
                )}
                <div className="flex gap-4 justify-center">
                  {!passed && (
                    <Button onClick={handleRetry} variant="default">
                      Try Again
                    </Button>
                  )}
                  <Button onClick={handleBack} variant={passed ? "default" : "outline"}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const currentQ = quiz[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Question {currentQuestion + 1} of {quiz.length}
            </span>
            <span className="text-sm text-gray-400">
              Score: {score}
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-6">
            {currentQ.question}
          </h2>
          
          <div className="space-y-4 mb-6">
            {currentQ.options.map((option, index) => {
              const isCorrect = index === currentQ.correctAnswer;
              const isSelected = index === selectedAnswer;
              const showResult = selectedAnswer !== null;

              return (
                <Button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  variant={
                    !showResult ? "outline" :
                    isCorrect ? "success" :
                    isSelected ? "destructive" : "outline"
                  }
                  className={`w-full justify-start text-left ${
                    showResult && isCorrect ? 'bg-green-500/20 hover:bg-green-500/20' : ''
                  }`}
                  disabled={showResult}
                >
                  <div className="flex items-center w-full">
                    <span className="flex-grow">{option}</span>
                    {showResult && (isCorrect || isSelected) && (
                      <span className="ml-2">
                        {isCorrect ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
          
          {showExplanation && (
            <div className={`mb-6 p-4 rounded-lg ${
              selectedAnswer === currentQ.correctAnswer
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <h3 className="font-semibold text-white mb-2">Explanation:</h3>
              <p className="text-gray-300">{currentQ.explanation}</p>
            </div>
          )}
          
          {selectedAnswer !== null && (
            <Button 
              onClick={handleNext} 
              className="w-full"
              variant={selectedAnswer === currentQ.correctAnswer ? "success" : "default"}
            >
              {currentQuestion === quiz.length - 1 ? "Finish Quiz" : "Next Question"}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
