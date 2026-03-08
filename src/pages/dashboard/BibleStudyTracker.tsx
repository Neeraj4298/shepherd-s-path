import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BibleBook {
  id: string;
  name: string;
  testament: string;
  chapter_count: number;
  book_order: number;
}

interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
}

interface Progress {
  chapter_id: string;
  notes: string | null;
  reflection: string | null;
}

export default function BibleStudyTracker() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Map<string, Progress>>(new Map());
  const [totalRead, setTotalRead] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
    fetchAllProgress();
  }, []);

  const fetchBooks = async () => {
    const { data } = await supabase.from('bible_books').select('*').order('book_order');
    if (data) setBooks(data);
    setLoading(false);
  };

  const fetchAllProgress = async () => {
    if (!user) return;
    const { data } = await supabase.from('bible_study_progress').select('chapter_id, notes, reflection').eq('user_id', user.id);
    if (data) {
      const map = new Map<string, Progress>();
      data.forEach(p => map.set(p.chapter_id, p));
      setProgress(map);
      setTotalRead(data.length);
    }
  };

  const fetchChapters = async (book: BibleBook) => {
    setSelectedBook(book);
    const { data } = await supabase.from('bible_chapters').select('*').eq('book_id', book.id).order('chapter_number');
    if (data) setChapters(data);
  };

  const toggleChapter = async (chapter: Chapter) => {
    if (!user) return;
    if (progress.has(chapter.id)) {
      await supabase.from('bible_study_progress').delete().eq('user_id', user.id).eq('chapter_id', chapter.id);
      const newProgress = new Map(progress);
      newProgress.delete(chapter.id);
      setProgress(newProgress);
      setTotalRead(t => t - 1);
    } else {
      await supabase.from('bible_study_progress').insert({ user_id: user.id, chapter_id: chapter.id });
      const newProgress = new Map(progress);
      newProgress.set(chapter.id, { chapter_id: chapter.id, notes: null, reflection: null });
      setProgress(newProgress);
      setTotalRead(t => t + 1);
      toast.success(`Marked ${selectedBook?.name} ${chapter.chapter_number} as read!`);
    }
  };

  const getBookProgress = (book: BibleBook) => {
    // We'd need chapters per book to calc this; for now show total
    return 0;
  };

  const oldTestament = books.filter(b => b.testament === 'old');
  const newTestament = books.filter(b => b.testament === 'new');

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Bible Study Tracker</h1>
          <p className="text-muted-foreground font-body mt-1">Track your reading through God's Word</p>
        </div>
        <div className="flex gap-4">
          <div className="rounded-lg bg-card border border-border px-4 py-2 shadow-soft">
            <p className="text-2xl font-bold font-heading text-accent">{totalRead}</p>
            <p className="text-xs text-muted-foreground font-body">Chapters Read</p>
          </div>
          <div className="rounded-lg bg-card border border-border px-4 py-2 shadow-soft">
            <p className="text-2xl font-bold font-heading text-accent">{books.filter(b => totalRead > 0).length > 0 ? Math.floor(totalRead / 11.89) : 0}%</p>
            <p className="text-xs text-muted-foreground font-body">Complete</p>
          </div>
        </div>
      </div>

      {selectedBook ? (
        <div className="space-y-4">
          <button onClick={() => setSelectedBook(null)} className="text-sm text-accent hover:underline font-body">← Back to all books</button>
          <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedBook.name}</h2>
          <p className="text-muted-foreground font-body">{selectedBook.chapter_count} chapters</p>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {chapters.map(ch => {
              const isRead = progress.has(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => toggleChapter(ch)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-body font-medium transition-all duration-200 ${
                    isRead
                      ? 'bg-accent text-accent-foreground shadow-gold'
                      : 'bg-card border border-border text-muted-foreground hover:border-accent/50'
                  }`}
                >
                  {isRead ? <Check className="h-4 w-4" /> : ch.chapter_number}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">Old Testament</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {oldTestament.map(book => (
                <button
                  key={book.id}
                  onClick={() => fetchChapters(book)}
                  className="rounded-lg bg-card border border-border p-3 text-left hover:border-accent/50 hover:shadow-soft transition-all duration-200"
                >
                  <p className="font-body font-medium text-foreground text-sm truncate">{book.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{book.chapter_count} ch.</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">New Testament</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {newTestament.map(book => (
                <button
                  key={book.id}
                  onClick={() => fetchChapters(book)}
                  className="rounded-lg bg-card border border-border p-3 text-left hover:border-accent/50 hover:shadow-soft transition-all duration-200"
                >
                  <p className="font-body font-medium text-foreground text-sm truncate">{book.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{book.chapter_count} ch.</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
