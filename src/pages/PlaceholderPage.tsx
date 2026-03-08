export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">{title}</h1>
      <div className="rounded-lg bg-card border border-border p-8 text-center">
        <p className="text-muted-foreground font-body">This feature is coming in the next phase. Stay tuned!</p>
      </div>
    </div>
  );
}
