import Link from "next/link";
import type { ReactNode } from "react";

type ScreenProps = {
  title?: ReactNode;
  lead?: ReactNode;
  back?: { href: string; label: string };
  /** Content above the title, e.g. a property photo. */
  media?: ReactNode;
  children?: ReactNode;
  /**
   * The screen's one primary action. On phones it docks to the bottom, in the thumb zone; from
   * tablet up it sits inline after the content.
   */
  dock?: ReactNode;
  width?: "narrow" | "wide";
};

export function Screen({ title, lead, back, media, children, dock, width = "narrow" }: ScreenProps) {
  const max = width === "narrow" ? "max-w-xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full ${max} px-5 md:px-8 ${dock ? "pb-40 md:pb-0" : ""}`}>
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-label font-semibold text-ink-2 hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </svg>
          {back.label}
        </Link>
      )}
      {media && <div className="mt-3">{media}</div>}
      {(title || lead) && (
        <div className={media ? "mt-6" : "mt-6 md:mt-10"}>
          {title && <h1 className="type-wide text-h1 text-balance text-ink">{title}</h1>}
          {lead && <p className="mt-3 max-w-prose text-lead text-ink-2 text-pretty">{lead}</p>}
        </div>
      )}
      {children && <div className="mt-6">{children}</div>}
      {dock && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-5 pb-[max(env(safe-area-inset-bottom),0.875rem)] pt-3 shadow-dock backdrop-blur-md md:static md:z-auto md:mt-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2 md:mx-0">{dock}</div>
        </div>
      )}
    </div>
  );
}

/** Centered message for empty, error and success states, with an optional illustration. */
export function StateMessage({
  icon,
  title,
  body,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start py-6">
      {icon && <div className="mb-5">{icon}</div>}
      <h2 className="type-wide text-h2 text-balance text-ink">{title}</h2>
      {body && <p className="mt-3 max-w-prose text-lead text-ink-2 text-pretty">{body}</p>}
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
}
