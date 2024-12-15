import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="mt-2 text-sm text-gray-400">{message}</p>
    </div>
  );
}
