import { cn } from "@/lib/cn";
import { initials } from "@/utils/format";

const COLORS = [
  "bg-[#EEEDFD] text-[#433EC4] dark:bg-[#242248] dark:text-[#B2AFFF]",
  "bg-[#E1F6EA] text-[#15803D] dark:bg-[#122E20] dark:text-[#6EE7A8]",
  "bg-[#FDF3DB] text-[#B45309] dark:bg-[#34260E] dark:text-[#F5C46B]",
  "bg-[#E0EBFE] text-[#1D4ED8] dark:bg-[#142240] dark:text-[#93B8FB]",
  "bg-[#FCE7F3] text-[#BE185D] dark:bg-[#3A1428] dark:text-[#F9A8D4]",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  square,
}: {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  square?: boolean;
}) {
  const sizes = { xs: "size-6 text-2xs", sm: "size-8 text-xs", md: "size-9 text-sm", lg: "size-12 text-base", xl: "size-16 text-xl" };
  const shape = square ? "rounded-lg" : "rounded-full";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} className={cn(sizes[size], shape, "shrink-0 object-cover", className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-semibold",
        sizes[size],
        shape,
        COLORS[hash(name ?? "?") % COLORS.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
