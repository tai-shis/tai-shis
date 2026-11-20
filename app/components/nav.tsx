"use client";

import { useEffect } from "react";
import Panel from "@/app/components/panel";
import AuthDialog from "@/app/components/auth/auth-dialog";
import { shouldIgnoreShortcut } from "@/app/lib/shortcuts";
import { SLIDE_DURATION_MS, SLIDE_EASING } from "@/app/lib/motion";

interface NavProps {
  labels: string[];
  index: number;
  dragPosition: number | null;
  onNavigate: (i: number) => void;
  swipeRef: React.Ref<HTMLElement>;
}

/**
 * Finger travel on the mobile nav that equals one page: the distance the current label moves
 * from the center to a side slot. Uses widths only, since positions may be mid-transition.
 */
export function getNavPagePixels(nav: HTMLElement): number {
  const current = nav.querySelector<HTMLElement>("[aria-current]");
  return (nav.clientWidth - (current?.offsetWidth ?? 0)) / 2;
}

export default function Nav({ labels, index, dragPosition, onNavigate, swipeRef }: NavProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      const i = parseInt(e.key);
      if (!isNaN(i) && i >= 1 && i <= labels.length) onNavigate(i - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [labels.length, onNavigate]);

  return (
    <Panel name="nav" heading={false} className="flex items-center gap-0 z-10 order-last sm:order-none">
      <MobileNav
        labels={labels}
        position={dragPosition ?? index}
        isDragging={dragPosition !== null}
        onNavigate={onNavigate}
        swipeRef={swipeRef}
      />
      <nav aria-label="Sections" className="hidden sm:flex">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => onNavigate(i)}
            aria-current={index === i ? "true" : undefined}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
              index === i ? "text-accent" : "text-muted hover:text-accent"
            }`}
          >
            [{i + 1}] {label}
          </button>
        ))}
      </nav>
      <div className="ml-auto hidden sm:block">
        <AuthDialog />
      </div>
    </Panel>
  );
}

interface MobileNavProps {
  labels: string[];
  position: number;
  isDragging: boolean;
  onNavigate: (i: number) => void;
  swipeRef: React.Ref<HTMLElement>;
}

function MobileNav({ labels, position, isDragging, onNavigate, swipeRef }: MobileNavProps) {
  return (
    <nav ref={swipeRef} aria-label="Sections" className="relative h-9 w-full overflow-hidden touch-pan-y sm:hidden">
      {labels.map((label, i) => (
        <MobileNavItem
          key={label}
          label={label}
          offset={i - position}
          isDragging={isDragging}
          onSelect={() => onNavigate(i)}
        />
      ))}
    </nav>
  );
}

// Indexed by offset + 2, covering offsets -2 to 2. Offsets of ±2 sit just outside the nav,
// so labels slide in and out instead of popping.
const SLOT_LEFT_PERCENT = [0, 0, 50, 100, 100];
const SLOT_SHIFT_PERCENT = [-100, 0, -50, -100, 0];
const MAX_SLOT_OFFSET = 2;

function getSlotValue(values: number[], offset: number): number {
  const slot = Math.max(-MAX_SLOT_OFFSET, Math.min(MAX_SLOT_OFFSET, offset)) + MAX_SLOT_OFFSET;
  const lower = Math.floor(slot);
  const upper = Math.min(lower + 1, values.length - 1);
  return values[lower] + (values[upper] - values[lower]) * (slot - lower);
}

function clampOpacity(value: number): number {
  return Math.max(0, Math.min(1, value));
}

const slideTiming = {
  transitionDuration: `${SLIDE_DURATION_MS}ms`,
  transitionTimingFunction: SLIDE_EASING,
};

interface MobileNavItemProps {
  label: string;
  offset: number;
  isDragging: boolean;
  onSelect: () => void;
}

function MobileNavItem({ label, offset, isDragging, onSelect }: MobileNavItemProps) {
  const nearestSlot = Math.round(offset);
  const isCurrent = nearestSlot === 0;
  const isVisible = Math.abs(nearestSlot) <= 1;
  const left = getSlotValue(SLOT_LEFT_PERCENT, offset);
  const shift = getSlotValue(SLOT_SHIFT_PERCENT, offset);
  const transitionClass = isDragging ? "transition-none" : "motion-reduce:transition-none";

  return (
    <button
      onClick={onSelect}
      inert={!isVisible}
      aria-current={isCurrent ? "true" : undefined}
      className={`absolute top-0 px-2 py-2 text-sm whitespace-pre cursor-pointer transition-[left,transform,opacity,color] ${transitionClass} ${
        isCurrent ? "text-accent" : "text-muted hover:text-accent"
      }`}
      style={{
        ...slideTiming,
        left: `${left}%`,
        transform: `translateX(${shift}%)`,
        opacity: clampOpacity(MAX_SLOT_OFFSET - Math.abs(offset)),
      }}
    >
      <span
        aria-hidden="true"
        className={`transition-opacity ${transitionClass}`}
        style={{ ...slideTiming, opacity: clampOpacity(1 - offset) }}
      >
        {nearestSlot < 0 ? "< " : "[ "}
      </span>
      {label}
      <span
        aria-hidden="true"
        className={`transition-opacity ${transitionClass}`}
        style={{ ...slideTiming, opacity: clampOpacity(1 + offset) }}
      >
        {nearestSlot > 0 ? " >" : " ]"}
      </span>
    </button>
  );
}
