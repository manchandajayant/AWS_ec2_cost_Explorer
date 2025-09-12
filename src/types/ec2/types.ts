export type InstanceStatusLabel = "Idle" | "Under Utilized" | "Optimal" | "Over Utilized" | "Unknown";
export type SortKey = "status" | "region" | "type";

export type SortableKey = "statusLabel" | "region" | "type";
export type Direction = "asc" | "desc";

export type InstanceStatus = "Under Utilized" | "Optimal" | "Over Utilized" | "Idle" | "Unknown";

export type UtilCategory = "idle_under" | "optimal" | "over" | "unknown";
