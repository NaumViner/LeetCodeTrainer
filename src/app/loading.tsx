export default function Loading() {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5"
      role="status"
    >
      <div className="text-muted flex items-center gap-3 text-sm font-medium">
        <span className="bg-primary size-2 animate-pulse rounded-full" />
        Preparing your academy
      </div>
    </div>
  );
}
