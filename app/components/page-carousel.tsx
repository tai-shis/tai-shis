"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { shouldIgnoreShortcut } from "@/app/lib/shortcuts";
import { SLIDE_DURATION_MS, SLIDE_EASING } from "@/app/lib/motion";

const GAP = 16;
const PANEL_SNAP_OFFSET = 8; // px gap kept above panel top when snapping (matches pt-2)
const INACTIVE_OPACITY = 0.3;
const SWIPE_THRESHOLD = 0.3;
const EDGE_RESISTANCE = 0.3;
const TRANSITION = `transform ${SLIDE_DURATION_MS}ms ${SLIDE_EASING}`;
const OPACITY_TRANSITION = `opacity ${SLIDE_DURATION_MS}ms ${SLIDE_EASING}`;

/** An element outside the carousel that also accepts swipes, at its own finger distance per page. */
export interface SwipeSurface {
  ref: React.RefObject<HTMLElement | null>;
  getPagePixels: () => number;
}

interface PageCarouselProps {
  index: number;
  onNavigate: (i: number) => void;
  /** Fractional page index while a swipe is in progress, null once it ends. */
  onDragPositionChange: (position: number | null) => void;
  swipeSurface: SwipeSurface;
  children: React.ReactNode;
}

export default function PageCarousel({
  index,
  onNavigate,
  onDragPositionChange,
  swipeSurface,
  children,
}: PageCarouselProps) {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [slideWidth, setSlideWidth] = useState(0);
  const slides = React.Children.toArray(children);

  const indexRef = useRef(index);
  useEffect(() => { indexRef.current = index; }, [index]);

  // Tracks the intended destination, updated synchronously in goToIndex so touch
  // handlers always have the correct base position even before React re-renders.
  const destRef = useRef(index);
  useEffect(() => { destRef.current = index; }, [index]);

  const slideWidthRef = useRef(slideWidth);
  useEffect(() => { slideWidthRef.current = slideWidth; }, [slideWidth]);

  // Read through a ref so a new callback identity never re-binds the touch listeners mid-drag.
  const onDragPositionChangeRef = useRef(onDragPositionChange);
  useEffect(() => { onDragPositionChangeRef.current = onDragPositionChange; }, [onDragPositionChange]);
  const swipeSurfaceRef = useRef(swipeSurface);
  useEffect(() => { swipeSurfaceRef.current = swipeSurface; }, [swipeSurface]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setSlideWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goToIndex = useCallback((i: number) => {
    if (i >= 0 && i < slides.length) {
      destRef.current = i; // sync update so touch handlers see new dest immediately
      onNavigate(i);
    }
  }, [onNavigate, slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      if (e.key === "ArrowLeft") { goToIndex(destRef.current - 1); return; }
      if (e.key === "ArrowRight") { goToIndex(destRef.current + 1); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      const scrollEl = scrollRefs.current[indexRef.current];
      if (!scrollEl) return;
      const panels = Array.from(scrollEl.querySelectorAll("[data-panel]")) as HTMLElement[];
      if (!panels.length) return;

      e.preventDefault();

      const containerTop = scrollEl.getBoundingClientRect().top;
      const panelTops = panels.map(
        p => p.getBoundingClientRect().top - containerTop + scrollEl.scrollTop - PANEL_SNAP_OFFSET
      );
      const cur = scrollEl.scrollTop;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

      if (e.key === "ArrowDown") {
        const next = panelTops.find(t => t > cur + 2);
        if (next !== undefined) scrollEl.scrollTo({ top: Math.max(0, next), behavior });
      } else {
        const prev = [...panelTops].reverse().find(t => t < cur - 2);
        scrollEl.scrollTo({ top: Math.max(0, prev ?? 0), behavior });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToIndex]);

  useEffect(() => {
    const el = containerRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;
    let dragBaseX = 0; // actual mid-animation position when drag started
    let trackPixelsPerFingerPixel = 1;

    const destBaseX = () => -(destRef.current * (slideWidthRef.current + GAP));

    const slideEls = () => Array.from(track.children) as HTMLElement[];

    const setOpacities = (activeOpacity: number, targetIdx: number, targetOpacity: number) => {
      slideEls().forEach((el, i) => {
        if (i === destRef.current) el.style.opacity = String(activeOpacity);
        else if (i === targetIdx) el.style.opacity = String(targetOpacity);
        else el.style.opacity = String(INACTIVE_OPACITY);
      });
    };

    const restoreOpacities = () => {
      slideEls().forEach((el, i) => {
        el.style.transition = OPACITY_TRANSITION;
        el.style.opacity = i === destRef.current ? "1" : String(INACTIVE_OPACITY);
      });
    };

    const startDrag = (e: TouchEvent, fingerPixelsPerPage: number) => {
      trackPixelsPerFingerPixel = fingerPixelsPerPage > 0 ? (slideWidthRef.current + GAP) / fingerPixelsPerPage : 1;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isHorizontal = null;

      // Read actual mid-animation position before disabling transition
      // without this, setting transition:none snaps the element to its animation target.
      const matrix = new DOMMatrix(getComputedStyle(track).transform);
      dragBaseX = matrix.m41;
      track.style.transition = "none";
      track.style.transform = `translateX(${dragBaseX}px)`;
      slideEls().forEach(el => { el.style.transition = "none"; });
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
        if (!isHorizontal) {
          restoreTransitions();
          snapBack();
        }
      }
      if (!isHorizontal) return;
      e.preventDefault();

      const trackDx = dx * trackPixelsPerFingerPixel;
      const atStart = destRef.current === 0 && trackDx > 0;
      const atEnd = destRef.current === slides.length - 1 && trackDx < 0;
      const effectiveDx = (atStart || atEnd) ? trackDx * EDGE_RESISTANCE : trackDx;

      track.style.transform = `translateX(${dragBaseX + effectiveDx}px)`;
      onDragPositionChangeRef.current(-(dragBaseX + effectiveDx) / (slideWidthRef.current + GAP));

      // Opacity: proportion of how far the drag is from the destination position
      const dist = Math.abs((dragBaseX + effectiveDx) - destBaseX());
      const progress = Math.min(dist / slideWidthRef.current, 1);
      const targetIdx = (dragBaseX + effectiveDx) < destBaseX()
        ? destRef.current + 1
        : destRef.current - 1;
      setOpacities(1 - progress * (1 - INACTIVE_OPACITY), targetIdx, INACTIVE_OPACITY + progress * (1 - INACTIVE_OPACITY));
    };

    const restoreTransitions = () => {
      track.style.transition = TRANSITION;
      slideEls().forEach(el => { el.style.transition = OPACITY_TRANSITION; });
    };

    const snapBack = () => {
      track.style.transform = `translateX(${destBaseX()}px)`;
      restoreOpacities();
    };

    const onEnd = (e: TouchEvent) => {
      restoreTransitions();
      if (!isHorizontal) return;
      onDragPositionChangeRef.current(null);
      const dx = (e.changedTouches[0].clientX - startX) * trackPixelsPerFingerPixel;
      const threshold = slideWidthRef.current * SWIPE_THRESHOLD;

      if (Math.abs(dx) > threshold) {
        const newIndex = dx < 0 ? destRef.current + 1 : destRef.current - 1;
        if (newIndex >= 0 && newIndex < slides.length) {
          goToIndex(newIndex);
          return;
        }
      }
      snapBack();
    };

    const onCancel = () => {
      restoreTransitions();
      if (!isHorizontal) return;
      onDragPositionChangeRef.current(null);
      snapBack();
    };

    const onContentStart = (e: TouchEvent) => startDrag(e, slideWidthRef.current + GAP);
    const onSurfaceStart = (e: TouchEvent) => startDrag(e, swipeSurfaceRef.current.getPagePixels());

    const bindings: [HTMLElement, (e: TouchEvent) => void][] = [[el, onContentStart]];
    const surfaceEl = swipeSurfaceRef.current.ref.current;
    if (surfaceEl) bindings.push([surfaceEl, onSurfaceStart]);

    for (const [target, onStart] of bindings) {
      target.addEventListener("touchstart", onStart, { passive: true });
      target.addEventListener("touchmove", onMove, { passive: false });
      target.addEventListener("touchend", onEnd, { passive: true });
      target.addEventListener("touchcancel", onCancel, { passive: true });
    }
    return () => {
      for (const [target, onStart] of bindings) {
        target.removeEventListener("touchstart", onStart);
        target.removeEventListener("touchmove", onMove);
        target.removeEventListener("touchend", onEnd);
        target.removeEventListener("touchcancel", onCancel);
      }
    };
  }, [goToIndex, slides.length]);

  const translateX = slideWidth > 0 ? -(index * (slideWidth + GAP)) : 0;

  return (
    <main
      ref={containerRef}
      className="flex-1 min-h-0 overflow-visible"
      style={{ touchAction: "pan-y" }}
    >
      <div
        ref={trackRef}
        className="flex h-full"
        style={{
          gap: GAP,
          transform: `translateX(${translateX}px)`,
          transition: slideWidth > 0 ? TRANSITION : "none",
          willChange: "transform",
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            onClick={() => goToIndex(i)}
            className="shrink-0 h-full"
            style={{
              width: slideWidth > 0 ? slideWidth : "100%",
              opacity: i === index ? 1 : INACTIVE_OPACITY,
              transition: OPACITY_TRANSITION,
            }}
          >
            {/* inert also blocks pointer hits, so clicks on a dimmed slide fall through to the wrapper above */}
            <div
              ref={(el) => { scrollRefs.current[i] = el; }}
              inert={i !== index}
              className="h-full overflow-y-auto no-scrollbar pt-2"
            >
              {slide}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
