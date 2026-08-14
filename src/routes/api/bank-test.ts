import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bank-test")({
  server: {
    handlers: {
      GET: async () => {
        const pem = process.env["ENABLE_BANKING_PRIVATE_KEY_PEM"];
        if (!pem) return Response.json({ error: "no pem" });
        return Response.json({
          length: pem.length,
          hasLiteralNewlines: pem.includes("\\n"),
          hasRealNewlines: pem.includes("\n"),
          first100: JSON.stringify(pem.slice(0, 100)),
          last50: JSON.stringify(pem.slice(-50)),
          newlinesCount: (pem.match(/\n/g) ?? []).length,
          escapedNewlinesCount: (pem.match(/\\n/g) ?? []).length,
        });
      },
    },
  },
});
