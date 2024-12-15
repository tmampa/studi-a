import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ message, onRetry, onBack }) {
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
