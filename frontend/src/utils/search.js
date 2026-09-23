export function normalizeText(value = "") {
    return String(value)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function tokenize(value) {
    const norm = normalizeText(value);
    return norm ? norm.split(" ") : [];
}

/** True when a and b differ by at most one insertion/deletion/substitution. */
function withinOneEdit(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let diff = 0;
    while (i < a.length && j < b.length) {
        if (a[i] !== b[j]) {
            diff += 1;
            if (diff > 1) return false;
            if (a.length > b.length) i += 1; // skip char in a (deletion)
            else if (b.length > a.length) j += 1; // skip char in b (insertion)
            else {
                i += 1;
                j += 1; // substitution
            }
        } else {
            i += 1;
            j += 1;
        }
    }
    if (i < a.length || j < b.length) diff += 1;
    return diff <= 1;
}

/** Does one search token plausibly refer to one word of the target text? */
export function wordMatches(token, word) {
    if (!token || !word) return false;
    if (word === token) return true;
    // prefix either way: "watch"→"watchOS", "watc"→"watch" (skip 1–2 char noise)
    if (token.length >= 3 && (word.startsWith(token) || token.startsWith(word))) return true;
    // typo tolerance for longer tokens: "headphons"→"headphones"
    if (token.length >= 4 && Math.abs(word.length - token.length) <= 1) {
        return withinOneEdit(token, word);
    }
    return false;
}

function matchesAny(token, words) {
    return words.some((w) => wordMatches(token, w));
}

function productWords(item) {
    const wide = [
        item.name,
        item.category,
        item.shortDescription,
        Array.isArray(item.description) ? item.description.join(" ") : item.description,
        (item.highlights || []).map((h) => `${h.label} ${h.detail}`).join(" "),
        (item.specs || []).map((s) => `${s.label} ${s.value}`).join(" "),
    ]
        .filter(Boolean)
        .join(" ");
    return {name: tokenize(item.name), wide: tokenize(wide)};
}

/**
 * Score one product against a query. Returns 0 when it should not show.
 * `tokens` may be passed pre-tokenized (faster inside loops).
 */
export function searchScore(item, query, tokens) {
    const toks = tokens || tokenize(query);
    if (!toks.length) return 1;
    const {name, wide} = productWords(item);

    let nameHits = 0;
    let wideHits = 0;
    for (const t of toks) {
        const inName = matchesAny(t, name);
        if (inName) nameHits += 1;
        if (inName || matchesAny(t, wide)) wideHits += 1;
    }

    const allFound = wideHits === toks.length;
    const halfInName = nameHits >= Math.ceil(toks.length / 2);
    if (!allFound && !halfInName) return 0;

    let score = nameHits * 3 + (wideHits - nameHits);
    const q = normalizeText(Array.isArray(toks) ? query || toks.join(" ") : query);
    if (q && normalizeText(item.name).includes(q)) score += 6;
    return score;
}

/**
 * Filter + rank a product list by search relevance (desc).
 * Returns the original list untouched when the query is empty.
 */
export function rankBySearch(items, search) {
    const tokens = tokenize(search);
    if (!tokens.length) return items;
    const q = normalizeText(search);
    return items
        .map((item) => ({item, s: searchScore(item, q, tokens)}))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || (b.item.rating || 0) - (a.item.rating || 0))
        .map((x) => x.item);
}