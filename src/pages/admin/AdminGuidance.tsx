import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Topic { id: string; title: string; content: string | null; bible_verse: string | null; }
interface Contact { id: string; label: string; type: string; url: string; }

export default function AdminGuidance() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [verse, setVerse] = useState('');
  const [cLabel, setCLabel] = useState('');
  const [cUrl, setCUrl] = useState('');
  const [cType, setCType] = useState<'whatsapp' | 'instagram'>('whatsapp');

  const fetchAll = async () => {
    const { data: t } = await supabase.from('guidance_topics').select('*').order('created_at');
    const { data: c } = await supabase.from('support_contacts').select('*');
    if (t) setTopics(t);
    if (c) setContacts(c);
  };

  useEffect(() => { fetchAll(); }, []);

  const addTopic = async () => {
    if (!title.trim()) return;
    await supabase.from('guidance_topics').insert({ title: title.trim(), content: content.trim() || null, bible_verse: verse.trim() || null });
    toast.success('Topic added'); setTitle(''); setContent(''); setVerse(''); fetchAll();
  };

  const removeTopic = async (id: string) => {
    await supabase.from('guidance_topics').delete().eq('id', id);
    toast.success('Topic removed'); fetchAll();
  };

  const addContact = async () => {
    if (!cLabel.trim() || !cUrl.trim()) return;
    await supabase.from('support_contacts').insert({ label: cLabel.trim(), url: cUrl.trim(), type: cType });
    toast.success('Contact added'); setCLabel(''); setCUrl(''); fetchAll();
  };

  const removeContact = async (id: string) => {
    await supabase.from('support_contacts').delete().eq('id', id);
    toast.success('Contact removed'); fetchAll();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Guidance Management</h1>

      <div className="rounded-lg bg-card border border-border p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Add Topic</h2>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..." className="font-body" />
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content..." rows={3} className="font-body" />
        <Input value={verse} onChange={e => setVerse(e.target.value)} placeholder="Bible verse..." className="font-body" />
        <Button variant="gold" onClick={addTopic} className="font-body"><Plus className="h-4 w-4 mr-2" /> Add Topic</Button>
      </div>

      <div className="space-y-3">
        {topics.map(t => (
          <div key={t.id} className="rounded-lg bg-card border border-border p-4 flex justify-between items-start">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{t.title}</h3>
              <p className="text-sm text-muted-foreground font-body line-clamp-2">{t.content}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => removeTopic(t.id)} className="text-destructive shrink-0 ml-4"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-card border border-border p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Add Support Contact</h2>
        <Input value={cLabel} onChange={e => setCLabel(e.target.value)} placeholder="Label..." className="font-body" />
        <Input value={cUrl} onChange={e => setCUrl(e.target.value)} placeholder="URL..." className="font-body" />
        <select value={cType} onChange={e => setCType(e.target.value as any)} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
        </select>
        <Button variant="gold" onClick={addContact} className="font-body"><Plus className="h-4 w-4 mr-2" /> Add Contact</Button>
      </div>

      <div className="space-y-2">
        {contacts.map(c => (
          <div key={c.id} className="rounded-lg bg-card border border-border p-3 flex justify-between items-center">
            <span className="font-body text-foreground text-sm">{c.label} ({c.type})</span>
            <Button size="sm" variant="outline" onClick={() => removeContact(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
