"use client";

import { useMemo, useRef, useState } from "react";
import Nav, { getNavPagePixels } from "@/app/components/nav";
import PageCarousel, { type SwipeSurface } from "@/app/components/page-carousel";

export type ShellProps = {
  /** One nav label per child slide, in the same order. */
  labels: string[];
  children: React.ReactNode;
};

export default function Shell({ labels, children }: ShellProps) {
  const [index, setIndex] = useState(0);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const navSwipeSurface = useMemo<SwipeSurface>(
    () => ({
      ref: navRef,
      getPagePixels: () => (navRef.current ? getNavPagePixels(navRef.current) : 0),
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <Nav labels={labels} index={index} dragPosition={dragPosition} onNavigate={setIndex} swipeRef={navRef} />
      <PageCarousel
        index={index}
        onNavigate={setIndex}
        onDragPositionChange={setDragPosition}
        swipeSurface={navSwipeSurface}
      >
        {children}
      </PageCarousel>
    </div>
  );
}
