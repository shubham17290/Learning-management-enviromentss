"use client";
// PHASE 5 §6 — global Navbar (guest/student/admin variants) + app shell.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const studentLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subjects", label: "Subjects" },
  { href: "/practice", label: "Practice" },
  { href: "/analytics", label: "Analytics" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/mistakes", label: "Mistakes" },
];

export function Navbar() {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();

  const links = user?.role === "admin" || user?.role === "moderator" ? [...studentLinks, { href: "/admin", label: "Admin" }] : studentLinks;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-content items-center gap-2 px-4 py-2 sm:px-8">
        <Link href="/" className="touch-target flex items-center gap-2 font-bold text-primary">
          <span aria-hidden="true">🎓</span>
          <span className="text-base">GATE PYQ</span>
        </Link>

        {status === "authenticated" && (
          <ul className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-11 items-center rounded-md2 px-3 text-sm font-medium ${
                      active ? "bg-[color:var(--primary-soft)] text-primary" : "text-muted hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="ml-auto flex items-center gap-2">
          {status === "authenticated" ? (
            <>
              <Link
                href="/profile"
                className="hidden touch-target items-center rounded-full bg-[color:var(--primary-soft)] px-3 text-sm font-medium text-primary sm:inline-flex"
                aria-label={`Signed in as ${user?.full_name ?? user?.email}`}
              >
                {(user?.full_name ?? "U").slice(0, 1).toUpperCase()}
              </Link>
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="touch-target inline-flex items-center px-3 text-sm font-medium text-muted hover:text-ink">
                Log in
              </Link>
              <Link href="/register" className="touch-target inline-flex items-center rounded-md2 bg-primary px-3.5 text-sm font-medium text-white hover:bg-[color:var(--primary-strong)]">
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>

      {status === "authenticated" && (
        <nav aria-label="Mobile" className="border-t border-line md:hidden">
          <ul className="flex overflow-x-auto px-2">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-11 items-center px-3 text-sm font-medium ${active ? "text-primary" : "text-muted"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
