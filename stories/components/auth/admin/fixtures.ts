import type { AdminUser } from "@/app/components/auth/admin/users-list";
import type { ApiKeySummary } from "@/app/components/auth/admin/api-keys";

export const adminUsers: AdminUser[] = [
  { id: "u1", username: "tai-shis", country: "CA", role: "admin", createdAt: new Date("2026-11-19T12:00:00Z") },
  { id: "u2", username: "octocat", country: "US", role: "user", createdAt: new Date("2026-11-20T08:30:00Z") },
  { id: "u3", username: "a-very-long-github-username-at-the-max1", country: null, role: "user", createdAt: new Date("2026-11-21T17:45:00Z") },
];

export const manyAdminUsers: AdminUser[] = Array.from({ length: 30 }, (_, i) => ({
  id: `bulk-${i}`,
  username: `visitor-${String(i + 1).padStart(2, "0")}`,
  country: ["CA", "US", "JP", "DE", null][i % 5],
  role: "user",
  createdAt: new Date(Date.UTC(2026, 10, 19, i)),
}));

export const apiKeys: ApiKeySummary[] = [
  { id: "k1", name: "laptop-cli", start: "Hx7aQ", createdAt: new Date("2026-11-19T13:00:00Z") },
  { id: "k2", name: null, start: null, createdAt: new Date("2026-11-20T09:15:00Z") },
];
