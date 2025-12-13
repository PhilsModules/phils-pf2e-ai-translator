import { loc, resolvePrompt, getCleanData, getContextDescription, processUpdate, addToGlossary, MODULE_ID, injectOfficialTranslations, injectGlossaryMarkers, applyResolvedUpdate, calculateTranslationStats } from './TranslationLogic.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const THEMES = {
    gemini: { url: "https://gemini.google.com/app" },
    chatgpt: { url: "https://chatgpt.com/" },
    claude: { url: "https://claude.ai/new" },
    copilot: { url: "https://copilot.microsoft.com/" },
    perplexity: { url: "https://www.perplexity.ai/" }
};

export class TranslationAssistantApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "translation-assistant",
        tag: "form",
        window: {
            title: "AI Translation Assistant",
            icon: "fas fa-language",
            resizable: true
        },
        position: {
            width: 500,
            height: "auto"
        },
        form: {
            handler: TranslationAssistantApp.myFormHandler,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        form: {
            template: "modules/phils-pf2e-ai-translator/templates/translation-dropzone.hbs"
        }
    };

    constructor(options = {}) {
        super(options);
        // Ensure title is localized
        this.options.window.title = loc('Title') || "AI Translation Assistant";
    }

    async _prepareContext(_options) {
        return {
            labels: {
                selectJournalHelp: loc('SelectJournalHelp') || "Please drop a Journal Entry here or select one.",
                dropZone: loc('DropZone') || "Drag Journal Here",
                btnStats: loc('BtnStats') || "Statistics"
            }
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);
        const html = this.element;
        const dropZone = html.querySelector('#drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.background = "#333"; });
            dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.style.background = ""; });
            dropZone.addEventListener('drop', async e => {
                e.preventDefault();
                dropZone.style.background = "";
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));

                let doc = null;
                const JournalEntry = globalThis.JournalEntry;
                const JournalEntryPage = globalThis.JournalEntryPage;

                if (data.type === "JournalEntry") {
                    doc = await JournalEntry.fromDropData(data);
                } else if (data.type === "JournalEntryPage") {
                    const page = await JournalEntryPage.fromDropData(data);
                    if (page) doc = page.parent;
                }

                if (doc) {
                    if (!doc.isOwner) {
                        ui.notifications.warn(loc('WarnNoPermission') || "You do not have permission to translate this Journal (Required: Owner).");
                        return;
                    }
                    this.close(); // Close self
                    new TranslationConfigApp({ document: doc }).render(true); // Open config
                } else {
                    ui.notifications.warn(loc('WarnDropJournal') || "Please drop a Journal Entry or a Page.");
                }
            });
        }

        const statsBtn = html.querySelector('[data-action="open-stats"]');
        if (statsBtn) {
            statsBtn.addEventListener('click', async () => {
                const stats = await calculateTranslationStats();
                new TranslationStatsApp({ stats }).render(true);
            });
        }
    }

    static async myFormHandler(event, form, formData) {
        // No form submission needed for the drop zone
    }
}

export class TranslationConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.document = options.document;
        this.mode = options.mode || 'translate';

        let titleName = this.document ? this.document.name : "";
        this.options.window.title = `Translate: ${titleName}`;
    }

    static DEFAULT_OPTIONS = {
        id: "translation-config",
        tag: "form",
        window: {
            title: "Translate",
            icon: "fas fa-language",
            resizable: true,
            contentClasses: ["standard-form"]
        },
        position: {
            width: 500,
            height: "auto"
        },
        form: {
            handler: TranslationConfigApp.myFormHandler,
            closeOnSubmit: false
        },
        actions: {
            selectAll: TranslationConfigApp.onSelectAll,
            selectNone: TranslationConfigApp.onSelectNone,
            selectNext: TranslationConfigApp.onSelectNext,
            copyPrompt: TranslationConfigApp.onCopyPrompt,
            grammarCheck: TranslationConfigApp.onGrammarCheck
        }
    };

    static PARTS = {
        form: {
            template: "modules/phils-pf2e-ai-translator/templates/translation-config.hbs"
        }
    };

    async _prepareContext(_options) {
        const doc = this.document;
        const context = {
            hasPages: doc.pages.size > 0,
            title: loc('TitleTranslating', { name: doc.name }) || `Translating: ${doc.name}`,
            labels: {
                labelPagesToTranslate: loc('LabelPagesToTranslate') || "Pages to Translate:",
                btnSelectAll: loc('BtnSelectAll') || "All",
                btnSelectNone: loc('BtnSelectNone') || "None",
                btnNextBatch: loc('BtnNextBatch') || "Next Batch",
                warnPageLimit: loc('WarnPageLimit') || "Warning: >10 pages selected.",
                labelOnlyNames: loc('LabelOnlyNames') || "Only Generate Glossary (Names)",
                labelCustomInstruct: loc('LabelCustomInstruct') || "Custom Instructions (Optional):",
                placeholderCustomInstruct: loc('PlaceholderCustomInstruct') || "E.g. 'Translate to German, keep archaic tone.'",
                btnCopy: loc('BtnCopy') || "Copy Prompt",
                btnGrammarCheck: loc('BtnGrammarCheck') || "Grammar Check"
            },
            pages: [],
            prompt: "",
            showWarning: false,
            onlyNames: false
        };

        if (context.hasPages) {
            const batchSize = game.settings.get(MODULE_ID, 'batchSize') || 10;
            const pageList = Array.from(doc.pages);
            let selectedCount = 0;
            const targetFlag = (this.mode === 'grammar') ? 'aiGrammarChecked' : 'aiProcessed';

            context.pages = pageList.map(p => {
                const isProcessed = p.getFlag(MODULE_ID, 'aiProcessed');
                const isGrammarChecked = p.getFlag(MODULE_ID, 'aiGrammarChecked');
                const isCompletedForMode = (this.mode === 'grammar') ? isGrammarChecked : isProcessed;

                let isChecked = false;
                // Auto-select logic
                if (!isCompletedForMode && selectedCount < batchSize) {
                    isChecked = true;
                    selectedCount++;
                }

                return {
                    id: p.id,
                    name: p.name,
                    checked: isChecked,
                    isProcessed: isProcessed,
                    isGrammarChecked: isGrammarChecked
                };
            });

            if (selectedCount > 10) context.showWarning = true;
        }

        return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        // Re-bind warning check on change
        const html = this.element;
        const checkboxes = html.querySelectorAll('.page-selector');
        const warningDiv = html.querySelector('#page-limit-warning');

        if (checkboxes.length > 0 && warningDiv) {
            const checkPageLimit = () => {
                const checkedCount = Array.from(checkboxes).filter(c => c.checked).length;
                if (checkedCount > 10) warningDiv.style.display = 'block';
                else warningDiv.style.display = 'none';
            };
            checkboxes.forEach(c => c.addEventListener('change', checkPageLimit));
        }
    }

    // --- Actions ---

    static onSelectAll(event, target) {
        this.element.querySelectorAll('.page-selector').forEach(c => c.checked = true);
        this.render(); // Re-render to update state/warning? Or direct DOM manipulation is fine. 
        // V2 re-render might reset state if not persisted, but checkboxes are inputs.
        // Direct DOM manipulation is safer for simple checkbox toggles without full re-render.
        this.element.querySelector('#page-limit-warning').style.display = 'block'; // assume > 10 if all
    }

    static onSelectNone(event, target) {
        this.element.querySelectorAll('.page-selector').forEach(c => c.checked = false);
        this.element.querySelector('#page-limit-warning').style.display = 'none';
    }

    static onSelectNext(event, target) {
        const batchSize = game.settings.get(MODULE_ID, 'batchSize') || 10;
        const checkboxes = Array.from(this.element.querySelectorAll('.page-selector'));
        let lastCheckedIndex = -1;

        checkboxes.forEach((el, index) => {
            if (el.checked) lastCheckedIndex = index;
        });

        checkboxes.forEach(c => c.checked = false);

        const start = lastCheckedIndex + 1;
        let count = 0;
        if (start < checkboxes.length) {
            for (let i = start; i < checkboxes.length; i++) {
                if (count < batchSize) { checkboxes[i].checked = true; count++; }
            }
        } else {
            // Check from beginning
            for (let i = 0; i < checkboxes.length; i++) {
                if (count < batchSize) { checkboxes[i].checked = true; count++; }
            }
        }

        const checkedCount = checkboxes.filter(c => c.checked).length;
        const warningDiv = this.element.querySelector('#page-limit-warning');
        if (warningDiv) warningDiv.style.display = (checkedCount > 10) ? 'block' : 'none';
    }

    static async onCopyPrompt(event, target) {
        const formData = new FormData(this.element);
        const prompt = formData.get("prompt");
        const onlyNames = this.element.querySelector('#only-names-check')?.checked;

        let selectedPageIds = [];
        this.element.querySelectorAll('.page-selector:checked').forEach(el => selectedPageIds.push(el.value));

        const systemName = game.settings.get(MODULE_ID, 'gameSystem') || "Generic";
        const providerKey = game.settings.get(MODULE_ID, 'aiProvider') || 'gemini';
        const url = THEMES[providerKey]?.url || THEMES.gemini.url;

        // Check Glossary
        const glossaryExists = game.journal.some(j => j.name === "AI Glossary" || j.name === "AI Glossar");

        let finalUserPrompt = prompt;
        if (onlyNames) finalUserPrompt += " [IMPORTANT: Analyze/Translate ONLY proper names, places. Ignore body text.]";

        const proceedTranslate = async () => {
            await prepareTranslatePrompt(this.document, finalUserPrompt, systemName, false, url, selectedPageIds);
        };

        const proceedGlossary = async () => {
            // Create glossary mode logic
            let glossaryUserPrompt = prompt + " [IMPORTANT: Analyze/Translate ONLY proper names, places. Ignore body text.]";
            await prepareGlossaryGenPrompt(this.document, glossaryUserPrompt, systemName, false, url, selectedPageIds);
        };

        if (!glossaryExists && !onlyNames) {
            new ConfirmationApp({
                title: loc('TitleNoGlossary') || "No Glossary Found",
                content: loc('WarnNoGlossary') || "No 'AI Glossary' found. It is recommended to generate a glossary first to ensure consistent names.",
                buttons: [
                    { action: 'generate', label: loc('BtnGenGlossaryFirst') || "Generate Glossary First", icon: "fas fa-book" },
                    { action: 'proceed', label: loc('BtnProceedAnyway') || "Proceed Anyway", icon: "fas fa-arrow-right" }
                ],
                callbacks: {
                    generate: proceedGlossary,
                    proceed: proceedTranslate
                }
            }).render(true);
            return;
        }

        if (onlyNames) await proceedGlossary();
        else await proceedTranslate();
    }

    static async onGrammarCheck(event, target) {
        const formData = new FormData(this.element);
        const prompt = formData.get("prompt");
        let selectedPageIds = [];
        this.element.querySelectorAll('.page-selector:checked').forEach(el => selectedPageIds.push(el.value));

        const systemName = game.settings.get(MODULE_ID, 'gameSystem') || "Generic";
        const providerKey = game.settings.get(MODULE_ID, 'aiProvider') || 'gemini';
        const url = THEMES[providerKey]?.url || THEMES.gemini.url;

        const glossaryExists = game.journal.some(j => j.name === "AI Glossary" || j.name === "AI Glossar");
        if (!glossaryExists) {
            ui.notifications.warn(loc('WarnNoGlossary') || "No 'AI Glossary' found. Grammar check might miss protected terms.");
        }

        await prepareGrammarCheckPrompt(this.document, prompt, systemName, false, url, selectedPageIds);
    }

    static async myFormHandler(event, form, formData) { }
}


export class ConfirmationApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.content = options.content;
        this.buttons = options.buttons;
        this.callbacks = options.callbacks;
        this.options.window.title = options.title || "Confirmation";
    }

    static DEFAULT_OPTIONS = {
        id: "confirmation-dialog",
        tag: "form",
        window: {
            title: "Confirmation",
            icon: "fas fa-question-circle",
            resizable: false,
            contentClasses: ["standard-form"]
        },
        position: {
            width: 400,
            height: "auto"
        },
        form: {
            handler: ConfirmationApp.myFormHandler,
            closeOnSubmit: true
        },
        actions: {
            // Dynamic actions handled in _onClickAction if not mapped
        }
    };

    // Override _onClickAction to handle dynamic buttons
    _onClickAction(event, target) {
        const action = target.dataset.action;
        if (this.callbacks && this.callbacks[action]) {
            this.callbacks[action]();
            this.close();
        }
    }

    static PARTS = {
        form: {
            template: "modules/phils-pf2e-ai-translator/templates/confirmation.hbs"
        }
    };

    async _prepareContext(_options) {
        return {
            content: this.content,
            buttons: this.buttons
        };
    }

    static async myFormHandler(event, form, formData) { }
}

export class TranslationResultApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.document = options.document;
        this.initialContent = options.initialContent || "";
        this.errorMsg = options.errorMsg || null;

        // Flags
        this.expectGlossaryCreation = options.expectGlossaryCreation || false;
        this.expectGlossaryUpdate = options.expectGlossaryUpdate || false;
        this.isGlossaryMode = options.isGlossaryMode || false;
        this.processingMode = options.processingMode || 'translate';
        this.selectedPages = options.selectedPages || null;

        let title = this.isGlossaryMode ? (loc('CreateGlossaryTitle') || "Create AI Glossary") : `Update: ${this.document.name}`;
        this.options.window.title = title;
    }

    static DEFAULT_OPTIONS = {
        id: "translation-result",
        tag: "form",
        window: {
            title: "Result",
            icon: "fas fa-edit",
            resizable: true,
            contentClasses: ["standard-form"]
        },
        position: {
            width: 600,
            height: "auto"
        },
        form: {
            handler: TranslationResultApp.myFormHandler,
            closeOnSubmit: false
        },
        actions: {
            update: TranslationResultApp.onUpdate,
            skip: TranslationResultApp.onSkip
        }
    };

    static PARTS = {
        form: {
            template: "modules/phils-pf2e-ai-translator/templates/translation-result.hbs"
        }
    };

    async _prepareContext(_options) {
        return {
            errorMsg: this.errorMsg,
            initialContent: this.initialContent,
            label: this.isGlossaryMode ? (loc('PasteGlossaryLabel') || "Paste Glossary JSON Block:") : (loc('ResultLabel') || "Paste AI Response (JSON):"),
            btnLabel: this.isGlossaryMode ? (loc('BtnCreateGlossary') || "Create Glossary") : (loc('BtnUpdate') || "Update Journal"),
            btnSkip: loc('BtnSkip') || "Skip / Next",
            isGlossaryMode: this.isGlossaryMode,
            placeholderText: loc('PlaceholderPaste', { providerName: "AI" }) || `Press CTRL+V here to paste the JSON code...`
        };
    }

    static async onUpdate(event, target) {
        const formData = new FormData(this.element);
        let text = formData.get("aiResponse");

        if (text) {
            // 1. Validation: markers
            // Dynamic Markers
            const startMarker = loc('Markers.StartResponse') || "[START_RESPONSE]";
            const endMarker = loc('Markers.EndResponse') || "[END_RESPONSE]";

            // Check for [END_RESPONSE] (or localized equivalent)
            if (!text.includes(endMarker)) {
                // FALLBACK: User might have copied ONLY the JSON code block.
                // If we see "```json" or a starting "{", we treat it as valid manual input.
                if (text.includes("```json") || text.trim().startsWith("{")) {
                    console.warn("Phils Translator | Markers missing, but JSON structure detected. Proceeding.");
                } else {
                    const errorText = (loc('ErrorIncompleteResponse') || "Error: Incomplete AI Response detected!").replace("[END_RESPONSE]", endMarker);
                    this.errorMsg = errorText;
                    this.initialContent = text;
                    this.render();
                    return;
                }
            } else {
                // Safe to clean
                text = text.replace(startMarker, "").replace(endMarker, "").trim();
            }

            // Validate Glossary JSON confusion
            if (!this.isGlossaryMode && (text.includes('"name": "AI Glossary"') || text.includes('"name": "AI Glossar"'))) {
                const errorText = loc('ErrorGlossaryInTranslation') || "Error: It looks like you pasted the Glossary JSON here.";
                this.errorMsg = errorText;
                this.initialContent = text;
                this.render();
                return;
            }
            if (this.isGlossaryMode && !(text.includes('"name": "AI Glossary"') || text.includes('"name": "AI Glossar"'))) {
                const errorText = loc('ErrorInvalidGlossaryJson') || "Error: This does not look like the Glossary JSON.";
                this.errorMsg = errorText;
                this.initialContent = text;
                this.render();
                return;
            }

            const result = await processUpdate(this.document, text, this.processingMode, this.selectedPages);

            if (typeof result === 'string') {
                this.errorMsg = result;
                this.initialContent = text;
                this.render();
            } else if (result && result.status === 'conflict') {
                // Show Conflict App
                new ConflictResolutionApp({
                    document: this.document,
                    conflicts: result.conflicts,
                    jsonData: result.jsonData,
                    processingMode: this.processingMode,
                    selectedPages: this.selectedPages,
                    parentApp: this // to potentially return or close
                }).render(true);
                this.close();
            } else if (result === true || result.success) {
                // Success
                const glossaryHandled = (result.newGlossaryItems && result.newGlossaryItems.length > 0);
                const willOpenGlossaryDialog = (this.expectGlossaryCreation || this.expectGlossaryUpdate) && !this.isGlossaryMode && !glossaryHandled;

                if (glossaryHandled) {
                    new GlossaryUpdateApp({
                        newItems: result.newGlossaryItems,
                        document: this.document,
                        processingMode: this.processingMode
                    }).render(true);
                    this.close();
                } else if (willOpenGlossaryDialog) {
                    // Open Glossary Mode next
                    setTimeout(() => {
                        new TranslationResultApp({
                            document: this.document,
                            initialContent: "",
                            isGlossaryMode: true,
                            processingMode: this.processingMode,
                            // selectedPages irrelevant for glossary creation usually but pass it
                            selectedPages: this.selectedPages
                        }).render(true);
                    }, 500);
                    this.close();
                } else {
                    checkNextBatch(this.document, this.processingMode);
                    this.close();
                }
            }
        }
    }

    static onSkip(event, target) {
        checkNextBatch(this.document, this.processingMode);
        this.close();
    }

    static async myFormHandler(event, form, formData) { }
}


export class ConflictResolutionApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.document = options.document;
        this.conflicts = options.conflicts;
        this.jsonData = options.jsonData;
        this.processingMode = options.processingMode;
        this.selectedPages = options.selectedPages;
        this.options.window.title = loc('TitleConflict') || "Glossary Conflicts Detected";
    }

    static DEFAULT_OPTIONS = {
        id: "conflict-resolution",
        tag: "form",
        window: {
            title: "Conflicts",
            icon: "fas fa-exclamation-triangle",
            resizable: true,
            contentClasses: ["standard-form"]
        },
        position: {
            width: 600,
            height: "auto"
        },
        form: {
            handler: ConflictResolutionApp.myFormHandler,
            closeOnSubmit: false
        },
        actions: {
            apply: ConflictResolutionApp.onApply,
            cancel: ConflictResolutionApp.onCancel,
            useAllNew: ConflictResolutionApp.onUseAllNew
        }
    };

    static PARTS = {
        form: {
            template: "modules/phils-pf2e-ai-translator/templates/translation-conflict.hbs"
        }
    };

    async _prepareContext(_options) {
        return {
            conflicts: this.conflicts,
            labels: {
                descConflict: loc('DescConflict') || "The AI changed protected glossary terms. Please decide:",
                labelConflictChanged: loc('LabelConflictChanged') || "Term Changed/Missing:",
                labelOriginalContext: loc('LabelOriginalContext') || "Original:",
                labelNewContext: loc('LabelNewContext') || "New (Est.):",
                descConflictHint: loc('DescConflictHint') || "Select 'Restore' to revert to the Glossary term, or 'Keep New' to accept the AI's change.",
                btnApplyResolution: loc('BtnApplyResolution') || "Apply Selection",
                btnUseAllNew: loc('BtnUseAllNew') || "Use All New",
                btnCancel: loc('BtnCancel') || "Cancel"
            }
        };
    }

    static onUseAllNew(event, target) {
        // Find all radio buttons with value="keep" and check them
        const radioButtons = this.element.querySelectorAll('input[type="radio"][value="keep"]');
        radioButtons.forEach(radio => radio.checked = true);
    }

    static async onApply(event, target) {
        const formData = new FormData(this.element);
        const resolutions = {};

        this.conflicts.forEach(c => {
            const val = formData.get(`conflict_${c.id}`);
            if (val === 'keep') {
                resolutions[c.id] = 'keep';
            } else {
                resolutions[c.id] = c.original;
            }
        });

        await applyResolvedUpdate(this.document, this.jsonData, resolutions, this.processingMode, this.selectedPages);
        checkNextBatch(this.document, this.processingMode);
        this.close();
    }

    static onCancel(event, target) {
        this.close();
    }

    static async myFormHandler(event, form, formData) { }
}

export class GlossaryUpdateApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.document = options.document;
        this.newItems = options.newItems;
        this.processingMode = options.processingMode;
        this.options.window.title = loc('TitleUpdateGlossary') || "Update AI Glossary";
    }

    static DEFAULT_OPTIONS = {
        id: "glossary-update",
        tag: "form",
        window: {
            title: "Update Glossary",
            icon: "fas fa-book",
            resizable: true,
            contentClasses: ["standard-form"]
        },
        position: {
            width: 400,
            height: "auto"
        },
        form: {
            handler: GlossaryUpdateApp.myFormHandler,
            closeOnSubmit: false
        },
        actions: {
            add: GlossaryUpdateApp.onAdd,
            cancel: GlossaryUpdateApp.onCancel
        }
    };

    static PARTS = {
        form: {
            template: "modules/phils-pf2e-ai-translator/templates/translation-glossary.hbs"
        }
    };

    async _prepareContext(_options) {
        return {
            newItems: this.newItems,
            labels: {
                textNewTermsFound: loc('TextNewTermsFound') || "The AI identified new terms. Add them to the glossary?",
                btnAddToGlossary: loc('BtnAddToGlossary') || "Add to Glossary",
                btnCancel: loc('BtnCancel') || "Cancel"
            }
        };
    }

    static async onAdd(event, target) {
        await addToGlossary(this.newItems);
        checkNextBatch(this.document, this.processingMode);
        this.close();
    }

    static onCancel(event, target) {
        checkNextBatch(this.document, this.processingMode);
        this.close();
    }

    static async myFormHandler(event, form, formData) { }
}

export class TranslationStatsApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.stats = options.stats;
        this.options.window.title = loc('StatsTitle') || "Translation Statistics";
    }

    static DEFAULT_OPTIONS = {
        id: "translation-stats",
        tag: "div",
        window: {
            title: "Statistics",
            icon: "fas fa-chart-line",
            resizable: false,
            contentClasses: ["standard-form"]
        },
        position: {
            width: 400,
            height: "auto"
        }
    };

    static PARTS = {
        content: {
            template: "modules/phils-pf2e-ai-translator/templates/translation-stats.hbs"
        }
    };

    async _prepareContext(_options) {
        return {
            stats: this.stats
        };
    }
}


// --- Logic Helpers Adaptations ---

async function prepareTranslatePrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    const cleanData = getCleanData(doc, sendFull, selectedPages);
    const { docData: translatedData } = await injectOfficialTranslations(cleanData);
    const jsonString = JSON.stringify(translatedData, null, 2);

    let promptKey = "TranslateAndCreateGlossary";
    const glossaryExists = game.journal.some(j => j.name === "AI Glossary" || j.name === "AI Glossar");
    if (glossaryExists) promptKey = "TranslateWithGlossary";

    const defaultPrompt = loc('DefaultTranslate') || "Translate.";
    const finalPrompt = resolvePrompt(promptKey, { systemName, jsonString, userPrompt: userPrompt || defaultPrompt, glossaryContent: "", replacedTermsList: "" });

    const expectGlossaryCreation = (promptKey === "TranslateAndCreateGlossary");
    const expectGlossaryUpdate = (promptKey === "TranslateWithGlossary");

    copyAndOpen(finalPrompt, doc, true, targetUrl, expectGlossaryCreation, expectGlossaryUpdate, false, 'translate', selectedPages);
}

async function prepareGlossaryGenPrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    const cleanData = getCleanData(doc, sendFull, selectedPages);
    const { docData: translatedData } = await injectOfficialTranslations(cleanData);
    const textContent = getContextDescription(doc, translatedData);
    const defaultPrompt = loc('DefaultGlossary') || "Create a list of important terms.";
    const finalPrompt = resolvePrompt("GenerateGlossary", { systemName, docDesc: textContent, userPrompt: userPrompt || defaultPrompt, replacedTermsList: "" });
    copyAndOpen(finalPrompt, doc, true, targetUrl, false, false, true, 'translate', selectedPages);
}

async function prepareGrammarCheckPrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    const cleanData = getCleanData(doc, sendFull, selectedPages);
    const { processedData: cleanWithMarkers } = await injectGlossaryMarkers(cleanData);
    const jsonString = JSON.stringify(cleanWithMarkers, null, 2);
    const defaultPrompt = loc('DefaultGrammarCheck') || "Check grammar and logic.";
    const finalPrompt = resolvePrompt("GrammarCheck", { systemName, jsonString, userPrompt: userPrompt || defaultPrompt });
    copyAndOpen(finalPrompt, doc, true, targetUrl, false, false, false, 'grammar', selectedPages);
}

async function copyAndOpen(text, doc, isUpdateMode, targetUrl, expectGlossaryCreation = false, expectGlossaryUpdate = false, isGlossaryMode = false, processingMode = 'translate', selectedPages = null) {
    if (!text) { ui.notifications.error(loc('ErrorEmptyPrompt') || "Error: Empty Prompt"); return; }

    // Add Markers (Localized)
    const startP = loc('Markers.StartPrompt') || "[START_PROMPT]";
    const endP = loc('Markers.EndPrompt') || "[END_PROMPT]";
    const finalizedPrompt = `${startP}\n${text}\n${endP}`;

    // Check Length
    const maxLen = game.settings.get(MODULE_ID, 'maxPromptLength') || 100000;

    const executeCopy = async () => {
        try {
            await navigator.clipboard.writeText(finalizedPrompt);
            ui.notifications.info(loc('PromptCopied') || "Prompt copied to clipboard!");
            window.open(targetUrl, "_blank");
            if (isUpdateMode) {
                new TranslationResultApp({
                    document: doc,
                    initialContent: "",
                    expectGlossaryCreation: expectGlossaryCreation,
                    expectGlossaryUpdate: expectGlossaryUpdate,
                    isGlossaryMode: isGlossaryMode,
                    processingMode: processingMode,
                    selectedPages: selectedPages
                }).render(true);
            }
        } catch (err) { ui.notifications.error(loc('ErrorCopyFailed') || "Copy failed"); }
    };

    if (finalizedPrompt.length > maxLen) {
        new ConfirmationApp({
            title: "Prompt Size Warning",
            content: loc('WarnPromptTooLong', { length: finalizedPrompt.length, limit: maxLen }) || `Warning: Prompt too long (${finalizedPrompt.length} > ${maxLen}).`,
            buttons: [
                { action: 'proceed', label: loc('BtnProceedAnyway') || "Proceed Anyway", icon: "fas fa-exclamation-triangle" },
                { action: 'cancel', label: loc('BtnCancel') || "Cancel", icon: "fas fa-times" }
            ],
            callbacks: {
                proceed: executeCopy,
                cancel: () => { }
            }
        }).render(true);
    } else {
        await executeCopy();
    }
}

function checkNextBatch(doc, processingMode = 'translate') {
    setTimeout(() => {
        const freshDoc = game.journal.get(doc.id);
        if (freshDoc && freshDoc.documentName === "JournalEntry") {
            const targetFlag = (processingMode === 'grammar') ? 'aiGrammarChecked' : 'aiProcessed';
            const hasMore = freshDoc.pages.some(p => !p.getFlag(MODULE_ID, targetFlag));

            console.log(`Phils Translator | Check Next Batch (${processingMode}): ${hasMore} (Pages: ${freshDoc.pages.size})`);
            if (hasMore) {
                const msg = (processingMode === 'grammar') ? (loc('InfoNextBatchGrammar') || "Opening next Grammar Check batch...") : (loc('InfoNextBatch') || "Opening next Translation batch...");
                ui.notifications.info(msg);
                setTimeout(() => {
                    new TranslationConfigApp({ document: freshDoc, mode: processingMode }).render(true);
                }, 500);
            }
        }
    }, 1000);
}
