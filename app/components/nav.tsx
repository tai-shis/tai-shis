"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Panel from "@/app/components/panel";

const routes = [
  { href: "/", label: "home" },
  { href: "/projects", label: "projects" },
  { href: "/resume", label: "resume" },
  { href: "/hobbies", label: "hobbies" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const i = parseInt(e.key);
      if (!isNaN(i) && i >= 0 && i < routes.length) {
        router.push(routes[i].href);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <Panel name="nav" className="flex gap-0">
      {routes.map((route, i) => (
        <Link
          key={route.href}
          href={route.href}
          className={`px-4 py-2 text-sm transition-colors ${
            pathname === route.href ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <div className="sm:block hidden">
            [{i}] {route.label}
          </div>
          <div className="sm:hidden">
            {route.label}
          </div>
        </Link>
      ))}
    </Panel>
  );
}
