"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Panel from "@/app/components/panel";

const routes = [
  { href: "/", label: "home" },
  { href: "/projects", label: "projects" },
  { href: "/resume", label: "resume" },
  { href: "/hobbies", label: "hobbies" },
];

export default function Nav() {
  const pathname = usePathname();

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
          [{i}] {route.label}
        </Link>
      ))}
    </Panel>
  );
}
