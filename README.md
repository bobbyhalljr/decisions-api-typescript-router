# Decisions API: a typed router in TypeScript

A model returns a choice. Your application still needs to decide whether it can use that choice.

This tiny consumer boundary checks the expected question name, answer type, allowed route and finite confidence before selecting an internal support queue. Refusals, malformed data and policy fallbacks go to review.

**Read the illustrated article:** [OpenAI’s Decisions API Is in Public Beta. Build a Typed Router in TypeScript.](https://dev.to/bobbyhalljr/openais-decisions-api-is-in-public-beta-build-a-typed-router-in-typescript-ob7)

## Run it

Prerequisites: Git and Node.js **22.20.0**, the version used for the recorded output. No API key, model download or npm install is needed.

```bash
git clone https://github.com/bobbyhalljr/decisions-api-typescript-router.git
cd decisions-api-typescript-router
node router.ts
```

The script uses Node's built-in TypeScript type stripping and strict assertions. Type stripping does not perform a TypeScript type check.

## Exact tested output

```text
valid: billing (validated choice)
low: review (below local threshold)
fallback: review (fallback category)
refusal: review (model refusal)
unknown: review (unknown route)
nan: review (invalid confidence)
missing: review (missing or duplicate answer)
duplicate: review (missing or duplicate answer)
wrong-type: review (unexpected answer type)
malformed: review (malformed envelope)
All 10 fixture assertions passed.
```

To compare your run with the recorded output:

```bash
node router.ts > actual-output.txt
diff -u tested-output.txt actual-output.txt
```

A successful comparison produces no diff. Every fixture also has an assertion inside the script.

## What the boundary checks

1. The envelope contains an answers array.
2. Exactly one answer matches the question named `department`.
3. The answer is a choice with an allowed route.
4. Confidence is a finite number within zero to one.
5. The local policy accepts it; otherwise the queue is `review`.

The three allowed choices are `billing`, `technical` and `other`. The demo routes `other` to review. The 0.80 threshold is an illustrative policy value.

![The consumer boundary](https://bhjr.dev/blog/decisions-router/routing-boundary.png)

## Limitations

The ten inputs are **synthetic fixtures**. One routes to billing; nine deliberately exercise review paths. Those counts are a test design, not a model failure rate.

This repo makes **no OpenAI API requests**. It tests application routing behavior, not GPT-6 Luna's accuracy, calibration, refusal rate or latency. The validator covers only fields used by the demo, not the complete API schema. A production service also needs transport deadlines, logging, labeled evaluation data and separate authorization for consequential actions.

OpenAI announced public beta availability on **October 6, 2026**. Its up-to-10× speed statement is a vendor claim, not a benchmark from this repo.

## Primary sources

- [Public beta announcement](https://community.openai.com/t/decisions-api-is-now-available-in-public-beta/1403877)
- [API changelog](https://developers.openai.com/api/docs/changelog)
- [Decisions guide](https://developers.openai.com/api/docs/guides/decisions)
- [Create decision reference](https://developers.openai.com/api/reference/resources/decisions/methods/create)

I'm building [Roster](https://get-roster.com), AI employees that do real work. A compact model judgment still needs explicit application behavior.
