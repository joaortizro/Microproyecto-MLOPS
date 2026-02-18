type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      {subtitle ? <p className="text-sm text-zinc-600">{subtitle}</p> : null}
    </header>
  );
}
