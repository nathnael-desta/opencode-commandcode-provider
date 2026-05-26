# opencode-commandcode-provider

[Command Code](https://commandcode.ai) API provider for [opencode](https://opencode.ai). Use Claude, GPT, Gemini, DeepSeek, Qwen, Kimi, GLM, MiniMax, Step, and other models through a single API key.

## Quick Start

### 1. Get an API key

Sign up at [commandcode.ai](https://commandcode.ai) and generate an API key.

### 2. Connect

Run `/connect` in opencode, search for **Command Code**, and enter your API key:

```
/connect
```

### 3. Select a model

Run `/models` to pick from available models:

```
/models
```

## Manual Configuration

You can also configure the provider directly in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-commandcode-provider/server"],
  "provider": {
    "commandcode": {
      "npm": "opencode-commandcode-provider",
      "name": "Command Code",
      "env": ["COMMANDCODE_API_KEY"]
    }
  },
  "model": "commandcode/deepseek-v4-flash"
}
```

The plugin enables the `/connect` auth flow. The provider key (`commandcode`) is used to prefix model IDs (e.g. `commandcode/deepseek-v4-flash`).

### Environment Variable

Set `COMMANDCODE_API_KEY` instead of using `/connect`:

```bash
COMMANDCODE_API_KEY=your-key opencode
```

## Available Models

| Model ID | Name | Tier | Reasoning | Context |
|---|---|---|---|---|
| `claude-opus-4-7` | Claude Opus 4.7 | premium | yes | 200K |
| `claude-opus-4-6` | Claude Opus 4.6 | premium | yes | 200K |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | premium | yes | 200K |
| `claude-haiku-4-5` | Claude Haiku 4.5 | premium | yes | 200K |
| `gpt-5.5` | GPT-5.5 | premium | yes | 256K |
| `gpt-5.4` | GPT-5.4 | premium | yes | 256K |
| `gpt-5.4-mini` | GPT-5.4 Mini | premium | no | 256K |
| `gpt-5.3-codex` | GPT-5.3 Codex | premium | yes | 256K |
| `google/gemini-3.5-flash` | Gemini 3.5 Flash | premium | yes | 1M |
| `google/gemini-3.1-flash-lite` | Gemini 3.1 Flash Lite | premium | no | 1M |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | open-source | yes | 1M |
| `deepseek/deepseek-v4-pro` | DeepSeek V4 Pro | open-source | yes | 1M |
| `qwen/Qwen3.6-Plus` | Qwen 3.6 Plus | open-source | yes | 1M |
| `qwen/Qwen3.6-Max-Preview` | Qwen 3.6 Max Preview | open-source | yes | 1M |
| `qwen/Qwen3.7-Max` | Qwen 3.7 Max | open-source | yes | 1M |
| `moonshotai/Kimi-K2.5` | Kimi K2.5 | open-source | yes | 262K |
| `moonshotai/Kimi-K2.6` | Kimi K2.6 | open-source | yes | 262K |
| `zai-org/GLM-5` | GLM-5 | open-source | yes | 200K |
| `zai-org/GLM-5.1` | GLM-5.1 | open-source | yes | 200K |
| `MiniMaxAI/MiniMax-M2.5` | MiniMax M2.5 | open-source | yes | 1M |
| `MiniMaxAI/MiniMax-M2.7` | MiniMax M2.7 | open-source | yes | 1M |
| `stepfun/Step-3.5-Flash` | Step 3.5 Flash | open-source | yes | 1M |

Full model list is maintained in [`models.json`](./models.json). Run `bun run sync` to refresh from Command Code's pricing page.

## Development

```bash
git clone https://github.com/brent-weatherall/opencode-commandcode-provider.git
cd opencode-commandcode-provider
bun install
```

For local testing, create `opencode.local.json` (gitignored) with `file://` paths:

```json
{
  "plugin": ["file:///path/to/opencode-commandcode-provider/plugin.ts"],
  "provider": {
    "commandcode": {
      "npm": "file:///path/to/opencode-commandcode-provider",
      "name": "Command Code (local)",
      "env": ["COMMANDCODE_API_KEY"]
    }
  }
}
```

Run `opencode --config opencode.local.json` to test with your local build.

### Sync Models

```bash
bun run sync              # update models.json from Command Code
bun run sync:global       # update models.json + write to ~/.config/opencode/opencode.jsonc
```

## License

MIT
