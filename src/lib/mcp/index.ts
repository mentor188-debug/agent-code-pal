import { auth, defineMcp } from "@lovable.dev/mcp-js";
import planOversikt from "./tools/plan-oversikt";
import listKrav from "./tools/list-krav";
import kreditorer from "./tools/kreditorer";
import manedBudsjett from "./tools/maned-budsjett";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "creative-canvas",
  title: "Creative Canvas",
  version: "0.1.0",
  instructions:
    "Verktøy for nedbetalingsplanen i Betaling Tracker. Bruk `plan_oversikt` for totalbildet, `maned_budsjett` for én måned, `list_krav` for enkeltkrav (KID, konto, saksnr) og `kreditorer` for oversikt per kreditor. Alle beløp er i NOK.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [planOversikt, manedBudsjett, listKrav, kreditorer],
});
