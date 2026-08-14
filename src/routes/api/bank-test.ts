import { createFileRoute } from "@tanstack/react-router";
import { createSign, randomUUID } from "node:crypto";

const BASE_URL = "https://api.enablebanking.com";

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function normalizePem(raw: string): string {
  if (raw.includes("\n-----END")) return raw;
  if (raw.includes("\\n")) return raw.replace(/\\n/g, "\n");
  const match = raw.match(/-----BEGIN PRIVATE KEY-----\s*(.+?)\s*-----END PRIVATE KEY-----/s);
  if (match?.[1]) {
    const b64 = match[1].replace(/\s+/g, "");
    const lines = b64.match(/.{1,64}/g) ?? [b64];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
  }
  return raw;
}

export const Route = createFileRoute("/api/bank-test")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const appId = process.env["ENABLE_BANKING_APP_ID"];
          const rawPem = process.env["ENABLE_BANKING_PRIVATE_KEY_PEM"];
          if (!appId || !rawPem) throw new Error("Missing credentials");
          const pem = normalizePem(rawPem);

          const now = Math.floor(Date.now() / 1000);
          const header = { typ: "JWT", alg: "RS256", kid: appId };
          const payload = { iss: "enablebanking.com", aud: "api.enablebanking.com", iat: now, exp: now + 3600 };
          const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
          const sign = createSign("RSA-SHA256");
          sign.update(data);
          const signature = sign.sign(pem, "base64url");
          const jwt = `${data}.${signature}`;

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
            body: body.slice(0, 800),
          });
        } catch (e) {
          return Response.json({ error: (e as Error).message });
        }
      },
    },
  },
});
