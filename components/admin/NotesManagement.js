'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';

export default function NotesManagement() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotes: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dateRange: {
      start: null,
      end: null
    },
    hasFlashcards: null,
    hasQuiz: null
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [viewNoteDetails, setViewNoteDetails] = useState(null);
  const { toast } = useToast();

  const addToast = (message, type = 'default', duration = 3000) => {
    toast({
      description: message,
      variant: type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default',
      duration: duration
    });
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Verify token and admin status
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.isAdmin) {
          router.push('/dashboard');
          return;
        }

        // If admin, fetch notes
        fetchNotes();
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/login');
      }
    };

    checkAdminAccess();
  }, [filters]);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const queryParams = new URLSearchParams({
        page: filters.currentPage,
        search: filters.search,
        subject: filters.subject,
        difficulty: filters.difficulty,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Add date range filters
      if (filters.dateRange.start) {
        queryParams.append('startDate', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        queryParams.append('endDate', filters.dateRange.end);
      }

      // Add flashcards and quiz filters
      if (filters.hasFlashcards !== null) {
        queryParams.append('hasFlashcards', filters.hasFlashcards.toString());
      }
      if (filters.hasQuiz !== null) {
        queryParams.append('hasQuiz', filters.hasQuiz.toString());
      }

      const response = await fetch(`/api/admin/notes?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      setNotes(data.notes);
      setPagination(data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      addToast(error.message, 'error');
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          noteId,
          action: 'delete'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }

      // Remove note from list
      setNotes(notes.filter(note => note._id !== noteId));
      setDeleteConfirmation(null);
      addToast('Note deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      addToast(error.message, 'error');
    }
  };

  const renderNoteRow = (note) => {
    return (
      <tr key={note._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-4 py-2">{note.title || 'Untitled Note'}</td>
        <td className="px-4 py-2">{note.subject || 'No Subject'}</td>
        <td className="px-4 py-2">{note.topic || 'No Topic'}</td>
        <td className="px-4 py-2">{note.difficulty || 'Unspecified'}</td>
        <td className="px-4 py-2">{note.userId?.name || 'Unknown User'}</td>
        <td className="px-4 py-2 flex space-x-2">
          <button 
            onClick={() => setViewNoteDetails(note)}
            className="text-blue-500 hover:text-blue-700"
            title="View Note Details"
          >
            <Eye />
          </button>
          <button 
            onClick={() => setDeleteConfirmation({
              noteId: note._id,
              noteTitle: note.title
            })}
            className="text-red-500 hover:text-red-700"
            title="Delete Note"
          >
            <Trash2 />
          </button>
        </td>
      </tr>
    );
  };

  const renderFilterSection = () => (
    <div className="mb-4 space-y-2">
      <div className="flex space-x-2">
        <input 
          type="text" 
          placeholder="Search notes..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="px-3 py-2 border rounded w-1/3"
        />
        <select 
          value={filters.subject}
          onChange={(e) => setFilters({...filters, subject: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Science">Science</option>
          <option value="History">History</option>
          {/* Add more subjects as needed */}
        </select>
        <select 
          value={filters.difficulty}
          onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <div className="flex space-x-2 items-center">
        <div className="flex items-center space-x-2">
          <label>Date From:</label>
          <input 
            type="date"
            value={filters.dateRange.start || ''}
            onChange={(e) => setFilters({
              ...filters, 
              dateRange: {...filters.dateRange, start: e.target.value}
            })}
            className="px-3 py-2 border rounded"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label>Date To:</label>
          <input 
            type="date"
            value={filters.dateRange.end || ''}
            onChange={(e) => setFilters({
              ...filters, 
              dateRange: {...filters.dateRange, end: e.target.value}
            })}
            className="px-3 py-2 border rounded"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label>Flashcards:</label>
          <select
            value={filters.hasFlashcards === null ? '' : filters.hasFlashcards}
            onChange={(e) => setFilters({
              ...filters, 
              hasFlashcards: e.target.value === '' ? null : e.target.value === 'true'
            })}
            className="px-3 py-2 border rounded"
          >
            <option value="">All</option>
            <option value="true">With Flashcards</option>
            <option value="false">Without Flashcards</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label>Quiz:</label>
          <select
            value={filters.hasQuiz === null ? '' : filters.hasQuiz}
            onChange={(e) => setFilters({
              ...filters, 
              hasQuiz: e.target.value === '' ? null : e.target.value === 'true'
            })}
            className="px-3 py-2 border rounded"
          >
            <option value="">All</option>
            <option value="true">With Quiz</option>
            <option value="false">Without Quiz</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-2 items-center">
        <label>Sort By:</label>
        <select 
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="createdAt">Created Date</option>
          <option value="title">Title</option>
          <option value="subject">Subject</option>
          <option value="difficulty">Difficulty</option>
        </select>
        <select 
          value={filters.sortOrder}
          onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );

  const renderNoteDetailsModal = () => {
    if (!viewNoteDetails) return null;

    const { title, subject, topic, difficulty, chapters, flashcards, quiz, userId } = viewNoteDetails;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-3/4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Topic:</strong> {topic}</p>
            <p><strong>Difficulty:</strong> {difficulty}</p>
            <p><strong>Created By:</strong> {userId.name} ({userId.email})</p>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Chapters</h3>
            {chapters.map((chapter, index) => (
              <div key={index} className="mb-2 p-2 border rounded">
                <h4 className="font-medium">{chapter.title}</h4>
                <p>{chapter.content}</p>
              </div>
            ))}
          </div>

          {flashcards.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Flashcards</h3>
              {flashcards.map((card, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <p><strong>Front:</strong> {card.front}</p>
                  <p><strong>Back:</strong> {card.back}</p>
                </div>
              ))}
            </div>
          )}

          {quiz.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Quiz</h3>
              {quiz.map((quizItem, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <p><strong>Question:</strong> {quizItem.question}</p>
                  <p><strong>Options:</strong> {quizItem.options.join(', ')}</p>
                  <p><strong>Correct Answer:</strong> {quizItem.options[quizItem.correctAnswer]}</p>
                  <p><strong>Explanation:</strong> {quizItem.explanation}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setViewNoteDetails(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => (
    <div className="flex justify-between items-center mt-4">
      <button 
        onClick={() => setFilters({...filters, currentPage: pagination.currentPage - 1})}
        disabled={pagination.currentPage === 1}
        className="flex items-center px-4 py-2 border rounded disabled:opacity-50"
      >
        <ChevronLeft /> Previous
      </button>
      <span>
        Page {pagination.currentPage} of {pagination.totalPages} 
        (Total Notes: {pagination.totalNotes})
      </span>
      <button 
        onClick={() => setFilters({...filters, currentPage: pagination.currentPage + 1})}
        disabled={pagination.currentPage === pagination.totalPages}
        className="flex items-center px-4 py-2 border rounded disabled:opacity-50"
      >
        Next <ChevronRight />
      </button>
    </div>
  );

  if (loading) {
    return <div>Loading notes...</div>;
  }

  return (
    <div className="p-6">
      {/* Confirm Delete Dialog */}
      <ConfirmDialog 
        isOpen={!!deleteConfirmation}
        title="Delete Note"
        message={`Are you sure you want to delete the note "${deleteConfirmation?.noteTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => handleDeleteNote(deleteConfirmation.noteId)}
        onCancel={() => setDeleteConfirmation(null)}
      />

      {/* Note Details Modal */}
      {renderNoteDetailsModal()}

      <h1 className="text-2xl font-bold mb-4">Notes Management</h1>

      {/* Filters */}
      {renderFilterSection()}

      {/* Notes Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white dark:bg-gray-900 shadow-md rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Subject</th>
              <th className="px-4 py-2 text-left">Topic</th>
              <th className="px-4 py-2 text-left">Difficulty</th>
              <th className="px-4 py-2 text-left">Created By</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.map(renderNoteRow)}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
