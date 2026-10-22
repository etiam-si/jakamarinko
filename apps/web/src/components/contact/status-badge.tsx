import { cn } from "cn";
import type { RequestStatus } from "@jakamarinko/api";

const tone: Record<RequestStatus, string> = {
  new: "bg-primary text-primary-foreground",
  answered: "bg-secondary text-secondary-foreground",
  done: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, label }: { status: RequestStatus; label: string }) {
  return <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs font-medium", tone[status])}>{label}</span>;
}
