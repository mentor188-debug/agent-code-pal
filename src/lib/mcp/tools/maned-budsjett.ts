import { defineTool } from "@lovable.dev/mcp-js";
import { ToolError, defineTool as _defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ENGANGS, FASTE, debtsForMonth, monthSummary } from "../plan";

void _defineTool;

export default defineTool({
  name: "maned_budsjett",
  title: "Month budget",
  description:
    "Budget breakdown for one month: gross salary, tax, garnishment, net, fixed costs, one-off costs, debt payments and the resulting buffer.",
  inputSchema: {
    month: z.string().regex(/^\d{4}-\d{2}$/).describe("Month key, e.g. 2026-08."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ month }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const summary = monthSummary(month);
    if (!summary) throw new ToolError(`Ukjent måned: ${month}`);
    const payload = {
      ...summary,
      fasteUtgifter: FASTE,
      engangsUtgifter: ENGANGS[month] ?? [],
      krav: debtsForMonth(month),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
