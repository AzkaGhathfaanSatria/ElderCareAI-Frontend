"use client";

import TopNav from "../layout/TopNav";
import Button from "./Button";

interface QueryStateScreenProps {
  /** Pesan singkat saat data sedang dimuat, mis. "Memuat dashboard..." */
  pendingMessage: string;
  /** Judul saat gagal memuat data, mis. "Gagal Memuat Dashboard" */
  errorTitle: string;
  /** Pesan fallback kalau error tidak punya message, mis. "Gagal mengambil data dashboard." */
  errorFallbackMessage: string;
  /** Pesan saat data kosong/tidak tersedia, mis. "Data dashboard belum tersedia." */
  emptyMessage: string;
}

interface QueryLikeState {
  isPending: boolean;
  isError: boolean;
  data: unknown;
  error?: { message?: string } | null;
  refetch: () => unknown;
}

/**
 * Menampilkan layar penuh untuk salah satu dari 3 state umum TanStack Query:
 * pending, error, atau data kosong. Dipakai bersama oleh halaman-halaman
 * yang mengandalkan satu query utama (Dashboard, Detail Monitoring Lansia, dst.)
 * supaya markup-nya tidak diduplikasi di tiap halaman.
 *
 * Mengembalikan `null` kalau query sudah punya data (tidak perlu render apa-apa),
 * supaya halaman pemanggil bisa lanjut render kontennya sendiri.
 */
function QueryStateScreen(props: QueryStateScreenProps & { query: QueryLikeState }) {
  const { query, pendingMessage, errorTitle, errorFallbackMessage, emptyMessage } = props;

  if (query.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <section
          className="rounded-xl bg-surface px-8 py-6 text-center shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />

          <p className="text-sm font-medium text-ink-soft">{pendingMessage}</p>
        </section>
      </main>
    );
  }

  if (query.isError) {
    return (
      <div className="min-h-screen bg-paper">
        <TopNav />
        <main className="flex min-h-[calc(100vh-113px)] items-center justify-center px-4">
          <section
            className="w-full max-w-md rounded-xl border border-danger/25 bg-surface p-6 text-center shadow-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 font-bold text-danger">
              !
            </div>

            <h1 className="text-lg font-bold text-ink">{errorTitle}</h1>

            <p className="mt-2 text-sm text-muted">
              {query.error?.message ?? errorFallbackMessage}
            </p>

            <Button
              variant="primary"
              size="sm"
              className="mt-5"
              onClick={() => {
                void query.refetch();
              }}
            >
              Coba Lagi
            </Button>
          </section>
        </main>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="min-h-screen bg-paper">
        <TopNav />
        <main className="flex min-h-[calc(100vh-113px)] items-center justify-center px-4">
          <section
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm"
            role="status"
          >
            <h1 className="text-lg font-bold text-ink">Data Tidak Tersedia</h1>

            <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
          </section>
        </main>
      </div>
    );
  }

  return null;
}

export default QueryStateScreen;
