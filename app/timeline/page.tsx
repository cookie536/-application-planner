import Link from "next/link";

export default function TimelinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Timeline
        </h1>
        <p className="mt-4 text-lg text-zinc-500 sm:text-xl">
          Track deadlines and milestones across every application.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 px-6 text-base font-medium text-zinc-900 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
