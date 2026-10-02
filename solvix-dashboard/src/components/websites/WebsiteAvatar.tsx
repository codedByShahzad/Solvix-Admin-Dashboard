import { cn } from "@/lib/cn";
import type { Website } from "@/types";

const GRADIENTS = [
  "from-[#5450E0] to-[#8B7CF6]",
  "from-[#0E9F6E] to-[#34D399]",
  "from-[#E4572E] to-[#F59E0B]",
  "from-[#2563EB] to-[#38BDF8]",
  "from-[#BE185D] to-[#F472B6]",
];

export function WebsiteAvatar({ website, size = "md" }: { website: Pick<Website, "name" | "id">; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-7 text-xs rounded-md", md: "size-9 text-sm rounded-lg", lg: "size-11 text-base rounded-xl" };
  const idx = [...(website.id || website.name)].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold text-white shadow-xs", sizes[size], GRADIENTS[idx])}
    >
      {website.name.charAt(0).toUpperCase()}
    </span>
  );
}
