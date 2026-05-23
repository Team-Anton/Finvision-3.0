function Card({
  children,
  className = "",
  onClick = null,
  hoverable = false,
  padding = true,
}) {
  const base = "rounded-3xl bg-white shadow-sm ring-1 ring-slate-200";
  const hover = hoverable
    ? "cursor-pointer hover:shadow-md hover:ring-slate-300 transition-shadow"
    : "";
  const pad = padding ? "p-5" : "";

  return (
    <div
      onClick={onClick || undefined}
      className={`${base} ${hover} ${pad} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
