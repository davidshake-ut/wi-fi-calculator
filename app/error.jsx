'use client';

// Route-segment error boundary: catches render/runtime errors so the app shows
// a recoverable screen instead of a broken page.
export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7f9] p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-500">
        {error?.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110"
      >
        Try again
      </button>
    </div>
  );
}
