export function normalizeDictation(text) {
  let value = String(text).toLowerCase();
  const replacements = [
    [/\bzero\s+eight\s+thirty\b/g, '0830'],
    [/\bzero\s+eight\s+three\s+zero\b/g, '0830'],
    [/\b0?8\s*[:.]?\s*30\b/g, '0830'],
    [/\bfourteen\s+hundred\b/g, '1400'],
    [/\b14\s*[:.]?\s*00\b/g, '1400']
  ];
  replacements.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
  return value.replace(/[‐‑‒–—-]/g, ' ').replace(/[^a-z0-9]/g, '');
}

export function isAcceptedDictation(input, expected, alternatives = []) {
  const received = normalizeDictation(input);
  return [expected, ...alternatives].some(candidate => normalizeDictation(candidate) === received);
}
