import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bank-test")({
  server: {
    handlers: {
      GET: async () => {
        const appId = process.env["ENABLE_BANKING_APP_ID"];
        const pem = process.env["ENABLE_BANKING_PRIVATE_KEY_PEM"];
        return Response.json({
          hasAppId: !!appId,
          hasPem: !!pem,
          appIdLength: appId?.length ?? 0,
          pemLength: pem?.length ?? 0,
          pemStartsWith: pem?.slice(0, 27) ?? "N/A",
        });
      },
    },
  },
});
