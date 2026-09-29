"use client";

import { ApplicationsProvider } from "@/app/applications-context";
import { CommonDocumentsProvider } from "@/app/common-documents-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationsProvider>
      <CommonDocumentsProvider>{children}</CommonDocumentsProvider>
    </ApplicationsProvider>
  );
}
