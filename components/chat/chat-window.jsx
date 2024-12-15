'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const MarkdownComponents = {
  h1: ({ className, ...props }) => (
    <h1 className={cn("mt-2 mb-4 text-2xl font-bold", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("mt-2 mb-3 text-xl font-bold", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("mt-2 mb-3 text-lg font-bold", className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn("mt-2 mb-3 text-base font-bold", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mb-2 leading-7", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-2 ml-4 list-disc", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-2 ml-4 list-decimal", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("mt-1", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote className={cn("mt-2 border-l-2 border-muted pl-4 italic", className)} {...props} />
  ),
  code: ({ className, inline, ...props }) => (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
        inline ? "text-muted-foreground" : "block p-4",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre className={cn("mt-2 mb-4 overflow-x-auto rounded-lg bg-muted p-4", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 w-full overflow-y-auto">
      <table className={cn("w-full", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th className={cn("border px-4 py-2 text-left font-bold", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border px-4 py-2", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a className={cn("font-medium underline underline-offset-4", className)} {...props} />
  ),
};

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">AI Study Assistant</h2>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-lg",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground ml-auto"
                  : message.role === 'assistant'
                  ? "bg-muted"
                  : "bg-destructive/10 text-destructive",
                message.role === 'user' ? "max-w-[80%] ml-auto" : "max-w-[80%]"
              )}
            >
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={MarkdownComponents}
                  className="prose prose-sm dark:prose-invert max-w-none"
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted p-4 rounded-lg max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your studies..."
            className="min-h-[60px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
