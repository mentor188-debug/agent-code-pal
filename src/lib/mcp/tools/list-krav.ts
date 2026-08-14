import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { DEBTS, debtsForMonth } from "../plan";

export default defineTool({
  name: "list_krav",
  title: "List claims",
  description:
    "List debt claims in the payoff plan, optionally filtered by month (YYYY-MM), creditor name, or urgency. Includes amount, case number, KID and account.",
  inputSchema: {
    month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month key, e.g. 2026-08."),
    creditor: z.string().trim().min(1).optional().describe("Case-insensitive creditor filter."),
    onlyUrgent: z.boolean().optional().describe("Only claims flagged as urgent."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ month, creditor, onlyUrgent }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let rows = month ? debtsForMonth(month) : DEBTS;
    if (creditor) {
      const q = creditor.toLowerCase();
      rows = rows.filter((d) => d.creditor.toLowerCase().includes(q));
    }
    if (onlyUrgent) rows = rows.filter((d) => d.urgent);
    const payload = { count: rows.length, sum: rows.reduce((s, d) => s + d.amount, 0), krav: rows };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
