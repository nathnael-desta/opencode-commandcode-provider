# Model Routing Policy

This repository includes an optional OpenCode orchestration preset in
[`examples/opencode.jsonc`](../examples/opencode.jsonc). It favors permanent
pricing advantages and requires approval before expensive escalation.

## Defaults

| Work class | Model | Effort | Rationale |
|---|---|---|---|
| Orchestration | GPT-5.6 Sol | low | Strong routing decisions without paying for high effort on every turn |
| Routine and fast-path work | DeepSeek V4 Pro | high | Command Code's permanent 75% discount gives 4x credit usage |
| Deep work | GPT-5.6 Sol | low | Preferred over spending more tokens on Luna at max effort |
| Exceptional escalation | GPT-5.6 Sol | medium or high | Used only after the user approves the escalation |

DeepSeek V4 Flash is not the default even for fast-path work. V4 Pro's
permanent discount makes its effective monthly allowance attractive while
retaining the stronger model. This policy intentionally ignores temporary
promotions so behavior does not change when a short-lived deal expires.

## Sol, Terra, and Luna

Sol, Terra, and Luna are separate GPT-5.6 model tiers, not effort names. Each
supports `low`, `medium`, `high`, `xhigh`, and `max` reasoning effort. There is
no separate "Luna Pro" model: the relevant choices are Luna with an effort
variant or a higher model tier such as Terra or Sol.

## Delegation

The orchestrator itself runs on Sol low. When it delegates, the selected
subagent makes its own model call using that subagent's configured model and
effort. Sol low therefore decides whether to request a medium/high worker; it
does not somehow execute the worker's reasoning itself.

The approval rule is prompt-enforced: before delegating to `extreme-medium` or
`extreme-high`, the orchestrator must explain why `deep` is insufficient and
ask the user. OpenCode does not currently provide a provider-level spend gate,
so consumers that need a hard billing boundary should also restrict those
agents with OpenCode permissions or remove them from the preset.

## Permanent Deals

As verified on July 13, 2026, Command Code marks these discounts as permanent:

- DeepSeek V4 Pro: 75% off, 4x effective usage.
- MiniMax M3: 62.5% off, about 2.7x effective usage.
- MiMo V2.5 and MiMo V2.5 Pro: permanent reduced pricing.

Temporary free models and introductory rates are deliberately excluded from
the routing defaults. Re-check the official [Pricing & Limits](https://commandcode.ai/docs/resources/pricing-limits)
page before changing this policy.
