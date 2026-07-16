export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      <span className="route-loading-bar" aria-hidden="true" />
    </div>
  );
}
