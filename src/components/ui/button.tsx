import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "wine";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-medium transition-[transform,background-color,color,opacity] duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90",
  secondary: "border border-line/25 text-fg hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2/70",
  wine: "bg-wine text-on-wine hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-7 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  "aria-label"?: string;
}

export function ButtonLink({ href, children, variant = "primary", size = "md", className = "", ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}
