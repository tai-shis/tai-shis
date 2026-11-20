import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CarouselPage from "@/app/components/carousel-page";
import ProfileTablePanel from "@/app/components/admin/profile/profile-table-panel";
import { auth } from "@/app/lib/auth";
import {
  changeProfileRowVisibility,
  createProfileRow,
  removeProfileRow,
  updateProfileRowValues,
} from "@/app/lib/profile/actions";
import { listAllProfileRows } from "@/app/lib/profile/repository";
import type { ProfileRowActions, ProfileTableKey } from "@/app/lib/profile/tables";

export const metadata: Metadata = {
  title: "Admin - Tai Shishiba",
  robots: { index: false, follow: false },
};

type AdminSlide = { label: string; tables: ProfileTableKey[] };

const ADMIN_SLIDES: AdminSlide[] = [
  { label: "grilling", tables: ["qa"] },
  { label: "profile", tables: ["experience", "education", "skills", "projects", "hobbies", "facts"] },
];

const profileRowActions: ProfileRowActions = {
  create: createProfileRow,
  update: updateProfileRowValues,
  remove: removeProfileRow,
  setVisibility: changeProfileRowVisibility,
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") notFound();

  const rowsByTable = await listAllProfileRows();

  return (
    <CarouselPage
      title="Admin"
      sections={ADMIN_SLIDES.map((slide) => slide.label)}
      footerStart={<Link href="/" className="p-2 hover:text-accent transition-colors">[back to site]</Link>}
    >
      {ADMIN_SLIDES.map((slide) => (
        <div key={slide.label} className="w-full flex flex-col gap-4">
          {slide.tables.map((table) => (
            <ProfileTablePanel key={table} table={table} rows={rowsByTable[table]} actions={profileRowActions} />
          ))}
        </div>
      ))}
    </CarouselPage>
  );
}
