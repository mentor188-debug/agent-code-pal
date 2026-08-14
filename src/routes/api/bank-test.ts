import { createFileRoute } from "@tanstack/react-router";
import { createSign, randomUUID } from "node:crypto";

const BASE_URL = "https://api.enablebanking.com";

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function makeJWT(): string {
  const appId = process.env["ENABLE_BANKING_APP_ID"];
  let pem = process.env["ENABLE_BANKING_PRIVATE_KEY_PEM"];
  if (!appId || !pem) throw new Error("Missing credentials");
  pem = pem.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "RS256", kid: appId };
  const payload = { iss: "enablebanking.com", aud: "api.enablebanking.com", iat: now, exp: now + 3600 };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  const signature = sign.sign(pem, "base64url");
  return `${data}.${signature}`;
}

export const Route = createFileRoute("/api/bank-test")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const jwt = makeJWT();
          const res = await fetch(`${BASE_URL}/aspsps?country=NO`, {
            headers: {
              Authorization: `Bearer ${jwt}`,
              "X-Request-Id": randomUUID(),
            },
          });
          const body = await res.text();
          return Response.json({
            status: res.status,
            ok: res.ok,
            body: body.slice(0, 500),
          });
        } catch (e) {
          return Response.json({ error: (e as Error).message, stack: (e as Error).stack?.slice(0, 300) });
        }
      },
    },
  },
});
