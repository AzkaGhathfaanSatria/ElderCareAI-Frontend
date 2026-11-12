import { Suspense } from "react";
import PageLoadingFallback from "../../components/ui/PageLoadingFallback";
import ForgotPassword from "../../features/ForgotPassword";

export const metadata = { title: "Lupa Password | ElderCare AI" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ForgotPassword />
    </Suspense>
  );
}
