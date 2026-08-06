import {
  BookMarked,
  BookOpen,
  Boxes,
  Cloud,
  Code2,
  Database,
  FileCode,
  Github,
  Layers,
  Lock,
  Rocket,
  Server,
  Settings,
  Sparkles,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  BookMarked,
  Boxes,
  Cloud,
  Code2,
  Database,
  FileCode,
  Github,
  Layers,
  Lock,
  Rocket,
  Server,
  Settings,
  Sparkles,
  Terminal,
  Wrench,
};

export const ICON_NAMES = Object.keys(ICONS);

export function getIcon(name: string | null | undefined): LucideIcon {
  return ICONS[name ?? ""] ?? BookOpen;
}
