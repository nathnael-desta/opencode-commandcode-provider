import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const ROOT = join(import.meta.dir, "..")
const MODELS_JSON = join(ROOT, "models.json")
const MODELS_ENDPOINT = "https://api.commandcode.ai/provider/v1/models"

interface ModelEntry {
  id: string
  name: string
  tier: "premium" | "open-source"
  reasoning: boolean
  tool_call: boolean
  cost: { input: number; output: number; cache_read?: number; cache_write?: number }
  limit: { context: number; output: number }
}

interface ApiModel {
  id: string
  name: string
  context_length: number
}

const COSTS: Record<string, ModelEntry["cost"]> = {
  "claude-haiku-4-5-20251001": { input: 1, output: 5, cache_read: 0.1, cache_write: 1.25 },
  "claude-opus-4-7": { input: 5, output: 25, cache_read: 0.5, cache_write: 6.25 },
  "claude-opus-4-8": { input: 5, output: 25, cache_read: 0.5, cache_write: 6.25 },
  "claude-sonnet-4-6": { input: 3, output: 15, cache_read: 0.3, cache_write: 3.75 },
  "gpt-5.3-codex": { input: 2, output: 8, cache_read: 0.5 },
  "gpt-5.4": { input: 2.5, output: 15, cache_read: 0.25 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5, cache_read: 0.075 },
  "gpt-5.5": { input: 5, output: 30, cache_read: 0.5 },
  "gpt-5.6-sol": { input: 5, output: 30, cache_read: 0.5, cache_write: 6.25 },
  "gpt-5.6-terra": { input: 2.5, output: 15, cache_read: 0.25, cache_write: 3.125 },
  "gpt-5.6-luna": { input: 1, output: 6, cache_read: 0.1, cache_write: 1.25 },
  "deepseek/deepseek-v4-pro": { input: 0.435, output: 0.87, cache_read: 0.003625 },
  "deepseek/deepseek-v4-flash": { input: 0.14, output: 0.28, cache_read: 0.0028 },
  "xiaomi/mimo-v2.5-pro": { input: 0.435, output: 0.87, cache_read: 0.0036 },
  "xiaomi/mimo-v2.5": { input: 0.14, output: 0.28, cache_read: 0.0028 },
  "MiniMaxAI/MiniMax-M3": { input: 0.225, output: 0.9, cache_read: 0.045 },
  "google/gemini-3.1-flash-lite": { input: 0.25, output: 1.5, cache_read: 0.03 },
  "google/gemini-3.5-flash": { input: 1.5, output: 9, cache_read: 0.15 },
  "zai-org/GLM-5": { input: 1, output: 3.2, cache_read: 0.2 },
  "zai-org/GLM-5.1": { input: 1.4, output: 4.4, cache_read: 0.26 },
  "zai-org/GLM-5.2": { input: 1.4, output: 4.4, cache_read: 0.26 },
  "moonshotai/Kimi-K2.5": { input: 0.6, output: 3, cache_read: 0.1 },
  "moonshotai/Kimi-K2.6": { input: 0.95, output: 4, cache_read: 0.16 },
  "moonshotai/Kimi-K2.7-Code": { input: 0.95, output: 4, cache_read: 0.19 },
  "moonshotai/Kimi-K2.7-Code-Highspeed": { input: 1.9, output: 8, cache_read: 0.38 },
  "MiniMaxAI/MiniMax-M2.5": { input: 0.3, output: 1.2, cache_read: 0.03 },
  "MiniMaxAI/MiniMax-M2.7": { input: 0.3, output: 1.2, cache_read: 0.06 },
  "Qwen/Qwen3.6-Max-Preview": { input: 1.3, output: 7.8, cache_read: 0.26, cache_write: 1.63 },
  "Qwen/Qwen3.6-Plus": { input: 0.5, output: 3, cache_read: 0.1 },
  "Qwen/Qwen3.7-Max": { input: 1.25, output: 3.75, cache_read: 0.25, cache_write: 1.56 },
  "Qwen/Qwen3.7-Plus": { input: 0.4, output: 1.6, cache_read: 0.08, cache_write: 0.5 },
  "stepfun/Step-3.5-Flash": { input: 0.1, output: 0.3, cache_read: 0.02 },
  "stepfun/Step-3.7-Flash": { input: 0.2, output: 1.15, cache_read: 0.04 },
}

const OUTPUT_LIMITS: Record<string, number> = {
  "claude-haiku-4-5-20251001": 8_192,
  "claude-opus-4-7": 32_000,
  "claude-opus-4-8": 32_000,
  "claude-sonnet-4-6": 16_000,
  "gpt-5.3-codex": 128_000,
  "gpt-5.4": 128_000,
  "gpt-5.4-mini": 128_000,
  "gpt-5.5": 128_000,
  "deepseek/deepseek-v4-pro": 384_000,
  "deepseek/deepseek-v4-flash": 384_000,
}

const NON_REASONING = new Set([
  "claude-haiku-4-5-20251001",
  "moonshotai/Kimi-K2.5",
  "moonshotai/Kimi-K2.6",
  "MiniMaxAI/MiniMax-M2.5",
  "MiniMaxAI/MiniMax-M2.7",
])

const PREMIUM_NAMESPACES = ["google/", "sakana/", "meta/", "xai/"]

function tier(id: string): ModelEntry["tier"] {
  if (!id.includes("/") || PREMIUM_NAMESPACES.some((prefix) => id.startsWith(prefix))) {
    return "premium"
  }
  return "open-source"
}

async function main() {
  const response = await fetch(MODELS_ENDPOINT, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`Model endpoint returned ${response.status}`)

  const body = await response.json() as { data?: ApiModel[] }
  if (!Array.isArray(body.data) || body.data.length < 20) {
    throw new Error("Refusing to replace models.json with an incomplete model catalog")
  }

  const existing = new Map<string, ModelEntry>()
  try {
    const entries = JSON.parse(readFileSync(MODELS_JSON, "utf-8")) as ModelEntry[]
    for (const entry of entries) existing.set(entry.id, entry)
  } catch {
    // A live catalog can rebuild a missing or corrupt fallback.
  }

  const entries = body.data.map((model): ModelEntry => {
    const previous = existing.get(model.id)
    return {
      id: model.id,
      name: model.name,
      tier: previous?.tier ?? tier(model.id),
      reasoning: previous?.reasoning ?? !NON_REASONING.has(model.id),
      tool_call: previous?.tool_call ?? true,
      cost: COSTS[model.id] ?? previous?.cost ?? { input: 0, output: 0 },
      limit: {
        context: model.context_length,
        output: OUTPUT_LIMITS[model.id] ?? previous?.limit.output ?? 65_536,
      },
    }
  })

  entries.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "premium" ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  writeFileSync(MODELS_JSON, `${JSON.stringify(entries, null, 2)}\n`, "utf-8")
  console.log(`Updated ${MODELS_JSON} with ${entries.length} models from ${MODELS_ENDPOINT}`)
}

await main()
