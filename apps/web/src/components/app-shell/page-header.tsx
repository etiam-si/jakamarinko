// The title of a shell page, with an optional line under it.
export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance font-stretch-expanded md:text-4xl">{title}</h1>
      {lead && <p className="max-w-2xl text-pretty text-muted-foreground">{lead}</p>}
    </header>
  );
}
