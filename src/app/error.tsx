"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#020617] p-6 text-center">
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="max-w-md text-sm text-white/50">
        {error.message || "Unexpected error in the observatory."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-400"
      >
        Try again
      </button>
    </div>
  );
}
