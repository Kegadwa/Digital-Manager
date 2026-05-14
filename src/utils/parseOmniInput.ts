import type { Priority } from "@/types";
import { addDays, nextMonday, nextFriday, startOfTomorrow } from "date-fns";

export interface ParsedOmniInput {
  title: string;
  dueDate?: string;
  projectTag?: string; // raw tag text (e.g. "project-x"), caller resolves to ID
  priority: Priority;
  category?: string;
}

/**
 * Parses natural-language quick-add input into structured task data.
 *
 * Syntax:
 *   "Finish UI review tomorrow #project-x !high @design"
 *
 * - `tomorrow`, `today`, `next monday`, `next friday` → dueDate
 * - `#project-name` → projectTag (fuzzy-matched by caller)
 * - `!high`, `!low`, `!medium` → priority
 * - `@category` → category
 * - Everything else → title
 */
export function parseOmniInput(raw: string): ParsedOmniInput {
  let input = raw.trim();
  let priority: Priority = "medium";
  let dueDate: string | undefined;
  let projectTag: string | undefined;
  let category: string | undefined;

  // Extract priority: !high, !low, !medium
  const priorityMatch = input.match(/\s*!(high|medium|low)\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as Priority;
    input = input.replace(priorityMatch[0], "");
  }

  // Extract project tag: #project-name
  const projectMatch = input.match(/\s*#([\w-]+)/);
  if (projectMatch) {
    projectTag = projectMatch[1].replace(/-/g, " ").toLowerCase();
    input = input.replace(projectMatch[0], "");
  }

  // Extract category: @category-name
  const categoryMatch = input.match(/\s*@([\w-]+)/);
  if (categoryMatch) {
    category = categoryMatch[1].replace(/-/g, " ");
    category = category.charAt(0).toUpperCase() + category.slice(1);
    input = input.replace(categoryMatch[0], "");
  }

  // Extract date keywords
  const now = new Date();
  const datePatterns: [RegExp, () => Date][] = [
    [/\btoday\b/i, () => now],
    [/\btomorrow\b/i, () => startOfTomorrow()],
    [/\bnext\s+monday\b/i, () => nextMonday(now)],
    [/\bnext\s+friday\b/i, () => nextFriday(now)],
    [/\bnext\s+week\b/i, () => addDays(now, 7)],
    [/\bin\s+(\d+)\s+days?\b/i, () => {
      const m = input.match(/\bin\s+(\d+)\s+days?\b/i);
      return addDays(now, parseInt(m?.[1] || "1"));
    }],
  ];

  for (const [pattern, getDate] of datePatterns) {
    if (pattern.test(input)) {
      dueDate = getDate().toISOString();
      input = input.replace(pattern, "");
      break;
    }
  }

  // Clean up remaining title
  const title = input.replace(/\s+/g, " ").trim();

  return { title, dueDate, projectTag, priority, category };
}

/**
 * Fuzzy-match a project tag against a list of project names.
 * Returns the best matching project ID, or undefined.
 */
export function matchProject(
  tag: string,
  projects: { id: string; name: string }[]
): string | undefined {
  if (!tag) return undefined;
  const normalized = tag.toLowerCase();

  // Exact match first
  const exact = projects.find(
    (p) => p.name.toLowerCase() === normalized
  );
  if (exact) return exact.id;

  // Partial match (tag is substring of project name)
  const partial = projects.find((p) =>
    p.name.toLowerCase().includes(normalized)
  );
  if (partial) return partial.id;

  // Reverse partial (project name is substring of tag)
  const reverse = projects.find((p) =>
    normalized.includes(p.name.toLowerCase())
  );
  if (reverse) return reverse.id;

  // Word-start match (tag matches start of any word in project name)
  const wordStart = projects.find((p) =>
    p.name
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(normalized))
  );
  if (wordStart) return wordStart.id;

  return undefined;
}
