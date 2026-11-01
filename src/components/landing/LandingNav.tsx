"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import BrandMark from "../ui/BrandMark";

const links = [
  { id: "tentang", label: "Tentang" },
  { id: "fitur", label: "Fitur" },
  { id: "alur", label: "Cara kerja" },
] as const;

/** Navigasi landing page: menempel di atas, berubah saat digulir, dan menandai bagian yang sedang dilihat. */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("tentang");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of links) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-b border-border bg-paper/85 shadow-[var(--shadow-card)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="ElderCare AI beranda">
          <BrandMark size={40} />
          <div>
            <p className="font-serif text-lg leading-none">ElderCare AI</p>
            <p className="mt-1 text-[10px] tracking-[0.13em] text-muted uppercase">
              Elder monitoring system
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 text-sm md:flex">
          {links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? "true" : undefined}
              className={`rounded-full px-4 py-2 transition-colors duration-200 ${
                active === link.id
                  ? "bg-accent/10 font-semibold text-accent-dark"
                  : "text-ink-soft hover:bg-surface hover:text-accent-dark"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-accent-dark active:scale-[0.98]"
          >
            Daftar
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-surface md:hidden"
          >
            <span aria-hidden="true" className="flex h-4 w-5 flex-col justify-between">
              <span
                className={`h-0.5 rounded bg-current transition-transform duration-300 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 rounded bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-0.5 rounded bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="landing-menu"
        className={`grid transition-all duration-300 ease-out md:hidden ${
          menuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 px-5 pb-4 text-sm sm:px-8">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
                tabIndex={menuOpen ? 0 : -1}
                className={`rounded-xl px-4 py-3 transition-colors duration-200 ${
                  active === link.id
                    ? "bg-accent/10 font-semibold text-accent-dark"
                    : "text-ink-soft hover:bg-surface"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingNav;
