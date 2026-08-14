import { defineTool } from "@lovable.dev/mcp-js";
import { daysUntilDebtFree, GJELDFRI_DATO, MONTHS, monthSummary, totalPlan } from "../plan";

export default defineTool({
  name: "plan_oversikt",
  title: "Plan overview",
  description:
    "Overall payoff plan: total debt in the plan, target debt-free date, days remaining, and a per-month result summary.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const payload = {
      totalGjeldIPlan: totalPlan(),
      gjeldfriDato: GJELDFRI_DATO,
      dagerTilGjeldfri: daysUntilDebtFree(),
      maneder: MONTHS.map((m) => monthSummary(m.key)),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
