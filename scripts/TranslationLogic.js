export const MODULE_ID = 'phils-pf2e-ai-translator';
import { DictionaryLoader } from "./DictionaryLoader.js";
import { TermReplacer } from "./TermReplacer.js";

export function formatString(str, data = {}) {
    if (!str) return "";
    if (Array.isArray(str)) str = str.join("\n");
    for (const [k, v] of Object.entries(data)) {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v || "");
    }
    return str;
}

export const loc = (key, data = {}) => {
    const i18nKey = `PHILS_PF2E_AI_TRANSLATOR.UI.${key}`;
    if (game.i18n.has(i18nKey)) return game.i18n.format(i18nKey, data);
    return key;
};

export function resolvePrompt(key, data) {
    const i18nKey = `PHILS_PF2E_AI_TRANSLATOR.Prompts.${key}`;
    let rawText = foundry.utils.getProperty(game.i18n.translations, i18nKey);
    if (!rawText && game.i18n._fallback) {
        rawText = foundry.utils.getProperty(game.i18n._fallback, i18nKey);
    }
    if (!rawText) rawText = game.i18n.localize(i18nKey);
    if (!rawText || rawText === i18nKey) return "";
    return formatString(rawText, data);
}



// --- GLOBAL GLOSSARY STATE ---
export const GLOSSARY_MAP = new Map();
function clearGlossaryMap() {
    GLOSSARY_MAP.clear();
}
// -----------------------------

// Helper to load dictionary (Shared)
async function loadDictionary() {
    // 1. Load Official Translations
    const officialDictionary = await DictionaryLoader.loadOfficialTranslations();

    // 2. Load User Glossary Terms
    let glossaryDictionary = {};
    const glossaryJournal = game.journal.find(j => j.name === "AI Glossary" || j.name === "AI Glossar");
    if (glossaryJournal) {
        const page = glossaryJournal.pages.find(p => p.type === "text");
        if (page && page.text?.content) {
            const terms = extractTermsFromHtml(page.text.content);
            terms.forEach(t => {
                glossaryDictionary[t.original] = t.translation;
            });
        }
    }

    // 3. Merge: Glossary Overwrites Official
    return { ...officialDictionary, ...glossaryDictionary };
}

// Helper to inject markers into German text (Reverse Lookup)
// dictionary is English -> German
export async function injectGlossaryMarkers(docData) {
    // reset map for new run (ALWAYS do this first to avoid stale state)
    clearGlossaryMap();

    // 1. Load Dictionary
    const dictionary = await loadDictionary();
    if (!dictionary || Object.keys(dictionary).length === 0) {
        // No glossary? No problem. Just don't protect anything.
        return docData;
    }

    // 2. Prepare Terms for Regex (sort by length desc)
    // IMPORTANT: For Grammar Check, we are scanning GERMAN text. 
    // The dictionary is En -> De. So we need to protect the VALUES (German terms).
    // Also include Keys if they might appear? Usually not. Stick to Values.
    const allGermanTerms = Object.values(dictionary);
    // Unique them (some English terms map to same German term)
    const uniqueTerms = [...new Set(allGermanTerms)].filter(t => t && t.length > 2); // Filter short garbage

    // Sort longest first to match compound words correctly
    const terms = uniqueTerms.sort((a, b) => b.length - a.length);

    if (terms.length === 0) return docData;

    let termCounter = 0;

    // Escape regex special characters
    const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = `\\b(${escapedTerms.join("|")})\\b`;
    const regex = new RegExp(regexPattern, "g");

    const processString = (text) => {
        if (!text) return text;
        // Split by HTML tags to avoid replacing inside tags
        const parts = text.split(/(<[^>]*>)/g);
        return parts.map(part => {
            if (part.startsWith("<")) return part;
            return part.replace(regex, (match) => {
                termCounter++;
                const id = `#${termCounter}`;
                GLOSSARY_MAP.set(id, match); // Store original
                return `[[${id}:${match}]]`;
            });
        }).join("");
    };

    // Recursive helper
    const injectInObject = (obj) => {
        if (typeof obj === 'string') {
            return processString(obj);
        } else if (Array.isArray(obj)) {
            return obj.map(item => injectInObject(item));
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                // Skip _id and other sensitive fields
                if (key === "_id") continue;
                obj[key] = injectInObject(obj[key]);
            }
            return obj;
        }
        return obj;
    };

    // Create a deep copy to avoid mutating original valid data structure in memory if not intended (though we usually want to return modified data)
    let processedData = foundry.utils.deepClone(docData);
    processedData = injectInObject(processedData);

    return processedData;
}

// Helper to inject official translations
export async function injectOfficialTranslations(docData) {
    const dictionary = await loadDictionary();

    if (!dictionary || Object.keys(dictionary).length === 0) return { docData, replacedTerms: [] };

    // Helper to process text recursively or specific fields
    const processContent = (text) => {
        // Enable appendOriginal (true)
        const result = TermReplacer.replaceTerms(text, dictionary, true);
        return result.text;
    };

    // Process 'name'
    if (docData.name) {
        docData.name = processContent(docData.name);
    }

    // Process 'pages' if they exist (JournalEntry)
    if (docData.pages) {
        docData.pages.forEach(page => {
            if (page.name) page.name = processContent(page.name);
            if (page.text && page.text.content) {
                page.text.content = processContent(page.text.content);
            }
        });
    }

    // Process 'system.description.value' (Items/Actors)
    if (docData.system && docData.system.description && docData.system.description.value) {
        docData.system.description.value = processContent(docData.system.description.value);
    }

    // Note: We used to collect replaced terms here, but the prompt doesn't need them anymore.
    // The terms are now inline in the text.
    return { docData, replacedTerms: [] };
}

export function getCleanData(doc, sendFull, allowedPageIds = null) {
    const rawData = doc.toObject();
    delete rawData._stats; delete rawData.ownership; delete rawData.flags; delete rawData.sort; delete rawData.folder;

    if (doc.documentName === "JournalEntry" && rawData.pages && allowedPageIds) {
        rawData.pages = rawData.pages.filter(p => allowedPageIds.includes(p._id));
    }

    if (doc.type === "spellcastingEntry" && doc.parent) {
        const associatedSpells = doc.parent.items.filter(i => i.type === "spell" && i.system.location?.value === doc.id);
        rawData.containedSpells = associatedSpells.map(s => { return { name: s.name, level: s.system.level?.value }; });
    }
    if (!sendFull) {
        delete rawData.prototypeToken; delete rawData.img; delete rawData.thumb;
        if (doc.documentName === "Actor" || doc.documentName === "Item") {
            if (rawData.items && Array.isArray(rawData.items)) {
                rawData.items = rawData.items.map(i => {
                    const clean = { ...i };
                    if (clean.system?.description?.value) clean.system.description.value = "";
                    return clean;
                });
            }
        }
    }
    return rawData;
}

export function getContextDescription(doc, rawData) {
    let desc = "";
    if (rawData.system?.description?.value) desc = rawData.system.description.value;
    else if (rawData.system?.details?.biography?.value) desc = rawData.system.details.biography.value;
    else if (rawData.system?.details?.publicNotes) desc = rawData.system.details.publicNotes;
    else if (doc.documentName === "JournalEntry" && rawData.pages) desc = rawData.pages.map(p => p.text?.content || "").join("\n\n");
    if (rawData.containedSpells && rawData.containedSpells.length > 0) {
        desc += "\n\n--- ENTHALTENE ZAUBER (Liste) ---\n" + rawData.containedSpells.map(s => `- ${s.name} (Level ${s.level || 1})`).join("\n");
    }
    let clean = desc.replace(/<[^>]*>?/gm, '').trim();
    return clean ? clean.substring(0, 8000) : "(No description found)";
}

export function getGlossaryContent() {
    const glossaryJournal = game.journal.find(j =>
        j.name === "AI Glossary" || j.name === "AI Glossar"
    );
    if (!glossaryJournal) return null;
    let content = "";
    glossaryJournal.pages.forEach(page => {
        if (page.type === "text") content += page.text.content + "\n";
    });
    let cleanContent = content.replace(/<[^>]*>?/gm, '').trim();
    return cleanContent.substring(0, 5000);
}

export async function processUpdate(doc, rawText, processingMode = 'translate') {
    const jsonMatches = [...rawText.matchAll(/```json\s*([\s\S]*?)\s*```/gi)];
    let translationJson = null;
    let newGlossaryItems = null;
    let glossaryJournalJson = null;

    if (jsonMatches.length > 0) {
        for (const match of jsonMatches) {
            try {
                const json = JSON.parse(match[1]);
                if (Array.isArray(json)) {
                    // Legacy/Fallback: Array of terms
                    if (json.length === 0 || (json[0].original && json[0].translation)) {
                        newGlossaryItems = json;
                    }
                } else if (json.name === "AI Glossary Update" && json.newTerms && Array.isArray(json.newTerms)) {
                    // New Standard: Named Object for Glossary Update
                    newGlossaryItems = json.newTerms;
                } else if (json.name === "AI Glossary" || json.name === "AI Glossar") {
                    // New Glossary Journal Object
                    glossaryJournalJson = json;
                } else if (json.pages || json.items || json.system || json.name) {
                    // Likely the translation update
                    translationJson = json;
                }
            } catch (e) {
                console.warn("Failed to parse a JSON block:", e);
            }
        }
    } else {
        // Fallback for single block without code fences (legacy support or bad AI output)
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const json = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
                if (json.name === "AI Glossary" || json.name === "AI Glossar") glossaryJournalJson = json;
                else translationJson = json;
            } catch (e) { }
        }
    }

    if (!translationJson && !glossaryJournalJson) {
        return loc('ErrorJsonInvalid') || "No valid Translation JSON found in response. (Missing ```json blocks?)";
    }

    try {
        // Handle New Glossary Creation (from TranslateAndCreateGlossary)
        // Handle New Glossary Creation OR Update
        if (glossaryJournalJson) {
            const existing = game.journal.find(j => j.name === "AI Glossary" || j.name === "AI Glossar");
            if (existing) {
                // Glossary exists: Extract terms from the returned JSON to update it
                const page = glossaryJournalJson.pages?.find(p => p.type === "text");
                if (page && page.text?.content) {
                    let extractedTerms = extractTermsFromHtml(page.text.content);

                    // Filter out terms that already exist in the glossary
                    const existingPage = existing.pages.find(p => p.type === "text");
                    if (existingPage && existingPage.text?.content) {
                        const currentTerms = extractTermsFromHtml(existingPage.text.content);
                        const currentTermSet = new Set(currentTerms.map(t => t.original.toLowerCase().trim()));

                        extractedTerms = extractedTerms.filter(t => !currentTermSet.has(t.original.toLowerCase().trim()));
                    }

                    if (extractedTerms.length > 0) {
                        newGlossaryItems = (newGlossaryItems || []).concat(extractedTerms);
                    }
                }

                // Only warn if we are purely in "Create Glossary" mode (no translation) AND found no new terms
                if (!translationJson && (!newGlossaryItems || newGlossaryItems.length === 0)) {
                    ui.notifications.warn(loc('ErrorGlossaryExists') || "AI Glossary already exists!");
                }
            } else {
                await JournalEntry.create(glossaryJournalJson);
                ui.notifications.info(loc('InfoGlossaryCreated') || "Neues Journal 'AI Glossary' erfolgreich erstellt!");
            }

            // If we ONLY got a glossary and handled it (either created or extracted terms), return success
            if (!translationJson) {
                return { success: true, newGlossaryItems: newGlossaryItems };
            }
        }

        // Handle Translation Update
        if (translationJson) {
            const jsonData = translationJson;
            delete jsonData._id;

            // --- CLEANUP START ---
            // 1. Check for Glossary Conflicts (Grammar Check Protection)
            // Parse [[#ID:Term]] and compare with GLOSSARY_MAP
            const conflicts = [];

            // Helper to recursively scan for conflicts (without modifying yet)
            const scanConflicts = (obj) => {
                if (typeof obj === 'string') {
                    const matches = [...obj.matchAll(/\[\[#(.*?):(.*?)\]\]/g)];
                    for (const match of matches) {
                        const id = `#${match[1]}`;
                        const returnedTerm = match[2];
                        const originalTerm = GLOSSARY_MAP.get(id);

                        if (originalTerm && returnedTerm !== originalTerm) {
                            conflicts.push({
                                id: id,
                                original: originalTerm,
                                current: returnedTerm
                            });
                        }
                    }
                } else if (Array.isArray(obj)) {
                    obj.forEach(item => scanConflicts(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) scanConflicts(obj[key]);
                }
            };
            scanConflicts(jsonData);

            if (conflicts.length > 0) {
                // Return conflicts to UI instead of proceeding
                return { success: false, status: 'conflict', conflicts: conflicts, jsonData: jsonData };
            }


            // 2. Remove [[...]] markers but KEEP content
            const cleanGrammarMarkers = (obj) => {
                if (typeof obj === 'string') {
                    // Match [[#ID:Content]] -> Content
                    return obj.replace(/\[\[#.*?:(.*?)\]\]/g, "$1");
                    // Also match legacy [[Content]] -> Content (fallback)
                    // return obj.replace(/\[\[(.*?)\]\]/g, "$1"); 
                } else if (Array.isArray(obj)) {
                    return obj.map(item => cleanGrammarMarkers(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        obj[key] = cleanGrammarMarkers(obj[key]);
                    }
                    return obj;
                }
                return obj;
            };
            cleanGrammarMarkers(jsonData);

            // 3. Remove %%...%% completely (Legacy/Recall/Translation Original Terms)
            // Recursively remove %%Original%% markers from all string values in the object
            const cleanObjectStrings = (obj) => {
                if (typeof obj === 'string') {
                    return obj.replace(/\s?%%.*?%%/g, "");
                } else if (Array.isArray(obj)) {
                    return obj.map(item => cleanObjectStrings(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        obj[key] = cleanObjectStrings(obj[key]);
                    }
                    return obj;
                }
                return obj;
            };

            // Apply cleanup to the entire JSON data
            cleanObjectStrings(jsonData);
            // --- CLEANUP END ---

            if (doc.documentName === "JournalEntry" && jsonData.pages && jsonData.name !== "AI Glossary") {
                const backupName = `${doc.name} (Backup)`;
                const existingBackup = game.journal.find(j => j.name === backupName);

                if (!existingBackup) {
                    try {
                        await doc.clone({ name: backupName }, { save: true });
                        ui.notifications.info(loc('BackupCreated', { name: doc.name }) || `Backup created: "${doc.name} (Backup)"`);
                    } catch (err) {
                        console.warn("Backup creation failed:", err);
                    }
                }
            }

            if ((doc.documentName === "Actor" || doc.documentName === "Item") && jsonData.items && Array.isArray(jsonData.items)) {
                jsonData.items = jsonData.items.map(newItem => {
                    if (!newItem._id && doc.items) { console.warn(`Phils Translator | Safety: Item without ID skipped.`); return null; }
                    if (doc.items) {
                        const original = doc.items.get(newItem._id);
                        if (original && (newItem.system?.description?.value === "" || newItem.system?.description?.value === null)) {
                            if (newItem.system && newItem.system.description) delete newItem.system.description;
                        }
                    }
                    return newItem;
                }).filter(i => i !== null);
            }

            if (doc.documentName === "JournalEntry" && jsonData.pages && Array.isArray(jsonData.pages)) {
                jsonData.pages = jsonData.pages.map(newPage => {
                    if (newPage._id) {
                        newPage.flags = newPage.flags || {};

                        if (processingMode === 'grammar') {
                            newPage.flags[MODULE_ID] = {
                                aiGrammarChecked: true,
                                // Preserve existing translation status if present
                                aiProcessed: doc.pages.get(newPage._id)?.getFlag(MODULE_ID, 'aiProcessed') || false
                            };
                        } else {
                            // Translate mode (default)
                            newPage.flags[MODULE_ID] = {
                                aiProcessed: true,
                                aiGrammarChecked: false // Clear grammar check as it is new text
                            };
                        }
                    }
                    return newPage;
                });
            }

            if (jsonData.type && jsonData.type !== doc.type) ui.notifications.warn(loc('WarnTypeChange') || `Achtung: Type-Change!`);

            // --- ID VERIFICATION START ---
            let validationErrors = [];

            // 0. Verify Root ID (if present)
            if (jsonData._id && jsonData._id !== doc.id) {
                validationErrors.push(`Root ID Mismatch: Expected '${doc.id}', found '${jsonData._id}'. (The AI tried to change the Document ID.)`);
            }

            // DEEP ID CHECK (Recursive)
            const validIds = collectAllIds(doc.toObject());
            // Also allow the ID of the document itself if not in toObject (though it usually is)
            validIds.add(doc.id);

            const deepValidationErrors = validateDeepIds(jsonData, validIds);
            if (deepValidationErrors.length > 0) {
                validationErrors.push(...deepValidationErrors);
            }

            // Inline Link Verification (@Type[id])
            // We still run this because it checks for *missing* IDs in the text content, which deep check doesn't cover (deep check only validates existence of IDs *in the structure*).
            if (doc.documentName === "JournalEntry" && jsonData.pages) {
                for (const newPage of jsonData.pages) {
                    const originalPage = doc.pages.get(newPage._id);
                    if (originalPage && newPage.text?.content) {
                        const result = validateIds(originalPage.text.content, newPage.text.content);
                        if (!result.valid) {
                            if (result.missing.length > 0) validationErrors.push(`Page '${originalPage.name}': Missing IDs in text: ${result.missing.join(", ")}`);
                            if (result.hallucinated.length > 0) validationErrors.push(`Page '${originalPage.name}': Hallucinated IDs in text: ${result.hallucinated.join(", ")}`);
                        }
                    }
                }
            }

            if (validationErrors.length > 0) {
                const errorMsg = "ID Verification Failed:\n" + validationErrors.join("\n");
                console.warn(errorMsg);
                ui.notifications.error("Translation rejected due to ID errors. Check console for details.");
                return errorMsg;
            }
            // --- ID VERIFICATION END ---

            await doc.update(jsonData);
            ui.notifications.success(loc('Success', { docName: doc.name }));
        }

        return { success: true, newGlossaryItems: newGlossaryItems };

    } catch (e) {
        console.error(e);
        return e.message;
    }
}

function extractIds(text) {
    if (!text) return [];
    // Matches @Type[id] or @Type[id]{label}
    // We only care about the Type and ID for verification
    const regex = /@([a-zA-Z]+)\[([^\]]+)\]/g;
    const ids = [];
    for (const match of text.matchAll(regex)) {
        ids.push({
            full: match[0],
            type: match[1],
            id: match[2]
        });
    }
    return ids;
}

function validateIds(originalText, translatedText) {
    const originalIds = extractIds(originalText);
    const translatedIds = extractIds(translatedText);

    // Create maps for counting occurrences
    const countIds = (list) => {
        const map = new Map();
        list.forEach(item => {
            const key = `${item.type}[${item.id}]`;
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    };

    const originalMap = countIds(originalIds);
    const translatedMap = countIds(translatedIds);

    const missing = [];
    const hallucinated = [];

    // Check for missing IDs
    for (const [key, count] of originalMap.entries()) {
        const transCount = translatedMap.get(key) || 0;
        if (transCount < count) {
            missing.push(`${key} (Expected: ${count}, Found: ${transCount})`);
        }
    }

    // Check for hallucinated IDs
    for (const [key, count] of translatedMap.entries()) {
        const origCount = originalMap.get(key) || 0;
        if (count > origCount) {
            hallucinated.push(`${key} (Original: ${origCount}, Found: ${count})`);
        }
    }

    return {
        valid: missing.length === 0 && hallucinated.length === 0,
        missing,
        hallucinated
    };
}

function collectAllIds(obj, ids = new Set()) {
    if (!obj || typeof obj !== 'object') return ids;

    if (Array.isArray(obj)) {
        obj.forEach(item => collectAllIds(item, ids));
    } else {
        if (obj._id) ids.add(obj._id);
        if (obj.id) ids.add(obj.id); // Some systems/modules use 'id'

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                collectAllIds(obj[key], ids);
            }
        }
    }
    return ids;
}

function validateDeepIds(json, validIds, errors = [], path = "") {
    if (!json || typeof json !== 'object') return errors;

    if (Array.isArray(json)) {
        json.forEach((item, index) => validateDeepIds(item, validIds, errors, `${path}[${index}]`));
    } else {
        // Check _id
        if (json._id && !validIds.has(json._id)) {
            errors.push(`Unknown ID found at ${path}._id: '${json._id}'`);
        }
        // Check id (only if it looks like a Foundry ID - 16 chars alphanumeric, or if it was in the original)
        // We be strict: if it's called "id" and it's a string, we check it.
        if (json.id && typeof json.id === 'string' && !validIds.has(json.id)) {
            // Optional: Filter out non-ID strings if "id" is used for something else?
            // But usually "id" is an ID.
            errors.push(`Unknown ID found at ${path}.id: '${json.id}'`);
        }

        for (const key in json) {
            if (Object.prototype.hasOwnProperty.call(json, key)) {
                validateDeepIds(json[key], validIds, errors, path ? `${path}.${key}` : key);
            }
        }
    }
    return errors;
}

export async function addToGlossary(newItems) {
    const glossaryJournal = game.journal.find(j => j.name === "AI Glossary" || j.name === "AI Glossar");
    if (!glossaryJournal) {
        ui.notifications.warn(loc('WarnGlossaryNotFound') || "AI Glossary not found.");
        return;
    }

    // Find the text page (usually the first one or named "Glossary Terms")
    const page = glossaryJournal.pages.find(p => p.type === "text");
    if (!page) {
        ui.notifications.warn(loc('WarnGlossaryNoText') || "AI Glossary has no text page.");
        return;
    }

    let content = page.text.content;

    // 1. Extract existing terms
    let allTerms = extractTermsFromHtml(content);
    console.log(`Phils Translator | Found ${allTerms.length} existing terms.`);

    // 2. Merge new terms (filtering duplicates)
    const existingOriginals = new Set(allTerms.map(t => t.original.toLowerCase().trim()));
    let addedCount = 0;

    newItems.forEach(item => {
        const normalizedOriginal = item.original.toLowerCase().trim();
        if (!existingOriginals.has(normalizedOriginal)) {
            allTerms.push(item);
            existingOriginals.add(normalizedOriginal);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        // 3. Sort alphabetically
        allTerms.sort((a, b) => a.original.localeCompare(b.original, undefined, { sensitivity: 'base' }));

        // 4. Reconstruct HTML
        // Try to find the existing list to replace it specifically, preserving pre/post content
        const ulStartMatch = content.match(/<ul[^>]*>/i);
        const ulEndIndex = content.lastIndexOf("</ul>");

        let preContent = "";
        let postContent = "";

        if (ulStartMatch && ulEndIndex > ulStartMatch.index) {
            preContent = content.substring(0, ulStartMatch.index);
            postContent = content.substring(ulEndIndex + 5);
        } else {
            // If no list found, use standard header or keep existing content if it doesn't look like a glossary
            if (content.trim().length === 0) {
                preContent = "<h1>Automatisches Glossar</h1><p>Denk bitte daran, dass dies automatisch übersetzte Begriffe sind. Prüfe bei Fehlern die Originalquelle.</p><hr>";
            } else {
                // Append to existing content if we couldn't find a list to replace
                preContent = content + "\n<hr>\n";
            }
        }

        const listHtml = "<ul>\n" + allTerms.map(t => `<li>${t.original} = ${t.translation}</li>`).join("\n") + "\n</ul>";
        const finalContent = preContent + listHtml + postContent;

        await page.update({ "text.content": finalContent });
        ui.notifications.info(loc('InfoTermsAdded', { count: addedCount }) || `Added ${addedCount} new terms to AI Glossary.`);
    } else {
        ui.notifications.info(loc('InfoNoNewTerms') || "No new unique terms to add.");
    }
}

function extractTermsFromHtml(htmlContent) {
    const terms = [];
    // Regex to find <li>Original = Translation</li>
    // Matches: <li...> (capture original) = (capture translation) </li>
    // Handles attributes in <li> and whitespace
    const regex = /<li[^>]*>\s*(.*?)\s*=\s*(.*?)\s*<\/li>/gi;
    const matches = [...htmlContent.matchAll(regex)];

    for (const match of matches) {
        let original = match[1].replace(/<[^>]*>/g, "").trim(); // Remove bold/italic tags if any
        let translation = match[2].replace(/<[^>]*>/g, "").trim();
        if (original && translation) {
            terms.push({ original, translation });
        }
    }
    return terms;
}
