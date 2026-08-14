import { createServerFn } from "@tanstack/react-start";
import {
  completeAuth,
  getBalances,
  getTransactions,
  listBanks,
  startAuth,
} from "./bank.server";

export const listNorwegianBanks = createServerFn({ method: "GET" }).handler(
  async () => listBanks(),
);

export const startBankAuth = createServerFn({ method: "POST" })
  .validator((data: { bankName: string; redirectUrl: string; state: string }) => data)
  .handler(async ({ data }) =>
    startAuth(data.bankName, data.redirectUrl, data.state),
  );

export const completeBankAuth = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => completeAuth(data.code));

export const fetchBankBalances = createServerFn({ method: "POST" })
  .validator((data: { accountUid: string }) => data)
  .handler(async ({ data }) => getBalances(data.accountUid));

export const fetchBankTransactions = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accountUid: string;
      dateFrom?: string;
      dateTo?: string;
    }) => data,
  )
  .handler(async ({ data }) =>
    getTransactions(data.accountUid, data.dateFrom, data.dateTo),
  );
