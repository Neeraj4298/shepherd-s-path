import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Compass, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuidanceTopic {
  id: string;
  title: string;
  content: string | null;
  bible_verse: string | null;
}

interface SupportContact {
  id: string;
  label: string;
  type: string;
  url: string;
}

export default function GuidancePage() {
  const [topics, setTopics] = useState<GuidanceTopic[]>([]);
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('guidance_topics').select('*').order('created_at').then(({ data }) => { if (data) setTopics(data); });
    supabase.from('support_contacts').select('*').then(({ data }) => { if (data) setContacts(data); });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Guidance & Support</h1>
        <p className="text-muted-foreground font-body mt-1">Biblical encouragement for life's challenges</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map(topic => (
          <div key={topic.id} className="rounded-xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{topic.title}</h3>
            <p className={`font-body text-muted-foreground text-sm ${expandedTopic === topic.id ? '' : 'line-clamp-3'}`}>
              {topic.content}
            </p>
            {topic.content && topic.content.length > 150 && (
              <button onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)} className="text-xs text-accent font-body mt-2 hover:underline">
                {expandedTopic === topic.id ? 'Show less' : 'Read more'}
              </button>
            )}
            {topic.bible_verse && (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="font-body text-sm italic text-foreground">{topic.bible_verse}</p>
              </div>
            )}
          </div>
        ))}
        {topics.length === 0 && (
          <div className="col-span-full rounded-lg bg-card border border-border p-8 text-center">
            <Compass className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-body">No guidance topics available yet.</p>
          </div>
        )}
      </div>

      {/* Support Contacts */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Need to Talk?</h2>
        <div className="flex flex-wrap gap-3">
          {contacts.map(c => (
            <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-body">
                <ExternalLink className="h-4 w-4 mr-2" />
                {c.label}
              </Button>
            </a>
          ))}
          {contacts.length === 0 && <p className="text-muted-foreground font-body text-sm">No support contacts configured yet.</p>}
        </div>
      </div>
    </div>
  );
}
