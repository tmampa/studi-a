'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  Languages as LanguagesIcon,
  HeartPulse,
  GraduationCap,
  Music2,
  Palette,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const subjects = [
  { icon: Calculator, name: 'Mathematics', color: 'text-blue-500' },
  { icon: FlaskConical, name: 'Physical Sciences', color: 'text-green-500' },
  { icon: BookOpen, name: 'English', color: 'text-yellow-500' },
  { icon: Globe2, name: 'Geography', color: 'text-orange-500' },
  { icon: GraduationCap, name: 'History', color: 'text-red-500' },
  { icon: HeartPulse, name: 'Life Sciences', color: 'text-purple-500' },
  { icon: Music2, name: 'Music', color: 'text-pink-500' },
  { icon: Palette, name: 'Visual Arts', color: 'text-indigo-500' },
];

const difficulties = [
  { name: 'Grade 8-9', level: 'Basic' },
  { name: 'Grade 10-11', level: 'Intermediate' },
  { name: 'Grade 12', level: 'Advanced' },
];

export function GenerateNotesDialog({ open, onOpenChange }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    subject: '',
    difficulty: '',
  });

  const handleNext = () => {
    setError('');
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    try {
      setError('');
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      router.push(`/dashboard/notes/${data._id}`);
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating notes:', error);
      setError(error.message || 'Failed to generate notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'What would you like to learn about?'}
            {step === 2 && 'Select a subject'}
            {step === 3 && 'Choose difficulty level'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm bg-destructive/15 border border-destructive/30 rounded-md text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <Input
                placeholder="Enter a topic (e.g., Photosynthesis, Pythagoras Theorem)"
                value={formData.topic}
                onChange={(e) => {
                  setError('');
                  setFormData({ ...formData, topic: e.target.value });
                }}
                className="text-lg"
              />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject.name}
                  onClick={() => {
                    setError('');
                    setFormData({ ...formData, subject: subject.name });
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 ${
                    formData.subject === subject.name
                      ? 'border-primary bg-accent/50'
                      : 'border-border'
                  }`}
                >
                  <subject.icon className={`w-8 h-8 mb-2 ${subject.color}`} />
                  <span className="text-sm font-medium">{subject.name}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficulties.map((diff) => (
                <button
                  key={diff.name}
                  onClick={() => {
                    setError('');
                    setFormData({ ...formData, difficulty: diff.name });
                  }}
                  className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 ${
                    formData.difficulty === diff.name
                      ? 'border-primary bg-accent/50'
                      : 'border-border'
                  }`}
                >
                  <span className="text-lg font-semibold mb-2">{diff.name}</span>
                  <span className="text-sm text-muted-foreground">{diff.level}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.topic) ||
                (step === 2 && !formData.subject)
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!formData.difficulty || loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Notes
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 