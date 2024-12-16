import { redirect } from 'next/navigation';
import NotesManagement from '@/components/admin/NotesManagement';

export default async function AdminNotesPage() {
  // Note: Authentication will be handled client-side
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Notes Management</h1>
      <NotesManagement />
    </div>
  );
}
