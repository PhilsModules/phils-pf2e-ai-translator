export class TermReplacer {
    static _regexCache = null;
    static _lookupCache = null;
    static _lastDictionary = null;

    /**
     * Replaces terms in the text with their values from the dictionary.
     * Respects HTML tags (does not replace inside tags).
     * @param {string} text - The input text (potentially HTML).
     * @param {Object} dictionary - Map of terms to replace (English -> German).
     * @param {boolean} [appendOriginal=false] - If true, appends the original term: "Translation %%Original%%".
     * @returns {{text: string, replaced: Array<{original: string, translation: string}>}} The text with terms replaced and list of replacements.
     */
    static replaceTerms(text, dictionary, appendOriginal = false) {
        if (!text || !dictionary) return { text: text, replaced: [] };

        // Check if we can reuse the cached regex and lookup
        if (this._lastDictionary !== dictionary || !this._regexCache || !this._lookupCache) {
            const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
            if (keys.length === 0) return { text: text, replaced: [] };

            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = keys.map(escapeRegExp).join("|");

            // Construct a regex that matches any of the terms as whole words.
            // We use lookbehind (?<!\w) and lookahead (?!\w) instead of \b to handle terms starting with symbols like "+1".
            this._regexCache = new RegExp(`(?<!\\w)(${pattern})(?!\\w)`, 'gi');

            // Create a lowercase lookup map to handle case-insensitive matches
            this._lookupCache = {};
            for (const [key, value] of Object.entries(dictionary)) {
                this._lookupCache[key.toLowerCase()] = { original: key, translation: value };
            }

            this._lastDictionary = dictionary;
        }

        const replacedTerms = new Map(); // Use Map to track unique replacements by original term

        // Split by HTML tags to only replace in text content
        // This regex captures the tags so we can interleave them back
        const parts = text.split(/(<[^>]*>)/g);

        const newText = parts.map(part => {
            if (part.startsWith("<")) return part; // It's a tag, return as is

            // Replace terms in the text content
            return part.replace(this._regexCache, (match) => {
                // Look up the translation using the lowercase match
                const entry = this._lookupCache[match.toLowerCase()];
                if (entry) {
                    replacedTerms.set(entry.original, entry.translation);
                    if (appendOriginal) {
                        return `${entry.translation} %%${entry.original}%%`;
                    }
                    return entry.translation;
                }
                return match;
            });
        }).join("");

        const replacedList = Array.from(replacedTerms.entries()).map(([original, translation]) => ({ original, translation }));
        return { text: newText, replaced: replacedList };
    }
}
