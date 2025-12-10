export class DictionaryLoader {
    static _cache = null;

    /**
     * Loads official translations from the lang-de-pf2e module.
     * @returns {Promise<Object>} A map of English terms to German translations.
     */
    static async loadOfficialTranslations() {
        if (this._cache) return this._cache;

        const dictionary = {};
        const packDir = "modules/lang-de-pf2e/translation/de/compendium";
        const systemFile = "modules/lang-de-pf2e/translation/de/de.json";

        try {
            console.log("Phil's Journal Translator | Loading official translations...");

            // 1. Load System Translations (de.json AND en.json)
            try {
                const sysResponseDe = await fetch(systemFile);
                const sysJsonDe = await sysResponseDe.json();

                // Try to fetch English system file from standard path
                const sysResponseEn = await fetch("systems/pf2e/lang/en.json");
                const sysJsonEn = await sysResponseEn.json();

                if (sysJsonDe && sysJsonEn) {
                    // Helper to recursively traverse and map
                    const traverse = (objEn, objDe) => {
                        for (const key in objEn) {
                            if (objDe.hasOwnProperty(key)) {
                                const valEn = objEn[key];
                                const valDe = objDe[key];

                                if (typeof valEn === 'object' && valEn !== null && typeof valDe === 'object' && valDe !== null) {
                                    traverse(valEn, valDe);
                                } else if (typeof valEn === 'string' && typeof valDe === 'string') {
                                    // Filter out long sentences, IDs, or identical values
                                    if (valEn.length > 2 && valEn.length < 50 && valEn !== valDe) {
                                        // Avoid replacing variables like {0} or HTML in keys
                                        if (!valEn.includes("{") && !valEn.includes("<")) {
                                            // Strip HTML from the translation value (valDe)
                                            const cleanValDe = valDe.replace(/<[^>]*>/g, "");
                                            if (cleanValDe) {
                                                dictionary[valEn] = cleanValDe;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };

                    traverse(sysJsonEn, sysJsonDe);
                    console.log(`Phil's Journal Translator | Loaded ${Object.keys(dictionary).length} system terms from en/de comparison.`);
                }

                // Explicitly add Perception if missed (it might be "Perception Check" in en.json vs "Wahrnehmung" in de.json)
                if (!dictionary["Perception"]) dictionary["Perception"] = "Wahrnehmung";

            } catch (err) {
                console.warn("Phil's Journal Translator | Failed to load system translations (en.json/de.json comparison):", err);

                // Fallback: Load at least de.json for known keys if en.json fails
                try {
                    const sysResponse = await fetch(systemFile);
                    const sysJson = await sysResponse.json();
                    if (sysJson && sysJson.PF2E) {
                        const pf2e = sysJson.PF2E;
                        const add = (key, value) => { if (key && value && typeof value === 'string') dictionary[key] = value; };

                        if (pf2e.Skill) Object.entries(pf2e.Skill).forEach(([k, v]) => add(k, v));
                        const abilityMap = { "Strength": pf2e.AbilityStr, "Dexterity": pf2e.AbilityDex, "Constitution": pf2e.AbilityCon, "Intelligence": pf2e.AbilityInt, "Wisdom": pf2e.AbilityWis, "Charisma": pf2e.AbilityCha };
                        Object.entries(abilityMap).forEach(([k, v]) => add(k, v));
                        add("Perception", "Wahrnehmung");
                    }
                } catch (e) { console.error("Fallback loading failed", e); }
            }

            // 2. Load Compendium Translations
            const FilePickerClass = foundry.applications?.apps?.FilePicker || FilePicker;
            const browseResult = await FilePickerClass.browse("user", packDir);
            const files = browseResult.files.filter(f => f.endsWith(".json"));

            const allowedPatterns = [
                /.*-bestiary\.json$/,
                /^pf2e\.equipment-srd\.json$/,
                /^pf2e\.spells-srd\.json$/,
                /^pf2e\.hazards\.json$/,
                /^pf2e\.vehicles\.json$/,
                /^pf2e\.deities\.json$/,
                /^pf2e\.ancestries\.json$/,
                /^pf2e\.backgrounds\.json$/,
                /^pf2e\.heritages\.json$/,
                /^pf2e\.classes\.json$/,
                /^pf2e\.kingmaker-features\.json$/,
                /^pf2e\.adventure-specific-actions\.json$/,
                /^pf2e\.actionspf2e\.json$/,
                /^pf2e\.classfeatures\.json$/,
                /^pf2e\.journals\.json$/,
                /^pf2e\.conditionitems\.json$/,
                /^pf2e\.feats-srd\.json$/,
                /^pf2e\.npc-gallery\.json$/
            ];

            const blockedTerms = new Set([
                "I", "A", "An", "The", "In", "On", "At", "To", "For", "Of", "With", "By",
                "Stand", "Cause", "Classes", "Turn", "Round", "Level", "Die", "Hit", "Miss",
                "Name", "Description", "Source", "Type", "Traits", "Rarity", "Price", "Usage", "Bulk",
                "Stride", "Strike", "Step", "Interact", "Drop", "Leap", "Escape", "Seek",
                // Generic terms that are also Conditions/Attitudes but shouldn't be auto-replaced
                "Hidden", "Observed", "Concealed", "Friendly", "Helpful", "Hostile", "Indifferent", "Unfriendly",
                // Common UI/Text terms that cause "Denglisch"
                "Items", "Item", "Treasure", "Consumable", "Permanent", "Chapter", "Hero", "Heroes", "Student", "Students", "Inventory", "Details"
            ]);

            for (const file of files) {
                const fileName = file.split("/").pop();
                if (!allowedPatterns.some(pattern => pattern.test(fileName))) {
                    continue;
                }

                try {
                    const response = await fetch(file);
                    const json = await response.json();

                    if (json.entries) {
                        for (const [key, value] of Object.entries(json.entries)) {
                            if (value.name && key !== value.name) {
                                if (blockedTerms.has(key)) continue;
                                if (key.length <= 2) continue;
                                // Strip HTML from value
                                const cleanValue = value.name.replace(/<[^>]*>/g, "");
                                if (cleanValue) {
                                    dictionary[key] = cleanValue;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`Phil's Journal Translator | Failed to load ${file}:`, err);
                }
            }
            console.log(`Phil's Journal Translator | Loaded ${Object.keys(dictionary).length} official translations.`);
        } catch (err) {
            console.error("Phil's Journal Translator | Error loading official translations:", err);
            return {};
        }

        this._cache = dictionary;
        return dictionary;
    }
}
