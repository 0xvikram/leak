/**
 * Strips account identifiers from a statement before any model sees it.
 * Otari's guardrail is the second line: if something slips past this, the
 * request is blocked at the gateway instead of reaching a provider.
 */
const RULES: { label: string; pattern: RegExp }[] = [
  { label: "IBAN", pattern: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g },
  { label: "CARD", pattern: /\b(?:\d[ -]?){13,19}\b/g },
  { label: "ACCOUNT", pattern: /\b(?:acct|account|a\/c)\.?\s*(?:no\.?|number|#)?\s*[:#]?\s*[\dX*][\dX* -]{5,}\d\b/gi },
  { label: "ROUTING", pattern: /\b(?:routing|sort code|ifsc)\s*[:#]?\s*[A-Z0-9-]{6,11}\b/gi },
  { label: "EMAIL", pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g },
  { label: "PHONE", pattern: /\+?\d{1,3}[ -]?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g },
];

export type Redaction = { text: string; removed: Record<string, number> };

export function redact(input: string): Redaction {
  const removed: Record<string, number> = {};
  let text = input;
  for (const { label, pattern } of RULES) {
    text = text.replace(pattern, () => {
      removed[label] = (removed[label] ?? 0) + 1;
      return `[${label}]`;
    });
  }
  return { text, removed };
}
