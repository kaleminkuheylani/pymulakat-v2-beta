// app/interviews/[category]/[id]/page.tsx
// Next.js 16 (16.2.6) — async params + server-side mobile detection

import { headers } from "next/headers";
import WorkspaceClient from "./WorkspaceClient";
import WorkspaceMobileClient from "./WorkspaceMobileClient";

interface PageProps {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function isMobileDevice(): Promise<boolean> {
  try {
    const h = await headers();
    const userAgent = h.get("user-agent") || "";
    const lowerUA = userAgent.toLowerCase();

    return (
      /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(
        lowerUA
      ) || /ipad|android(?!.*mobile)/i.test(lowerUA)
    );
  } catch {
    return false;
  }
}

export default async function Page({ params }: PageProps) {
  // Next.js 16: params bir Promise
  const [resolvedParams, mobile] = await Promise.all([
    params,
    isMobileDevice(),
  ]);

  const Component = mobile ? WorkspaceMobileClient : WorkspaceClient;

  // ✅ initialParams objesini her iki component'e de geçir
  return <Component initialParams={resolvedParams} />;
}