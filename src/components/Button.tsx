import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  fullWidth,
  variant = "primary",
  className = "",
  ...props
}) => {
  // Gaya dasar tombol
  const baseStyle =
    "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variasi warna tombol
  const variants = {
    primary:
      "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-md",
  };

  // Cek apakah tombol harus selebar layar penuh
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
