"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Panel from "../../panel";
import { Chip } from "../../shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
  TableCaption,
} from "@/components/ui/table";

const stats = [
  {
    HID: 205,
    shortname: "Keyboards",
    longname: "Mechanical Keyboards",
    progress: 95,
    tooltip: "No, you cant eat the Krytox",
  },
  {
    HID: 432,
    shortname: "Music",
    longname: "Music",
    progress: 65,
    tooltip: "A = 432 Hz",
  },
  {
    HID: 28,
    shortname: "Fashion",
    longname: "Fashion",
    progress: 45,
    tooltip: "What waist?",
  },
  {
    HID: 600,
    shortname: "Audio",
    longname: "Audiophile",
    progress: 20,
    tooltip: "Huh Duh Six Hungeos"
  },
  {
    HID: 145,
    shortname: "Cooking",
    longname: "Cooking",
    progress: 20,
    tooltip: "Ketchup with your steak?",
  },
  {
    HID: 20,
    shortname: "Photography",
    longname: "Photography",
    progress: 15,
    tooltip: "Fujifilm X Series",
  },
];

function ProgressBar({ value, bars = 20, hovered = false, className }: { value: number; bars?: number; hovered?: boolean; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * bars);
  return (
    <span className={`font-mono inline-flex items-center gap-1 transition-colors ${hovered ? "text-sunset" : "text-muted"} ${className ?? ""}`}>
      <span>{"█".repeat(filled)}{"░".repeat(bars - filled)}</span>
    </span>
  );
}

function HIDCell({ hid, tooltip }: { hid: number; tooltip: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <span
      className="cursor-default"
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      <div className="text-right">
        {hid}
      </div>
      {pos && createPortal(
        <span
          className="fixed z-50 pointer-events-none"
          style={{ left: pos.x + 12, top: pos.y + 12 }}
        >
          <Chip label={tooltip} accent={true} />
        </span>,
        document.body
      )}
    </span>
  );
}

function StatsRow({ stat }: { stat: typeof stats[0] }) {
  const [hovered, setHovered] = useState(false);
  const text = hovered ? "text-sunset" : "text-muted";
  return (
    <TableRow
      className="border-0 hover:bg-transparent data-[state=selected]:bg-transparent transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <TableCell className={`${text} transition-colors`}>
        <HIDCell hid={stat.HID} tooltip={stat.tooltip} />
      </TableCell>
      <TableCell className={`${text} transition-colors`}>
        <div className="sm:hidden!">{stat.shortname}</div>
        <div className="hidden! sm:inline-flex!">{stat.longname}</div>
      </TableCell>
      <TableCell>
        <ProgressBar value={stat.progress} bars={13} hovered={hovered} className="sm:hidden!" />
        <ProgressBar value={stat.progress} bars={30} hovered={hovered} className="hidden! sm:inline-flex!" />
      </TableCell>
      <TableCell className={`${text} transition-colors text-right hidden sm:table-cell`}>
        {stat.progress}%
      </TableCell>
    </TableRow>
  );
}

function StatsTable() {
  return (
    <div className="pt-2 pb-4">
      <Table>
        <TableHeader className="[&_tr]:border-b [&_tr]:border-border">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="text-muted group-hover:text-accent transition-colors">HID</TableHead>
            <TableHead className="text-muted group-hover:text-accent transition-colors">Name</TableHead>
            <TableHead className="text-muted group-hover:text-accent transition-colors">Progress</TableHead>
            <TableHead className="text-muted group-hover:text-accent transition-colors hidden sm:table-cell"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:border-0">
          {stats.map((stat) => (
            <StatsRow key={stat.HID} stat={stat} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Stats() {
  return (
    <Panel name="stats" className="p-4 relative">
      <div className="px-2 flex flex-col text-sm text-muted">
        <p>
          Or, don&apos;t, instead here is my progress in each of my hobbies.
        </p>
        <p>(i.e. what I believe my progress is to reaching the "endgame" of this hobby)</p>
        <StatsTable />
        <p>
          Now, of course I could go deeper into the rabbit hole for all of these,
          but this is more of an idea of my progress relative to how far I&apos;d feasibly go.
        </p>
      </div>
    </Panel>
  );
}
