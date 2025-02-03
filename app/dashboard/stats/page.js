'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { fetchWithAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-lg font-medium">Loading your study statistics...</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, trend }) {
  return (
    <Card className="p-6 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
      {trend && (
        <div className={`mt-2 text-sm ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
          {trend.value}
        </div>
      )}
    </Card>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const response = await fetchWithAuth('/api/stats');
        if (response.success) {
          setStats(response.stats);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to fetch stats');
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (error) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
      <div className="text-center">
        <h3 className="text-lg font-medium text-red-500 mb-2">Error Loading Statistics</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );
  
  if (!stats) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">No Statistics Available</h3>
        <p className="text-muted-foreground">Start creating notes to see your study statistics!</p>
      </div>
    </div>
  );

  const pieData = [
    { name: 'With Flashcards', value: stats.notesWithFlashcards },
    { name: 'Without Flashcards', value: stats.totalNotes - stats.notesWithFlashcards }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Study Statistics</h1>
          <p className="text-muted-foreground mt-1">Track your learning progress and achievements</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Notes"
          value={stats.totalNotes}
          description="Notes created"
        />
        <StatCard
          title="Total Chapters"
          value={stats.totalChapters}
          description={`${stats.averageChaptersPerNote} chapters per note`}
        />
        <StatCard
          title="Flashcards Created"
          value={stats.totalFlashcards}
          description={`${stats.flashcardCompletionRate}% completion rate`}
        />
        <StatCard
          title="Notes with Flashcards"
          value={stats.notesWithFlashcards}
          description={`Out of ${stats.totalNotes} total notes`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Notes Created Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-6">Notes Created (Last 7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.notesPerDay}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Notes Created"
                  dot={{ strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Flashcards Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-6">Flashcards Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Chapter Distribution Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-6">Chapter Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={Object.entries(stats.chapterDistribution).map(([chapters, count]) => ({
                chapters: `${chapters} ${chapters === '1' ? 'Chapter' : 'Chapters'}`,
                count
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis dataKey="chapters" />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#8884d8" 
                name="Number of Notes"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
