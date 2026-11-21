import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CarouselPage from "@/app/components/carousel-page";
import AiUsage from "@/app/components/admin/ai-usage";
import IngestionWorkspace from "@/app/components/admin/ingest/ingestion-workspace";
import ProfileTablePanel from "@/app/components/admin/profile/profile-table-panel";
import { auth } from "@/app/lib/auth";
import {
  approveAllPendingChanges,
  approvePendingChange,
  loadIngestionSession,
  loadSessionChanges,
  rejectAllPendingChanges,
  rejectPendingChange,
} from "@/app/lib/ingestion/actions";
import { getIngestionSpendTodayUsd, listIngestionSessions } from "@/app/lib/ingestion/repository";
import { INGESTION_DAILY_SPEND_CAP_USD, type PendingChangeActions } from "@/app/lib/ingestion/types";
import { DAILY_SPEND_CAP_USD } from "@/app/lib/chat/limits";
import { getSpendTodayUsd } from "@/app/lib/chat/repository";
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

type ProfileSlide = { label: string; tables: ProfileTableKey[] };

const INGEST_SLIDE_LABEL = "ingest";
const PROFILE_SLIDES: ProfileSlide[] = [
  { label: "grilling", tables: ["qa"] },
  { label: "profile", tables: ["experience", "education", "skills", "projects", "hobbies", "facts"] },
];

const profileRowActions: ProfileRowActions = {
  create: createProfileRow,
  update: updateProfileRowValues,
  remove: removeProfileRow,
  setVisibility: changeProfileRowVisibility,
};

const pendingChangeActions: PendingChangeActions = {
  approve: approvePendingChange,
  approveAll: approveAllPendingChanges,
  reject: rejectPendingChange,
  rejectAll: rejectAllPendingChanges,
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") notFound();

  const [rowsByTable, sessions, ingestUsd, chatUsd] = await Promise.all([
    listAllProfileRows(),
    listIngestionSessions(),
    getIngestionSpendTodayUsd(),
    getSpendTodayUsd(),
  ]);

  return (
    <CarouselPage
      title="Admin"
      sections={[INGEST_SLIDE_LABEL, ...PROFILE_SLIDES.map((slide) => slide.label)]}
      footerStart={<Link href="/" className="p-2 hover:text-accent transition-colors">[back to site]</Link>}
      footerCenter={
        <AiUsage ingestUsd={ingestUsd} ingestCapUsd={INGESTION_DAILY_SPEND_CAP_USD} chatUsd={chatUsd} chatCapUsd={DAILY_SPEND_CAP_USD} />
      }
    >
      <IngestionWorkspace
        sessions={sessions}
        loadSession={loadIngestionSession}
        loadChanges={loadSessionChanges}
        actions={pendingChangeActions}
      />
      {PROFILE_SLIDES.map((slide) => (
        <div key={slide.label} className="w-full flex flex-col gap-4">
          {slide.tables.map((table) => (
            <ProfileTablePanel key={table} table={table} rows={rowsByTable[table]} actions={profileRowActions} />
          ))}
        </div>
      ))}
    </CarouselPage>
  );
}
