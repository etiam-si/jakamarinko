// The top of a shell page: title, one line under it, and the page's main action on the right (under it on phones).
export function PageHeader({ title, lead, action }: { title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-balance font-stretch-expanded md:text-3xl">{title}</h1>
        {lead && <p className="max-w-2xl text-sm text-pretty text-muted-foreground md:text-base">{lead}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}
