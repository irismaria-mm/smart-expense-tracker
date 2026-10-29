import {
  Briefcase,
  Bus,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  Shapes,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  house: House,
  clapperboard: Clapperboard,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  shapes: Shapes,
  briefcase: Briefcase,
  laptop: Laptop,
  gift: Gift,
};

export function CategoryIcon({ icon, color, className }: { icon: string; color: string; className?: string }) {
  const Icon = ICONS[icon] ?? Shapes;
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </span>
  );
}
