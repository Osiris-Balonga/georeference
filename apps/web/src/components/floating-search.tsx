"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
export function FloatingSearch({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (rect && rect.height > 0) setFloating(rect.bottom <= 0);
    };
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (!dock.current || floating) return;
    const measure = () =>
      setHeight(dock.current?.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(dock.current);
    return () => observer.disconnect();
  }, [floating]);
  return (
    <div className="search-anchor" ref={anchor} style={{ minHeight: height }}>
      <div className="search-dock" ref={dock} data-floating={floating}>
        {children}
      </div>
    </div>
  );
}
