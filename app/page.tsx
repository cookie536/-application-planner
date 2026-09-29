const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Timeline", href: "/timeline" },
  { label: "Checklist", href: "/checklist" },
  { label: "Schedule", href: "/schedule" },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          AI Application Planner
        </h1>
        <p className="mt-4 text-lg text-zinc-500 sm:text-xl">
          Plan every application. Never miss a deadline.
        </p>

        <nav
          aria-label="Main sections"
          className="mt-14 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {navItems.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="flex h-20 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg font-medium text-zinc-900 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              {label}
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
