"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";

import { useSession } from "../../hooks/useSession";
import { logout } from "../../services/backendApi";
import { getInitials } from "../../lib/initials";
import { roleLabel } from "../../lib/userDisplay";

interface TopNavProps {
  hasNotification?: boolean;
}

function TopNav({ hasNotification = false }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const sessionQuery = useSession();
  const queryClient = useQueryClient();
  const user = sessionQuery.data;
  // Sumber kebenaran lonceng: notifikasi belum dibaca. Prop hanya dipakai selagi data belum termuat.
  const unread = useUnreadNotifications(Boolean(user));
  const showBell = unread === undefined ? hasNotification : unread > 0;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (sessionQuery.isPending) return;
    if (!user) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pathname.startsWith("/admin") && user.role !== "admin") router.replace("/dashboard");
    if (
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/elderly") ||
        pathname.startsWith("/notifications") ||
        pathname.startsWith("/access") ||
        pathname.startsWith("/devices")) &&
      user.role === "admin"
    )
      router.replace("/admin");
    if (pathname.startsWith("/devices") && user.role !== "keluarga") router.replace("/dashboard");
    if (pathname.startsWith("/access") && user.role !== "keluarga") router.replace("/dashboard");
  }, [pathname, router, sessionQuery.isPending, user]);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const accountMenuItems: Array<{ label: string; path: string; icon: ReactNode }> = [
    {
      label: "Profil Saya",
      path: "/profile",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
        </svg>
      ),
    },
    {
      label: "Pengaturan",
      path: "/settings",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a8 8 0 0 0-1.7 1l-2.5-1-2 3.4L6.4 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.4 2.9h4l.4-2.9a8 8 0 0 0 1.7-1l2.5 1 2-3.4z" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsProfileOpen(false);

    try {
      await logout();
    } finally {
      // Buang cache sesi lama SEBELUM pindah halaman, biar TopNav di
      // halaman login/dashboard berikutnya nggak sempat nampilin identitas
      // user yang barusan logout.
      queryClient.setQueryData(["session"], null);
      router.push("/login");
    }
  };

  const gridIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );

  const monitoringMenuItems: Array<{
    label: string;
    path: string | null;
    icon: ReactNode;
    roles?: Array<"keluarga" | "tenaga_medis">;
  }> = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: gridIcon,
    },
    {
      label: "Data Lansia",
      path: "/elderly",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
        </svg>
      ),
    },
    {
      label: "Notifikasi",
      path: "/notifications",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      ),
    },
    {
      label: "Perangkat",
      path: "/devices",
      roles: ["keluarga"],
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="12" height="8" rx="1.5" />
          <path d="M7 17h4" />
          <circle cx="19" cy="9" r="3" />
        </svg>
      ),
    },
    {
      label: "Izin Akses",
      path: "/access",
      roles: ["keluarga"],
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="4" y="10" width="16" height="10" rx="1.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      ),
    },
  ];

  const adminMenuItems: Array<{ label: string; path: string; icon: ReactNode }> = [
    {
      label: "Dashboard Admin",
      path: "/admin",
      icon: gridIcon,
    },
    {
      label: "Manajemen Pengguna",
      path: "/admin/users",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="9" cy="8" r="3" />
          <path d="M2.5 19c.7-3 2.9-4.6 6.5-4.6s5.8 1.6 6.5 4.6" />
          <path d="M16.5 8.5a2.5 2.5 0 1 1 0-5" />
          <path d="M17.5 14.6c2.4.3 4 1.6 4.5 4.4" />
        </svg>
      ),
    },
    {
      label: "Manajemen Perangkat",
      path: "/admin/devices",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="12" height="8" rx="1.5" />
          <path d="M7 17h4" />
          <circle cx="19" cy="9" r="3" />
          <path d="M19 12v2m0 4h.01" />
        </svg>
      ),
    },
  ];

  const isAdmin = user?.role === "admin";

  const visibleMenuItems = isAdmin
    ? adminMenuItems
    : monitoringMenuItems.filter(
        (item) =>
          !item.roles || (user && item.roles.includes(user.role as "keluarga" | "tenaga_medis")),
      );

  return (
    <div className="sticky top-0 z-40 bg-surface">
      {/* Baris 1 — identitas & profil */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink font-serif text-sm text-paper"
            aria-hidden="true"
          >
            E
          </div>

          <div>
            <p className="font-serif text-base leading-none text-ink">ElderCare AI</p>
            <p className="mt-1 text-[11px] text-muted">Monitoring System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Buka notifikasi"
            onClick={() => router.push("/notifications")}
            className="relative rounded-lg p-2 text-muted transition hover:bg-paper hover:text-ink-soft"
          >
            <span className="text-lg" aria-hidden="true">
              ♢
            </span>

            {showBell && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger"
                role="status"
                aria-label="Ada notifikasi baru"
              />
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              className="flex items-center gap-3 rounded-lg py-1 pl-1 pr-2 transition hover:bg-paper"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent-dark"
                aria-hidden="true"
              >
                {user ? getInitials(user.name) : "…"}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-ink-soft">
                  {user?.name ?? "Memuat..."}
                </p>
                <p className="text-xs text-muted">{user ? roleLabel[user.role] : ""}</p>
              </div>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`hidden h-3.5 w-3.5 shrink-0 text-muted transition-transform sm:block ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isProfileOpen && (
              <div
                role="menu"
                aria-label="Menu profil"
                className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-lg)]"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink-soft">{user?.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {user ? roleLabel[user.role] : ""} · {user?.email}
                  </p>
                </div>

                <div className="py-1.5">
                  {accountMenuItems.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push(item.path);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-soft transition hover:bg-paper"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border py-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-danger/8 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    {isLoggingOut ? "Keluar..." : "Keluar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Baris 2 — strip tab navigasi ala editorial */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 sm:px-4 lg:px-6"
        aria-label="Navigasi utama"
      >
        {visibleMenuItems.map((item) => {
          const isActive = item.path !== null && pathname === item.path;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.path) {
                  router.push(item.path);
                }
              }}
              disabled={!item.path}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "text-accent-dark"
                  : item.path
                    ? "text-muted hover:text-ink-soft"
                    : "cursor-default text-muted/45"
              }`}
            >
              {item.icon}
              {item.label}

              {isActive && (
                <span
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default TopNav;
