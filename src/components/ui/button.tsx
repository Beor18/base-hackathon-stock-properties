import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "lg" | "md";

const base =
  "inline-flex items-center justify-center gap-2 text-center select-none transition-[background-color,color,border-color,transform] duration-150 ease-[var(--ease-out)] active:translate-y-px disabled:active:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover disabled:bg-surface-2 disabled:text-ink-3 type-semiwide",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink disabled:text-ink-3 disabled:border-line font-semibold",
  quiet: "text-accent underline-offset-4 hover:underline font-semibold disabled:text-ink-3",
  danger: "bg-surface text-danger border border-danger/40 hover:border-danger font-semibold",
};

const sizes: Record<Size, string> = {
  lg: "min-h-14 px-6 text-[1.0625rem] rounded-[var(--radius-control)]",
  md: "min-h-11 px-4 text-body rounded-[var(--radius-control)]",
};

const quietSizes: Record<Size, string> = {
  lg: "min-h-11 px-2 text-body",
  md: "min-h-11 px-1 text-label",
};

export function buttonClass(variant: Variant = "primary", size: Size = "lg", block = false): string {
  return [
    base,
    variants[variant],
    variant === "quiet" ? quietSizes[size] : sizes[size],
    block ? "w-full" : "",
  ].join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; block?: boolean };

export function Button({ variant, size, block, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClass(variant, size, block)} ${className}`} {...props} />;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant, size, block, className = "", ...props }: ButtonLinkProps) {
  return <Link className={`${buttonClass(variant, size, block)} ${className}`} {...props} />;
}

type ExternalButtonProps = ComponentProps<"a"> & { variant?: Variant; size?: Size; block?: boolean };

/** For links that leave the app (WhatsApp, external services). Opens in a new tab. */
export function ExternalButton({ variant, size, block, className = "", ...props }: ExternalButtonProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`${buttonClass(variant, size, block)} ${className}`}
      {...props}
    />
  );
}
