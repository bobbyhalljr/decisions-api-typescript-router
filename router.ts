import assert from 'node:assert/strict';

const routes = ['billing', 'technical', 'other'] as const;
type Route = typeof routes[number];
type Result = { queue: Route | 'review'; reason: string };
const object = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

// This validates the application boundary, not every API response field.
function routeDecision(raw: unknown): Result {
  const review = (reason: string): Result => ({ queue: 'review', reason });
  if (!object(raw) || !Array.isArray(raw.answers))
    return review('malformed envelope');
  const matches = raw.answers.filter(
    x => object(x) && x.name === 'department'
  );
  if (matches.length !== 1) return review('missing or duplicate answer');
  const answer = matches[0] as Record<string, unknown>;
  if (answer.type === 'refusal') return review('model refusal');
  if (answer.type !== 'choice') return review('unexpected answer type');
  if (typeof answer.choice !== 'string' ||
      !routes.includes(answer.choice as Route))
    return review('unknown route');
  const confidence = answer.confidence;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence) ||
      confidence < 0 || confidence > 1)
    return review('invalid confidence');
  // Illustrative policy only; choose a threshold using labeled evaluations.
  if (confidence < .8) return review('below local threshold');
  if (answer.choice === 'other') return review('fallback category');
  return { queue: answer.choice as Route, reason: 'validated choice' };
}

const envelope = (answer: unknown) => ({ answers: [answer] });
const choice = (value: string, confidence: number) =>
  envelope({ type: 'choice', name: 'department', choice: value, confidence });
const cases: [string, unknown, Result][] = [
  ['valid', choice('billing', .94), { queue: 'billing', reason: 'validated choice' }],
  ['low', choice('technical', .6), { queue: 'review', reason: 'below local threshold' }],
  ['fallback', choice('other', .95), { queue: 'review', reason: 'fallback category' }],
  ['refusal', envelope({ type: 'refusal', name: 'department' }),
    { queue: 'review', reason: 'model refusal' }],
  ['unknown', choice('refund_now', .99), { queue: 'review', reason: 'unknown route' }],
  ['nan', choice('billing', NaN), { queue: 'review', reason: 'invalid confidence' }],
  ['missing', { answers: [] }, { queue: 'review', reason: 'missing or duplicate answer' }],
  ['duplicate', { answers: [
    { type: 'choice', name: 'department', choice: 'billing', confidence: .9 },
    { type: 'choice', name: 'department', choice: 'technical', confidence: .9 }
  ] }, { queue: 'review', reason: 'missing or duplicate answer' }],
  ['wrong-type', envelope({ type: 'predicate', name: 'department', probability: .9 }),
    { queue: 'review', reason: 'unexpected answer type' }],
  ['malformed', null, { queue: 'review', reason: 'malformed envelope' }],
];
for (const [name, fixture, expected] of cases) {
  const result = routeDecision(fixture);
  assert.deepEqual(result, expected);
  console.log(name + ': ' + result.queue + ' (' + result.reason + ')');
}
console.log('All ' + cases.length + ' fixture assertions passed.');
