import type { RequestStatus } from "@jakamarinko/api";
import { StatusBadge as Badge, type StatusTone } from "@/components/ui/status-badge";

const tone: Record<RequestStatus, StatusTone> = { new: "info", answered: "success", done: "neutral" };

export function StatusBadge({ status, label }: { status: RequestStatus; label: string }) {
  return (
    <Badge tone={tone[status]} dot={status === "new"}>
      {label}
    </Badge>
  );
}
