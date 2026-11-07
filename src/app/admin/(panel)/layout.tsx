import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ExcludeFromAnalytics } from "@/components/analytics";
import { ToastProvider } from "@/components/admin/toast-provider";
import { MotionProvider } from "@/components/motion-provider";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <ToastProvider>
        <ExcludeFromAnalytics />
        <AdminHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </ToastProvider>
    </MotionProvider>
  );
}
