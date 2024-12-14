import { Button } from './button';
import { Eye, BookOpen } from 'lucide-react';

export function StudyNoteCard({ title, subject, date, onView }) {
  return (
    <div className="group relative bg-card hover:bg-accent/20 transition-all duration-300 p-6 rounded-lg border border-border hover:border-primary/50 space-y-4 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
      
      <div className="space-y-3 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>{subject}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 relative">
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
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/20 hover:text-primary"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Note
        </Button>
      </div>
    </div>
  );
} 