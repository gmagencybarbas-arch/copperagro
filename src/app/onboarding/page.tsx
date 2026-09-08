"use client";

import { OnboardingWizard } from "@/modules/onboarding/onboarding-wizard";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const company = useAuthStore((s) => s.company);

  useEffect(() => {
    if (!sessionReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (company?.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [sessionReady, isAuthenticated, company?.onboardingCompleted, router]);

  if (!sessionReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f1] text-sm text-gray-500">
        A carregar…
      </div>
    );
  }

  if (company?.onboardingCompleted) return null;

  return <OnboardingWizard />;
}
