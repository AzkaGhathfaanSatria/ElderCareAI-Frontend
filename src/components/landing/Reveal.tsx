"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

interface RevealProps {
  children: ReactNode;
  /** Jeda awal dalam milidetik, untuk memunculkan beberapa elemen bergantian. */
  delay?: number;
  className?: string;
}

/**
 * Memunculkan isinya dengan transisi halus (naik sambil memudar) saat masuk layar.
 * Tanpa JavaScript atau dengan "kurangi gerakan" aktif, isinya langsung terlihat.
 */
function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.shown = "true";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.shown = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <div
      ref={ref}
      data-reveal=""
      style={style}
      className={`translate-y-6 opacity-0 transition duration-700 ease-out data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100 ${className}`}
    >
      {children}
    </div>
  );
}

export default Reveal;
