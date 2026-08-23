"use client";
// PHASE 5 §6 — Button: primary/secondary/danger/ghost, sm/md/lg, loading + disabled.
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-[color:var(--primary-strong)] disabled:bg-[#9aa7e0]",
  secondary:
    "bg-surface text-ink border border-line hover:border-muted disabled:text-muted",
  danger: "bg-danger text-white hover:brightness-90 disabled:opacity-50",
  ghost: "bg-transparent text-primary hover:bg-[color:var(--primary-soft)]",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base w-full sm:w-auto",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`touch-target inline-flex items-center justify-center gap-2 rounded-md2 font-medium transition-colors disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {children}
    </button>
  );
});
