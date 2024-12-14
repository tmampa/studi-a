import { Button } from './button';
import { Eye, BookOpen } from 'lucide-react';

export function StudyNoteCard({ title, subject, date, onView }) {
  return (
    <div className="group bg-card hover:bg-accent/50 transition-colors p-6 rounded-lg border border-border space-y-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>{subject}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onView}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Note
        </Button>
      </div>
    </div>
  );
} 