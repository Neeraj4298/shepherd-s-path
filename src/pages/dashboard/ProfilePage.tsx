import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [instagram, setInstagram] = useState(profile?.instagram_username || '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      instagram_username: instagram.trim() || null,
    }).eq('id', user.id);
    if (error) toast.error('Failed to save profile');
    else toast.success('Profile updated!');
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground font-body mt-1">Manage your account details</p>
      </div>

      <div className="rounded-xl bg-card border border-border p-6 shadow-soft space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
            <User className="h-8 w-8 text-accent" />
          </div>
          <div>
            <p className="font-heading text-xl font-semibold text-foreground">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground font-body">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-body">Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="font-body" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Instagram Username</Label>
            <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" className="font-body" />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Email</Label>
            <Input value={user?.email || ''} disabled className="font-body opacity-50" />
          </div>
        </div>

        <Button variant="gold" onClick={saveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="rounded-lg bg-card border border-border p-5 shadow-soft">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Account Info</h3>
        <div className="space-y-2 text-sm font-body">
          <p><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span></p>
          <p><span className="text-muted-foreground">Last login:</span> <span className="text-foreground">{profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : 'N/A'}</span></p>
          <p><span className="text-muted-foreground">Status:</span> <span className="text-accent font-medium capitalize">{profile?.status?.replace('_', ' ')}</span></p>
        </div>
      </div>
    </div>
  );
}
