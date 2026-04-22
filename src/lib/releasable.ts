// Shared logic for determining whether a lawsuit/policy is "liberável"
// (releasable guarantee capital). Used by SearchDashboard and Historico.

export interface ReleasableSentence {
  is_termination: boolean;
  release_confidence?: string | null;
}

export interface ReleasablePolicy {
  end_date: string | null;
}

// A termination sentence is considered releasable unless the AI assessed
// release_confidence as "baixa" (typically: procedente with active guarantee,
// interlocutory decisions, or condemnations that can still be executed).
// null/undefined release_confidence (legacy rows without AI assessment) is
// treated as releasable to preserve backward compatibility.
export const isSentenceReleasable = (s: ReleasableSentence): boolean => {
  if (!s.is_termination) return false;
  return s.release_confidence !== "baixa";
};

// Policy vigência: end_date in the future or missing.
export const isPolicyActive = (endDate: string | null): boolean => {
  if (!endDate) return true;
  try {
    return new Date(endDate) >= new Date();
  } catch {
    return true;
  }
};

// Capital liberável only counts policies that are BOTH tied to a releasable
// lawsuit AND still vigente. Expired policies can't be cancelled — they're
// already past their coverage window.
export const isPolicyReleasable = (
  p: ReleasablePolicy,
  lawsuitIsReleasable: boolean,
): boolean => lawsuitIsReleasable && isPolicyActive(p.end_date);

// ---------------------------------------------------------------------------
// Endorsement / renewal grouping
// ---------------------------------------------------------------------------
// A single apólice may appear multiple times in `insurance_policies` — the
// original document plus one row per endosso (aumento de IS, prorrogação de
// vigência, alteração de objeto) or renovação. They share the `policy_number`
// but may differ in `start_date`, `coverage_amount`, `end_date`.
//
// Summing coverage across rows double-counts. Group by (lawsuit_id,
// policy_number, insurer) and keep the most recent version as canonical:
// latest `start_date` wins, ties broken by higher `coverage_amount` (endossos
// usually raise IS), then by `id` for determinism.

export interface GroupablePolicy {
  id: string;
  lawsuit_id: string;
  policy_number: string | null;
  insurer: string | null;
  start_date: string | null;
  coverage_amount: number | null;
}

export interface PolicyGroup<P extends GroupablePolicy> {
  key: string;
  canonical: P;
  versions: P[];
  endorsementCount: number;
}

const normKey = (v: string | null | undefined): string =>
  (v || "").trim().toLowerCase();

const groupKey = (p: GroupablePolicy): string => {
  const num = normKey(p.policy_number);
  if (!num) return `singleton:${p.id}`;
  return `${p.lawsuit_id}|${num}|${normKey(p.insurer)}`;
};

const compareRecency = (a: GroupablePolicy, b: GroupablePolicy): number => {
  const da = a.start_date ? new Date(a.start_date).getTime() : 0;
  const db = b.start_date ? new Date(b.start_date).getTime() : 0;
  if (da !== db) return db - da;
  const ca = a.coverage_amount || 0;
  const cb = b.coverage_amount || 0;
  if (ca !== cb) return cb - ca;
  return a.id.localeCompare(b.id);
};

export function groupPoliciesByNumber<P extends GroupablePolicy>(
  policies: P[],
): PolicyGroup<P>[] {
  const buckets = new Map<string, P[]>();
  for (const p of policies) {
    const k = groupKey(p);
    const list = buckets.get(k);
    if (list) list.push(p);
    else buckets.set(k, [p]);
  }
  return Array.from(buckets.entries()).map(([key, versions]) => {
    versions.sort(compareRecency);
    return {
      key,
      canonical: versions[0],
      versions,
      endorsementCount: versions.length - 1,
    };
  });
}

export function canonicalPolicies<P extends GroupablePolicy>(policies: P[]): P[] {
  return groupPoliciesByNumber(policies).map((g) => g.canonical);
}

// ---------------------------------------------------------------------------
// Priority score — release_confidence × capital vigente
// ---------------------------------------------------------------------------
// When a search returns many liberáveis, the user cares about the combination
// of "quanto dá pra liberar" × "quão seguro é liberar". We use the AI-assessed
// release_confidence (already persisted per sentence) as the confidence axis.
//
// Weights:
//   alta  → 1.0
//   media → 0.5
//   null  → 0.7 (legacy rows without AI assessment — mild uncertainty penalty)
//   baixa → 0   (already excluded by isSentenceReleasable; kept for completeness)

export type ReleaseConfidence = "alta" | "media" | "baixa" | string | null | undefined;

export const confidenceWeight = (c: ReleaseConfidence): number => {
  switch (c) {
    case "alta":
      return 1.0;
    case "media":
      return 0.5;
    case "baixa":
      return 0;
    default:
      return 0.7;
  }
};

export interface PriorityResult {
  score: number;
  weight: number;
  maxConfidence: string | null;
}

// ---------------------------------------------------------------------------
// Guarantee type classification
// ---------------------------------------------------------------------------
// Brazilian seguro garantia judicial has distinct modalities that behave
// differently when the lawsuit terminates:
//   - recursal         — garante depósito recursal; cancela com julgamento do
//                        recurso (CLT art. 899), independente do desfecho.
//   - judicial         — substitui penhora em execução/cumprimento; só libera
//                        com extinção/quitação/substituição.
//   - cautelar         — garante tutela cautelar/caução; depende da decisão.
//   - outros           — fallback quando o texto não bate com os padrões.
//
// The AI extracts `guarantee_type` as free text (ex: "Seguro Garantia Judicial
// Para Depósito Recursal"). Classify deterministically via regex so downstream
// UI and reports can break capital down by modality without another AI call.
//
// NOTE: the conditional release logic (different rules per category) is
// intentionally NOT applied here — it requires AI re-assessment with full
// context. Tracked as Item 4 (prompt de análise profunda).

export type GuaranteeCategory = "recursal" | "judicial" | "cautelar" | "outros";

export const GUARANTEE_CATEGORY_LABEL: Record<GuaranteeCategory, string> = {
  recursal: "Recursal",
  judicial: "Judicial",
  cautelar: "Cautelar",
  outros: "Outros",
};

export function classifyGuaranteeType(raw: string | null | undefined): GuaranteeCategory {
  if (!raw) return "outros";
  const s = raw.toLowerCase();
  if (/recursal|dep[óo]sito\s+recursal/.test(s)) return "recursal";
  if (/cautelar|cau[çc][ãa]o/.test(s)) return "cautelar";
  if (/judicial|execu[çc][ãa]o|cumprimento\s+de\s+senten[çc]a|trabalhista/.test(s)) return "judicial";
  return "outros";
}

export function lawsuitPriority(
  sentences: Array<{ is_termination: boolean; release_confidence?: string | null }>,
  vigentCoverage: number,
): PriorityResult {
  let bestW = -1;
  let bestConf: string | null = null;
  for (const s of sentences) {
    if (!isSentenceReleasable(s as ReleasableSentence)) continue;
    const w = confidenceWeight(s.release_confidence);
    if (w > bestW) {
      bestW = w;
      bestConf = s.release_confidence ?? null;
    }
  }
  const weight = bestW < 0 ? 0 : bestW;
  return { score: vigentCoverage * weight, weight, maxConfidence: bestConf };
}
