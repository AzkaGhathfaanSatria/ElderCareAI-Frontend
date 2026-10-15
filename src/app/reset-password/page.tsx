import { Suspense } from "react";
import PageLoadingFallback from "../../components/ui/PageLoadingFallback";
import ResetPassword from "../../features/ResetPassword";

export const metadata = { title: "Reset Password | ElderCare AI" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ResetPassword />
    </Suspense>
  );
}
