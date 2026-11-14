import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Frames } from "./frames";

/** Development only: renders an app path inside fixed-width iframes for responsive QA. */
export default function FramesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <Frames />
    </Suspense>
  );
}
