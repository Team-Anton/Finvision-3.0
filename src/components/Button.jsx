function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-950 text-white hover:bg-slate-800",
    outline:
      "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    warning: "bg-amber-400 text-slate-950 hover:bg-amber-500",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
