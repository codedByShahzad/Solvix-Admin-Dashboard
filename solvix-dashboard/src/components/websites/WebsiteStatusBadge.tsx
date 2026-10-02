import { Badge } from "@/components/ui";

export function WebsiteStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "success" : "neutral"} dot>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
