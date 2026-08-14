import { createSign, randomUUID } from "node:crypto";

const BASE_URL = "https://api.enablebanking.com";

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

/** Normalize PEM key: handle missing newlines, escaped \n, or spaces. */
function normalizePem(raw: string): string {
  // Already has proper newlines
  if (raw.includes("\n-----END")) return raw;
  // Escaped \n
  if (raw.includes("\\n")) return raw.replace(/\\n/g, "\n");
  // No newlines at all — rebuild from content
  const match = raw.match(/-----BEGIN PRIVATE KEY-----\s*(.+?)\s*-----END PRIVATE KEY-----/s);
  if (match?.[1]) {
    const b64 = match[1].replace(/\s+/g, "");
    // Re-wrap at 64 chars per line
    const lines = b64.match(/.{1,64}/g) ?? [b64];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
  }
  return raw;
}

function makeJWT(): string {
  const appId = process.env["ENABLE_BANKING_APP_ID"];
  const rawPem = process.env["ENABLE_BANKING_PRIVATE_KEY_PEM"];
  if (!appId || !rawPem) throw new Error("Enable Banking ikke konfigurert");
  const pem = normalizePem(rawPem);

  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "RS256", kid: appId };
  const payload = {
    iss: "enablebanking.com",
    aud: "api.enablebanking.com",
    iat: now,
    exp: now + 3600,
  };

  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  const signature = sign.sign(pem, "base64url");
  return `${data}.${signature}`;
}

async function ebFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const jwt = makeJWT();
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${jwt}`);
  headers.set("Content-Type", "application/json");
  headers.set("X-Request-Id", randomUUID());
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const body = await res.json();
  if (!res.ok) {
    const msg =
      (body as { message?: string }).message ??
      (body as { error?: string }).error ??
      JSON.stringify(body);
    throw new Error(`Enable Banking ${res.status}: ${msg}`);
  }
  return body as T;
}

// ---- Types ----

export type BankInfo = {
  name: string;
  country: string;
  logo?: string;
  maximum_consent_validity?: number;
};

export type AccountInfo = {
  uid: string;
  account_id: { iban?: string; bban?: string };
  name?: string;
  currency?: string;
  details?: string;
  product?: string;
};

export type SessionResponse = {
  session_id: string;
  accounts: AccountInfo[];
};

export type Balance = {
  name?: string;
  balance_amount: { currency: string; amount: string };
};

export type Transaction = {
  transaction_id?: string;
  transaction_amount: { currency: string; amount: string };
  credit_debit_indicator: "CRDT" | "DBIT";
  booking_date?: string;
  value_date?: string;
  creditor?: { name?: string };
  debtor?: { name?: string };
  remittance_information?: string[];
  reference_number?: string;
  status?: string;
};

export type TransactionsResponse = {
  transactions: Transaction[];
  continuation_key?: string | null;
};

// ---- API ----

export async function listBanks(): Promise<BankInfo[]> {
  const data = await ebFetch<{ aspsps: BankInfo[] }>(`/aspsps?country=NO`);
  return data.aspsps ?? [];
}

export async function startAuth(
  bankName: string,
  redirectUrl: string,
  state: string,
): Promise<{ url: string; authorization_id: string }> {
  const validUntil = new Date(
    Date.now() + 90 * 24 * 60 * 60 * 1000,
  ).toISOString();
  return ebFetch<{ url: string; authorization_id: string }>("/auth", {
    method: "POST",
    body: JSON.stringify({
      access: { valid_until: validUntil, balances: true, transactions: true },
      aspsp: { name: bankName, country: "NO" },
      state,
      redirect_url: redirectUrl,
      psu_type: "personal",
      language: "no",
    }),
  });
}

export async function completeAuth(code: string): Promise<SessionResponse> {
  return ebFetch<SessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function getBalances(
  accountUid: string,
): Promise<{ balances: Balance[] }> {
  return ebFetch(`/accounts/${accountUid}/balances`);
}

export async function getTransactions(
  accountUid: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString();
  return ebFetch(`/accounts/${accountUid}/transactions${qs ? `?${qs}` : ""}`);
}
