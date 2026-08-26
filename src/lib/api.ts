import { supabase } from "@/integrations/supabase/client";

export type CodeBlock = { title: string; language: string; code: string };

export type NavTab = {
  id: string;
  title: string;
  slug: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningStep = {
  id: string;
  tab_id: string;
  step_number: number;
  title: string;
  subtitle: string;
  difficulty: string;
  estimated_time: string;
  display_order: number;
  status: string;
  image_base64: string | null;
  overview: string;
  description: string;
  objectives: string;
  commands: string;
  code_blocks: CodeBlock[];
  notes: string;
  best_practices: string;
  common_mistakes: string;
  troubleshooting: string;
  step_references: string;
  created_at: string;
  updated_at: string;
};

export type StepComment = {
  id: string;
  step_id: string;
  developer_name: string;
  role: string;
  avatar_base64: string | null;
  comment: string;
  is_pinned: boolean;
  created_at: string;
};

export type Resource = {
  id: string;
  tab_id: string | null;
  title: string;
  type: string;
  url: string;
  description: string;
  display_order: number;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseQuery = any;
const db = (): { from: (table: string) => LooseQuery } =>
  supabase as unknown as { from: (table: string) => LooseQuery };

/* ---------------- reads ---------------- */

export async function fetchTabs(): Promise<NavTab[]> {
  return unwrap(
    await db().from("nav_tabs").select("*").order("display_order", { ascending: true }),
  ) as NavTab[];
}

export async function fetchSteps(tabId: string): Promise<LearningStep[]> {
  if (!tabId) return [];
  const rows = unwrap(
    await db()
      .from("learning_steps")
      .select("*")
      .eq("tab_id", tabId)
      .order("display_order", { ascending: true }),
  ) as LearningStep[];
  return rows.map((r) => ({ ...r, code_blocks: normalizeBlocks(r.code_blocks) }));
}

export async function fetchAllSteps(): Promise<LearningStep[]> {
  const rows = unwrap(
    await db()
      .from("learning_steps")
      .select("*")
      .order("display_order", { ascending: true }),
  ) as LearningStep[];
  return rows.map((r) => ({ ...r, code_blocks: normalizeBlocks(r.code_blocks) }));
}

function normalizeBlocks(value: unknown): CodeBlock[] {
  if (Array.isArray(value)) return value as CodeBlock[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchComments(stepIds: string[]): Promise<StepComment[]> {
  if (stepIds.length === 0) return [];
  return unwrap(
    await db()
      .from("step_comments")
      .select("*")
      .in("step_id", stepIds)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
  ) as StepComment[];
}

export async function fetchAllComments(): Promise<StepComment[]> {
  return unwrap(
    await db()
      .from("step_comments")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
  ) as StepComment[];
}

export async function fetchResources(tabId?: string): Promise<Resource[]> {
  let query = db().from("resources").select("*").order("display_order", { ascending: true });
  if (tabId) query = query.eq("tab_id", tabId);
  return unwrap(await query) as Resource[];
}

/* ---------------- writes (admin only, enforced by database policies) ---------------- */

export async function createRow<T>(table: string, values: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().from(table).insert(values).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function updateRow<T>(
  table: string,
  id: string,
  values: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await db().from(table).update(values).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await db().from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `tab-${Date.now()}`
  );
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

export const RESOURCE_TYPES = [
  "Microsoft Learn",
  "GitHub Repository",
  "NuGet Package",
  "Postman Collection",
  "PDF Download",
  "Documentation",
  "YouTube Tutorial",
] as const;

export const CODE_LANGUAGES = [
  "csharp",
  "bash",
  "json",
  "xml",
  "sql",
  "yaml",
  "javascript",
  "typescript",
  "http",
] as const;
