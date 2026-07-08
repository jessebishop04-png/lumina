import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "ig" | "outline";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "bg-text-primary text-white hover:bg-[#404040] font-semibold",
  secondary: "bg-white border border-border text-text-primary hover:bg-surface-hover",
  ghost: "bg-transparent text-text-primary hover:bg-surface-hover",
  ig: "bg-ig-blue text-white hover:bg-ig-blue-hover font-semibold",
  outline: "bg-transparent border border-border text-text-primary hover:bg-surface-hover",
};

const sizeClasses = {
  sm: "px-4 py-1.5 text-xs rounded-full",
  md: "px-5 py-2 text-sm rounded-full",
  lg: "px-6 py-2.5 text-sm rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
