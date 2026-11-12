"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Button from "../ui/Button";
import InlineNotice from "../ui/InlineNotice";
import Footer from "./Footer";
import PageHeaderBar from "./PageHeaderBar";
import TopNav from "./TopNav";

interface AccountPageShellProps {
  title: string;
  message?: string | null;
  children: ReactNode;
}

function AccountPageShell({ title, message, children }: AccountPageShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-paper">
      <TopNav />

      <main className="min-w-0">
        <PageHeaderBar
          eyebrow="Akun Saya"
          title={title}
          action={
            <Button variant="secondary" size="sm" onClick={() => router.back()}>
              ← Kembali
            </Button>
          }
        />

        <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
          {message && (
            <div className="mb-6">
              <InlineNotice variant="success">{message}</InlineNotice>
            </div>
          )}

          {children}
        </div>

        <Footer />
      </main>
    </div>
  );
}

export default AccountPageShell;
