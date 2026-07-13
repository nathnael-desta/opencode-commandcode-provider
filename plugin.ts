import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ModelEntry {
  id: string
  name: string
  tier: "premium" | "open-source"
  reasoning: boolean
  tool_call: boolean
  cost: { input: number; output: number; cache_read?: number; cache_write?: number }
  limit: { context: number; output: number }
}

const REASONING_VARIANTS: Record<string, string[]> = {
  "gpt-5.6-sol": ["low", "medium", "high", "xhigh", "max"],
  "gpt-5.6-terra": ["low", "medium", "high", "xhigh", "max"],
  "gpt-5.6-luna": ["low", "medium", "high", "xhigh", "max"],
  "deepseek/deepseek-v4-pro": ["high", "max"],
  "deepseek/deepseek-v4-flash": ["high", "max"],
}

interface ApiModel {
  id: string
  name?: string
  context_length?: number
}

const MODELS_ENDPOINT = "https://api.commandcode.ai/provider/v1/models"
const MODEL_SYNC_TIMEOUT_MS = 5_000

function loadModels(): ModelEntry[] {
  const modelsPath = join(__dirname, "models.json")
  return JSON.parse(readFileSync(modelsPath, "utf-8"))
}

async function fetchModels(): Promise<ApiModel[]> {
  if (process.env.COMMANDCODE_DISABLE_MODEL_SYNC === "1") return []

  try {
    const response = await fetch(MODELS_ENDPOINT, {
      signal: AbortSignal.timeout(MODEL_SYNC_TIMEOUT_MS),
    })
    if (!response.ok) return []

    const body = await response.json() as { data?: unknown }
    if (!Array.isArray(body.data)) return []
    return body.data.filter(
      (model): model is ApiModel =>
        typeof model === "object" && model !== null && typeof model.id === "string",
    )
  } catch {
    return []
  }
}

function mergeModels(bundled: ModelEntry[], live: ApiModel[]): ModelEntry[] {
  const models = new Map(bundled.map((model) => [model.id, model]))

  for (const model of live) {
    const existing = models.get(model.id)
    if (existing) {
      models.set(model.id, {
        ...existing,
        name: model.name ?? existing.name,
        limit: {
          ...existing.limit,
          context: model.context_length ?? existing.limit.context,
        },
      })
      continue
    }

    models.set(model.id, {
      id: model.id,
      name: model.name ?? model.id.split("/").at(-1) ?? model.id,
      tier: model.id.includes("/") ? "open-source" : "premium",
      reasoning: true,
      tool_call: true,
      cost: { input: 0, output: 0 },
      limit: { context: model.context_length ?? 200_000, output: 65_536 },
    })
  }

  return [...models.values()]
}

function toConfigKey(id: string): string {
  const slashIdx = id.indexOf("/")
  const short = slashIdx >= 0 ? id.slice(slashIdx + 1) : id
  return short.toLowerCase()
}

export default async function commandcodePlugin() {
  return {
    config: async (config: Record<string, unknown>) => {
      const providers = config.provider as Record<string, Record<string, unknown>> | undefined
      if (!providers) {
        (config as Record<string, unknown>).provider = { commandcode: {} }
      }
      const cc = ((config as Record<string, unknown>).provider as Record<string, Record<string, unknown>>)?.commandcode as Record<string, unknown> | undefined
      if (!cc) return

      if (!cc.npm) cc.npm = "commandcode-go-opencode-provider"
      if (!cc.name) cc.name = "Command Code"
      if (!cc.env) cc.env = ["COMMANDCODE_API_KEY"]

      if (!cc.models) {
        const models = mergeModels(loadModels(), await fetchModels())
        const modelsObj: Record<string, unknown> = {}
        for (const entry of models) {
          const key = toConfigKey(entry.id)
          const reasoningVariants = REASONING_VARIANTS[entry.id]
          const costObj: Record<string, number> = { input: entry.cost.input, output: entry.cost.output }
          const hasKnownCost = entry.cost.input > 0 || entry.cost.output > 0
          if (entry.cost.cache_read !== undefined) costObj.cache_read = entry.cost.cache_read
          if (entry.cost.cache_write !== undefined) costObj.cache_write = entry.cost.cache_write

          modelsObj[key] = {
            id: entry.id,
            name: entry.name,
            reasoning: entry.reasoning,
            tool_call: entry.tool_call,
            ...(hasKnownCost ? { cost: costObj } : {}),
            limit: entry.limit,
            ...(reasoningVariants
              ? {
                  variants: Object.fromEntries(
                    reasoningVariants.map((effort) => [effort, { reasoningEffort: effort }]),
                  ),
                }
              : {}),
          }
        }
        cc.models = modelsObj
      }
    },

    auth: {
      provider: "commandcode",
      methods: [
        {
          type: "api",
          label: "API Key",
          authorize: async (inputs: Record<string, unknown> | undefined) => {
            const rawKey = inputs?.key
            if (typeof rawKey !== "string") return { type: "failed" as const }
            const key = rawKey.trim()
            if (!key) return { type: "failed" as const }
            return { type: "success" as const, key }
          },
        },
      ],
      loader: async (getAuth: () => Promise<{ type: string; key?: string } | null>) => {
        try {
          const auth = await getAuth()
          if (!auth) return {}
          if (auth.type === "api" && auth.key) return { apiKey: auth.key }
          return {}
        } catch {
          return {}
        }
      },
    },
  }
}
