import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden="true">🧭</p>
      <h1 className="mt-3 text-2xl font-bold">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-muted">The link may be broken or the page may have moved.</p>
      <Link href="/" className="mt-6 inline-flex touch-target items-center rounded-md2 bg-primary px-5 font-medium text-white">Back home</Link>
    </div>
  );
}
