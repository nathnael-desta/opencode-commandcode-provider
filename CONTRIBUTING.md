# Contributing

## Setup

```bash
bun install
bun test
bun run typecheck
```

## Model Catalog Changes

The public Command Code model endpoint is authoritative for model IDs, names,
and context windows. `models.json` is the offline fallback and carries curated
capabilities and pricing metadata.

When changing model discovery:

1. Keep startup best-effort and bounded by a timeout.
2. Never require an API key to list public models.
3. Preserve bundled metadata when a live model has the same ID.
4. Add a regression test for new model families or variants.
5. Do not encode temporary promotions into provider metadata.

Unknown costs are stored as zero in the fallback data but omitted from the
OpenCode model configuration. This prevents an unknown price from being shown
as free. Add verified rates to `COSTS` in `scripts/sync-models.ts` when they are
stable.

Live integration tests require `COMMANDCODE_API_KEY`; unit tests must not.
