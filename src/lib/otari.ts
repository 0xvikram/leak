import "server-only";
import OpenAI from "openai";

export const OTARI_BASE_URL = "https://otari.ai/api/v1";

// Model roles. A routing policy name can stand in for a model id, which is how
// the extract step gets Otari's fallback.
export const MODELS = {
  extract: process.env.OTARI_EXTRACT_MODEL ?? "alibaba/qwen-3.5-35b-a3b",
  research: process.env.OTARI_RESEARCH_MODEL ?? "deepseek/deepseek-v4-flash",
  draft: process.env.OTARI_DRAFT_MODEL ?? "mistralai/ministral-3-8b",
};

let client: OpenAI | null = null;

/** One client per server process. A service key, when set, is what lets each request name a household member. */
export function otari(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OTARI_SERVICE_KEY || process.env.OTARI_API_KEY;
  if (!apiKey) throw new Error("Set OTARI_API_KEY (or OTARI_SERVICE_KEY) in .env.local");
  client = new OpenAI({ apiKey, baseURL: OTARI_BASE_URL, timeout: 120_000, maxRetries: 1 });
  return client;
}

export const usesServiceKey = () => Boolean(process.env.OTARI_SERVICE_KEY);

/** What Otari reported about one request: who served it, what it cost, which tools ran. */
export type OtariTrace = {
  step: string;
  requestId: string | null;
  model: string;
  servedBy: string | null;
  provider: string | null;
  fallback: boolean;
  attempts: number | null;
  guardrails: string | null;
  endUserBudget: string | null;
  costUsd: number;
  promptTokens: number;
  completionTokens: number;
  toolCalls: OtariToolCall[];
  ms: number;
};

export type OtariToolCall = {
  type: string;
  status: string;
  query?: string;
  url?: string;
  code?: string;
  stdout?: string;
  exit_code?: number;
  sources?: { url: string; title?: string }[];
};

type ChatParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & Record<string, unknown>;

/** A chat completion through Otari that also returns the gateway's own account of it. */
export async function chat(step: string, params: ChatParams) {
  const started = Date.now();
  const { data, response } = await otari().chat.completions.create(params).withResponse();
  const h = response.headers;
  const raw = data as unknown as {
    usage?: { cost_usd?: string; prompt_tokens?: number; completion_tokens?: number };
    otari_tool_calls?: OtariToolCall[];
  };
  const trace: OtariTrace = {
    step,
    requestId: h.get("otari-request-id"),
    model: String(params.model),
    servedBy: h.get("otari-model"),
    provider: h.get("otari-provider"),
    fallback: h.get("otari-fallback") === "true",
    attempts: Number(h.get("otari-attempt-count")) || null,
    guardrails: h.get("otari-guardrails"),
    endUserBudget: h.get("otari-end-user-budget"),
    costUsd: Number(raw.usage?.cost_usd ?? 0),
    promptTokens: raw.usage?.prompt_tokens ?? 0,
    completionTokens: raw.usage?.completion_tokens ?? 0,
    toolCalls: raw.otari_tool_calls ?? [],
    ms: Date.now() - started,
  };
  return { text: data.choices[0]?.message?.content ?? "", trace };
}

/** Otari's refusals carry a stable code; surface it so the UI can explain a budget or guardrail stop. */
export function otariError(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof OpenAI.APIError) {
    const body = (err.error ?? {}) as { code?: string; detail?: unknown };
    const detail = body.detail as { code?: string; message?: string } | string | undefined;
    const code =
      body.code ?? (typeof detail === "object" ? detail?.code : undefined) ?? err.headers?.get?.("otari-error-code") ?? "error";
    const message = typeof detail === "string" ? detail : (detail?.message ?? err.message);
    return { status: err.status ?? 500, code: String(code), message };
  }
  return { status: 500, code: "error", message: err instanceof Error ? err.message : String(err) };
}

/** Runs a program in Otari's code sandbox, with no model in the loop. */
export async function runCode(step: string, code: string) {
  const started = Date.now();
  const apiKey = process.env.OTARI_SERVICE_KEY || process.env.OTARI_API_KEY;
  const res = await fetch(`${OTARI_BASE_URL}/code/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Otari-Key": String(apiKey) },
    body: JSON.stringify({ code, timeout_seconds: 30 }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    stdout?: string;
    stderr?: string;
    return_code?: number;
    detail?: unknown;
  };
  if (!res.ok || body.return_code !== 0) {
    throw Object.assign(new Error(`Code execution failed (${res.status}): ${body.stderr || JSON.stringify(body.detail ?? "")}`), {
      status: res.status,
    });
  }
  const trace: OtariTrace = {
    step,
    requestId: res.headers.get("otari-request-id"),
    model: "sandbox",
    servedBy: "Otari code execution",
    provider: null,
    fallback: false,
    attempts: null,
    guardrails: null,
    endUserBudget: null,
    costUsd: Number(res.headers.get("otari-cost-usd") ?? 0.01),
    promptTokens: 0,
    completionTokens: 0,
    toolCalls: [{ type: "code_execution", status: "completed", code, stdout: body.stdout, exit_code: 0 }],
    ms: Date.now() - started,
  };
  return { stdout: body.stdout ?? "", trace };
}
