import { defineTool } from "@lovable.dev/mcp-js";
import { creditorOverview } from "../plan";

export default defineTool({
  name: "kreditorer",
  title: "Creditor overview",
  description:
    "Aggregated overview per creditor: total amount in the plan, number of cases, case numbers, KID numbers and urgency flag.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const kreditorer = creditorOverview();
    const payload = { count: kreditorer.length, kreditorer };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
