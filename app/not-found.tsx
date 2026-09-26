import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-10">
      <div className="pixel text-6xl text-accent-2">404</div>
      <p className="pixel mt-2">this page wandered off.</p>
      <p className="text-xs text-ink-soft mt-1">(´。＿。｀)</p>
      <Link href="/" className="btn mt-4 no-underline">
        ← back home
      </Link>
    </div>
  );
}
