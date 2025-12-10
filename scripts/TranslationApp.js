import { loc, resolvePrompt, getCleanData, getContextDescription, getGlossaryContent, processUpdate, addToGlossary, MODULE_ID, injectOfficialTranslations, injectGlossaryMarkers, applyResolvedUpdate } from './TranslationLogic.js';

const { FormApplication, Dialog, JournalEntry, JournalEntryPage } = /** @type {any} */ (globalThis);

const THEMES = {
    gemini: { url: "https://gemini.google.com/app" },
    chatgpt: { url: "https://chatgpt.com/" },
    claude: { url: "https://claude.ai/new" },
    copilot: { url: "https://copilot.microsoft.com/" },
    perplexity: { url: "https://www.perplexity.ai/" }
};

export class TranslationAssistant extends FormApplication {
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "translation-assistant",
            title: loc('Title') || "AI Translation Assistant",
            template: "modules/phils-pf2e-ai-translator/templates/translation-assistant.html",
            width: 500,
            height: "auto",
            classes: ["ai-assistant-window"]
        });
    }

    render(force = false) {
        this.startDialog();
    }

    startDialog() {
        const content = `
        <div class="ai-assistant-content">
            <p>${loc('SelectJournalHelp') || "Please drop a Journal Entry here or select one."}</p>
            <div id="drop-zone" style="border: 2px dashed #ccc; padding: 20px; text-align: center; margin-bottom: 10px;">
                ${loc('DropZone') || "Drag Journal Here"}
            </div>

        </div>`;

        new Dialog({
            title: "AI Translation Assistant",
            content: content,
            buttons: {},
            render: (html) => {
                const dropZone = html.find('#drop-zone')[0];
                dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.background = "#333"; });
                dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.style.background = ""; });
                dropZone.addEventListener('drop', async e => {
                    e.preventDefault();
                    dropZone.style.background = "";
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));

                    let doc = null;
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
                        html.closest('.app').find('.close').click(); // Close picker
                        new TranslationDialog(doc).render(true); // Open actual tool
                    } else {
                        ui.notifications.warn(loc('WarnDropJournal') || "Please drop a Journal Entry or a Page.");
                    }
                });


            }
        }).render(true);
    }
}

export class TranslationDialog {
    constructor(doc, mode = 'translate') {
        this.doc = doc;
        this.mode = mode; // 'translate' or 'grammar'
    }

    render(force) {
        this.startGeminiDialog(this.doc);
    }

    startGeminiDialog(doc) {
        const systemName = game.settings.get(MODULE_ID, 'gameSystem') || "Generic";
        const providerKey = game.settings.get(MODULE_ID, 'aiProvider') || 'gemini';
        const url = THEMES[providerKey]?.url || THEMES.gemini.url;

        let pageSelectionHTML = "";
        if (doc.pages.size > 0) {
            const batchSize = game.settings.get(MODULE_ID, 'batchSize') || 10;
            let itemsHTML = "";
            const pageList = Array.from(doc.pages);
            let selectedCount = 0;

            const targetFlag = (this.mode === 'grammar') ? 'aiGrammarChecked' : 'aiProcessed';

            pageList.forEach(p => {
                const isProcessed = p.getFlag(MODULE_ID, 'aiProcessed');
                const isGrammarChecked = p.getFlag(MODULE_ID, 'aiGrammarChecked');

                // Logic based on current mode
                const isCompletedForMode = (this.mode === 'grammar') ? isGrammarChecked : isProcessed;

                let isChecked = false;

                // Auto-select logic: Select first 'batchSize' unprocessed pages for CURRENT MODE
                if (!isCompletedForMode && selectedCount < batchSize) {
                    isChecked = true;
                    selectedCount++;
                }

                const statusIcon = (isProcessed ? `<i class="fas fa-check-circle" style="color:#2ecc71; margin-left:4px;" title="Translated"></i>` : "") +
                    (p.getFlag(MODULE_ID, 'aiGrammarChecked') ? `<i class="fas fa-spell-check" style="color:#3498db; margin-left:4px;" title="Grammar Checked"></i>` : "");
                const checkedAttr = isChecked ? "checked" : "";
                itemsHTML += `
                <div style="display:flex; align-items:center; margin-bottom:4px; font-size:0.9em;">
                    <input type="checkbox" class="page-selector" value="${p.id}" ${checkedAttr} style="margin-right:8px;">
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${p.name}">${p.name}</span>
                    ${statusIcon}
                </div>`;
            });

            const toolbarHTML = `
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <button type="button" id="btn-sel-all" style="flex:1; font-size:11px; line-height:20px; height:24px;"><i class="fas fa-check-double"></i> ${loc('BtnSelectAll') || "All"}</button>
                <button type="button" id="btn-sel-none" style="flex:1; font-size:11px; line-height:20px; height:24px;"><i class="fas fa-times"></i> ${loc('BtnSelectNone') || "None"}</button>
                <button type="button" id="btn-sel-next" style="flex:1; font-size:11px; line-height:20px; height:24px;"><i class="fas fa-forward"></i> ${loc('BtnNextBatch') || "Next Batch"}</button>
            </div>`;

            pageSelectionHTML = `
            <div style="margin-bottom:10px; border:1px solid #444; padding:5px;">
                <label style="font-weight:bold;">${loc('LabelPagesToTranslate') || "Pages to Translate:"}</label>
                ${toolbarHTML}
                <div style="max-height:150px; overflow-y:auto;" id="page-list-container">
                    ${itemsHTML}
                </div>
                <div id="page-limit-warning" style="display:none; color:#ff0000; background-color:#ffe6e6; border:1px solid #ff0000; font-weight:bold; font-size:0.9em; margin-top:5px; padding:5px; border-radius:4px;">
                    <i class="fas fa-exclamation-triangle"></i> ${loc('WarnPageLimit') || "Warning: >10 pages selected."}
                </div>
            </div>
            <div style="margin-bottom:10px;">
                <input type="checkbox" id="only-names-check"> <label for="only-names-check">${loc('LabelOnlyNames') || "Only Generate Glossary (Names)"}</label>
            </div>`;
        }

        const content = `
        <div class="ai-assistant-content">
            <h3>${loc('TitleTranslating', { name: doc.name }) || `Translating: ${doc.name}`}</h3>
            ${pageSelectionHTML}
            <div class="form-group">
                <label>${loc('LabelCustomInstruct') || "Custom Instructions (Optional):"}</label>
                <textarea name="prompt" style="width:100%; height: 60px;" placeholder="${loc('PlaceholderCustomInstruct') || "E.g. 'Translate to German, keep archaic tone.'"}" ></textarea>
            </div>
        </div>`;

        const dialog = new Dialog({
            title: `Translate: ${doc.name}`,
            content: content,
            buttons: {
                go: {
                    label: loc('BtnCopy') || "Copy Prompt",
                    icon: '<i class="fas fa-language"></i>',
                    callback: (html) => {
                        const prompt = html.find('[name="prompt"]').val();
                        const onlyNames = html.find('#only-names-check').is(':checked');
                        let selectedPageIds = [];
                        html.find('.page-selector:checked').each((i, el) => selectedPageIds.push($(el).val()));

                        // Check if Glossary exists
                        const glossaryExists = game.journal.some(j => j.name === "AI Glossary" || j.name === "AI Glossar");

                        if (!glossaryExists && !onlyNames) {
                            // Warn user and suggest creating glossary first
                            new Dialog({
                                title: loc('TitleNoGlossary') || "No Glossary Found",
                                content: `<p>${loc('WarnNoGlossary') || "No 'AI Glossary' found. It is recommended to generate a glossary first to ensure consistent names."}</p>`,
                                buttons: {
                                    generate: {
                                        label: loc('BtnGenGlossaryFirst') || "Generate Glossary First",
                                        icon: '<i class="fas fa-book"></i>',
                                        callback: () => {
                                            // Switch to glossary mode logic
                                            let finalUserPrompt = prompt + " [IMPORTANT: Analyze/Translate ONLY proper names, places. Ignore body text.]";
                                            prepareGlossaryGenPrompt(doc, finalUserPrompt, systemName, false, url, selectedPageIds);
                                        }
                                    },
                                    proceed: {
                                        label: loc('BtnProceedAnyway') || "Proceed Anyway",
                                        icon: '<i class="fas fa-arrow-right"></i>',
                                        callback: () => {
                                            prepareTranslatePrompt(doc, prompt, systemName, false, url, selectedPageIds);
                                        }
                                    }
                                },
                                default: "generate"
                            }).render(true);
                            return;
                        }

                        let finalUserPrompt = prompt;
                        if (onlyNames) finalUserPrompt += " [IMPORTANT: Analyze/Translate ONLY proper names, places. Ignore body text.]";

                        if (onlyNames) prepareGlossaryGenPrompt(doc, finalUserPrompt, systemName, false, url, selectedPageIds);
                        else prepareTranslatePrompt(doc, finalUserPrompt, systemName, false, url, selectedPageIds);
                    }
                },
                check: {
                    label: loc('BtnGrammarCheck') || "Grammar Check",
                    icon: '<i class="fas fa-check-double"></i>',
                    callback: (html) => {
                        const prompt = html.find('[name="prompt"]').val();
                        let selectedPageIds = [];
                        html.find('.page-selector:checked').each((i, el) => selectedPageIds.push($(el).val()));

                        // Check if Glossary exists (warn if not, but proceed)
                        const glossaryExists = game.journal.some(j => j.name === "AI Glossary" || j.name === "AI Glossar");
                        if (!glossaryExists) {
                            ui.notifications.warn(loc('WarnNoGlossary') || "No 'AI Glossary' found. Grammar check might miss protected terms.");
                        }

                        prepareGrammarCheckPrompt(this.doc, prompt, systemName, false, url, selectedPageIds);
                    }
                }
            },
            render: (html) => {
                html.closest('.window-content').css('overflow-y', 'hidden');
                const batchSize = game.settings.get(MODULE_ID, 'batchSize') || 10;
                const warningDiv = html.find('#page-limit-warning');
                const checkboxes = html.find('.page-selector');

                const checkPageLimit = () => {
                    const checkedCount = checkboxes.filter(':checked').length;
                    if (checkedCount > 10) warningDiv.show();
                    else warningDiv.hide();
                    dialog.setPosition({ height: "auto" });
                };

                checkboxes.change(checkPageLimit);

                html.find('#btn-sel-all').click(() => {
                    checkboxes.prop('checked', true);
                    checkPageLimit();
                });
                html.find('#btn-sel-none').click(() => {
                    checkboxes.prop('checked', false);
                    checkPageLimit();
                });

                html.find('#btn-sel-next').click(() => {
                    let lastCheckedIndex = -1;

                    checkboxes.each(function (index) {
                        if ($(this).is(':checked')) lastCheckedIndex = index;
                    });

                    checkboxes.prop('checked', false);

                    const start = lastCheckedIndex + 1;
                    if (start < checkboxes.length) {
                        for (let i = start; i < start + batchSize && i < checkboxes.length; i++) {
                            $(checkboxes[i]).prop('checked', true);
                        }
                    } else {
                        for (let i = 0; i < batchSize && i < checkboxes.length; i++) {
                            $(checkboxes[i]).prop('checked', true);
                        }
                    }
                    checkPageLimit();
                });

                // Initial check
                checkPageLimit();
            }
        });

        dialog.render(true);
    }
}

async function prepareTranslatePrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    const cleanData = getCleanData(doc, sendFull, selectedPages);
    const { docData: translatedData } = await injectOfficialTranslations(cleanData);
    const jsonString = JSON.stringify(translatedData, null, 2);
    // Glossary content is no longer needed in the prompt as we use inline replacements
    let promptKey = "TranslateAndCreateGlossary";
    // Check if glossary exists to determine prompt key, but don't load content
    const glossaryExists = game.journal.some(j => j.name === "AI Glossary" || j.name === "AI Glossar");
    if (glossaryExists) promptKey = "TranslateWithGlossary";

    const defaultPrompt = loc('DefaultTranslate') || "Translate.";
    // We pass empty strings for glossaryContent as they are now inline
    const finalPrompt = resolvePrompt(promptKey, { systemName, jsonString, userPrompt: userPrompt || defaultPrompt, glossaryContent: "", replacedTermsList: "" });
    const expectGlossaryCreation = (promptKey === "TranslateAndCreateGlossary");
    const expectGlossaryUpdate = (promptKey === "TranslateWithGlossary");
    copyAndOpen(finalPrompt, doc, true, targetUrl, expectGlossaryCreation, expectGlossaryUpdate, false, 'translate', selectedPages);
}

async function prepareGlossaryGenPrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    const cleanData = getCleanData(doc, sendFull, selectedPages);

    // Inject official translations so the AI sees the "German" version of known terms
    // and doesn't suggest them as new glossary items.
    const { docData: translatedData } = await injectOfficialTranslations(cleanData);

    const textContent = getContextDescription(doc, translatedData);

    const defaultPrompt = loc('DefaultGlossary') || "Create a list of important terms.";
    const finalPrompt = resolvePrompt("GenerateGlossary", { systemName, docDesc: textContent, userPrompt: userPrompt || defaultPrompt, replacedTermsList: "" });
    copyAndOpen(finalPrompt, doc, true, targetUrl, false, false, true, 'translate', selectedPages);
}

async function prepareGrammarCheckPrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    // 1. Get clean data (this is presumably German text now)
    const cleanData = getCleanData(doc, sendFull, selectedPages);

    // 2. Mark German Terms with [[#ID:Term]]
    // We assume input is already translated (German) or original (if used for that), but logic is to protect glossary terms.
    const { processedData: cleanWithMarkers } = await injectGlossaryMarkers(cleanData);

    const jsonString = JSON.stringify(cleanWithMarkers, null, 2);

    const defaultPrompt = loc('DefaultGrammarCheck') || "Check grammar and logic.";
    const finalPrompt = resolvePrompt("GrammarCheck", { systemName, jsonString, userPrompt: userPrompt || defaultPrompt });

    // Usage: copyAndOpen(text, doc, isUpdateMode, targetUrl, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode, processingMode, selectedPages)
    copyAndOpen(finalPrompt, doc, true, targetUrl, false, false, false, 'grammar', selectedPages);
}

async function copyAndOpen(text, doc, isUpdateMode, targetUrl, expectGlossaryCreation = false, expectGlossaryUpdate = false, isGlossaryMode = false, processingMode = 'translate', selectedPages = null) {
    if (!text) { ui.notifications.error(loc('ErrorEmptyPrompt') || "Error: Empty Prompt"); return; }
    try {
        await navigator.clipboard.writeText(text);
        ui.notifications.info(loc('PromptCopied') || "Prompt copied to clipboard!");
        window.open(targetUrl, "_blank");
        if (isUpdateMode) showResultDialog(doc, "", null, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode, processingMode, selectedPages);
    } catch (err) { ui.notifications.error(loc('ErrorCopyFailed') || "Copy failed"); }
}

export function showResultDialog(doc, initialContent = "", errorMsg = null, expectGlossaryCreation = false, expectGlossaryUpdate = false, isGlossaryMode = false, processingMode = 'translate', selectedPages = null) {
    let errorHTML = "";
    if (errorMsg) {
        errorHTML = `<div style="color:red; border:1px solid red; padding:5px; margin-bottom:5px;">${errorMsg}</div>`;
    }

    const title = isGlossaryMode ? (loc('CreateGlossaryTitle') || "Create AI Glossary") : `Update: ${doc.name}`;
    const label = isGlossaryMode ? (loc('PasteGlossaryLabel') || "Paste Glossary JSON Block:") : (loc('ResultLabel') || "Paste AI Response (JSON):");
    const btnLabel = isGlossaryMode ? (loc('BtnCreateGlossary') || "Create Glossary") : (loc('BtnUpdate') || "Update Journal");

    const providerKey = game.settings.get(MODULE_ID, 'aiProvider') || 'gemini';
    const providerNames = {
        'gemini': 'Gemini',
        'chatgpt': 'ChatGPT',
        'claude': 'Claude',
        'copilot': 'Copilot',
        'perplexity': 'Perplexity'
    };
    const providerName = providerNames[providerKey] || "AI";
    const placeholderText = loc('PlaceholderPaste', { providerName }) || `Press CTRL+V here to paste the JSON code from ${providerName}...`;

    const content = `
    <div class="ai-assistant-content">
        ${errorHTML}
        <p>${label}</p>
        <textarea name="aiResponse" style="width:100%; height: 300px;" placeholder="${placeholderText}">${initialContent}</textarea>
    </div>`;

    const buttons = {
        update: {
            label: btnLabel,
            callback: async (html) => {
                const text = html.find('[name="aiResponse"]').val();
                if (text) {
                    // STRICT FAILSAFE:
                    // 1. Translation Mode: MUST NOT contain "name": "AI Glossary"
                    if (!isGlossaryMode && (text.includes('"name": "AI Glossary"') || text.includes('"name": "AI Glossar"'))) {
                        const errorText = loc('ErrorGlossaryInTranslation') || "Error: It looks like you pasted the Glossary JSON here. Please paste ONLY the Translation JSON.";
                        ui.notifications.error(errorText);
                        showResultDialog(doc, text, errorText, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode, processingMode, selectedPages);
                        return;
                    }

                    // 2. Glossary Mode: MUST contain "name": "AI Glossary"
                    if (isGlossaryMode && !(text.includes('"name": "AI Glossary"') || text.includes('"name": "AI Glossar"'))) {
                        const errorText = loc('ErrorInvalidGlossaryJson') || "Error: This does not look like the Glossary JSON. Please paste the Glossary JSON block.";
                        ui.notifications.error(errorText);
                        showResultDialog(doc, text, errorText, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode, processingMode, selectedPages);
                        return;
                    }

                    const result = await processUpdate(doc, text, processingMode, selectedPages);

                    if (typeof result === 'string') {
                        showResultDialog(doc, text, result, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode, processingMode, selectedPages);
                    } else if (result && result.status === 'conflict') {
                        const dialogResult = await showConflictDialog(doc, text, result.conflicts, processingMode);
                        if (dialogResult && dialogResult.action === 'apply') {
                            const resolutionResult = await applyResolvedUpdate(doc, result.jsonData, dialogResult.resolutions, processingMode, selectedPages);

                            // Handle Success after resolution
                            // Note: Resolution pass does not generate new glossary items usually
                            if (resolutionResult === true || resolutionResult.success) {
                                checkNextBatch(doc, processingMode);
                            }
                        }
                    } else if (result === true || result.success) {
                        // Success

                        // CHAINING: If we expect a glossary update/creation, open the Glossary Dialog next
                        // BUT ONLY if we haven't already found/processed glossary items in this step.
                        const glossaryHandled = (result.newGlossaryItems && result.newGlossaryItems.length > 0);
                        const willOpenGlossaryDialog = (expectGlossaryCreation || expectGlossaryUpdate) && !isGlossaryMode && !glossaryHandled;

                        if (glossaryHandled) {
                            showGlossaryUpdateDialog(result.newGlossaryItems, doc, processingMode);
                        } else if (willOpenGlossaryDialog) {
                            setTimeout(() => {
                                showResultDialog(doc, "", null, false, false, true);
                            }, 500);
                        } else {
                            // AUTO-NEXT-BATCH (Only if no glossary dialog is shown)
                            checkNextBatch(doc, processingMode);
                        }
                    }
                }
            }
        }
    };

    if (isGlossaryMode) {
        buttons.skip = {
            label: loc('BtnSkip') || "Skip / Next",
            icon: '<i class="fas fa-forward"></i>',
            callback: () => {
                checkNextBatch(doc, processingMode);
            }
        };
    }

    new Dialog({
        title: title, content: content,
        buttons: buttons,
        default: "update"
    }).render(true);
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
                    new TranslationDialog(freshDoc, processingMode).render(true);
                }, 500);
            }
        }
    }, 1000); // Wait 1s for updates to propagate
}

async function showConflictDialog(doc, jsonText, conflicts, processingMode = 'translate') {
    return new Promise(resolve => {
        function escapeHtml(text) {
            if (!text) return "";
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        let itemsHtml = "<ul style='padding-left:0; list-style:none;'>";
        conflicts.forEach(c => {
            itemsHtml += `
        <li style="margin-bottom:10px; padding:10px; background:#f0f0f0; border:1px solid #ccc; border-radius:5px;">
            <div style="font-weight:bold; color:#d00; margin-bottom:5px; border-bottom:1px solid #ddd; padding-bottom:3px;">
                ${loc('LabelConflictChanged') || "Term Changed/Missing:"}
            </div>
            
            <div style="margin-bottom:8px;">
                ${c.originalContext ? `<div style="font-family:inherit; font-size:0.9em; line-height:1.4; color:#333; background:#fff; padding:6px; border:1px solid #ccc; border-radius:3px; margin-bottom:5px;"><b>${loc('LabelOriginalContext') || "Original:"}</b><br><i>"${escapeHtml(c.originalContext)}"</i></div>` : ""}
                ${c.newContext ? `<div style="font-family:inherit; font-size:0.9em; line-height:1.4; color:#333; background:#fff; padding:6px; border:1px solid #ccc; border-radius:3px; margin-bottom:5px; border-left: 4px solid #d00;"><b>${loc('LabelNewContext') || "New (Est.):"}</b><br><i>"${escapeHtml(c.newContext)}"</i></div>` : ""}
            </div>

            <div style="display:flex; justify-content:flex-end; gap:15px; align-items:center; background:#ddd; padding:5px; border-radius:3px;">
                <label style="cursor:pointer; font-size:0.9em; display:flex; align-items:center;">
                    <input type="radio" name="conflict_${c.id}" value="restore" checked style="margin-right:5px;">
                    <span>${loc('RadioRestore', { term: c.original }) || `Restore: <b>${c.original}</b>`}</span>
                </label>
                <label style="cursor:pointer; font-size:0.9em; display:flex; align-items:center;">
                    <input type="radio" name="conflict_${c.id}" value="keep" style="margin-right:5px;">
                    <span>${loc('RadioKeep', { term: c.current }) || `Keep New: <b>${c.current}</b>`}</span>
                </label>
            </div>
        </li>`;

        });
        itemsHtml += "</ul>";

        const content = `
    <div style="padding:10px;">
        <p>${loc('DescConflict') || "The AI changed protected glossary terms. Please decide:"}</p>
        <div style="border:1px solid #999; padding:5px; background:#fff; max-height: 60vh; overflow-y: auto;">
            ${itemsHtml}
        </div>
        <p style="margin-top:10px; font-style:italic; font-size:0.9em;">
             ${loc('DescConflictHint') || "Select 'Restore' to revert to the Glossary term, or 'Keep New' to accept the AI's change."}
        </p>
    </div>
    `;

        const d = new Dialog({
            title: loc('TitleConflict') || "Glossary Conflicts Detected",
            content: content,
            buttons: {
                apply: {
                    icon: '<i class="fas fa-check"></i>',
                    label: loc('BtnApplyResolution') || "Apply Selection",
                    callback: (html) => {
                        _onConflictSave(html, conflicts, resolve);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: loc('BtnCancel') || "Cancel",
                    callback: () => resolve({ action: 'cancel' })
                }
            },
            default: "apply",
            close: () => resolve({ action: 'cancel' })
        }, {
            width: 600,
            resizable: true,
            id: "phils-translator-conflict"
        });
        d.render(true);
    });
}

function _onConflictSave(html, conflicts, resolve) {
    const resolutions = {};
    const conflictInputs = html.find('input[type="radio"]:checked');

    conflictInputs.each((index, el) => {
        const name = el.name; // conflict_#123
        const id = name.replace("conflict_", "");
        const value = el.value; // 'restore' or 'keep'

        // Find the conflict object to get the text values
        const conflict = conflicts.find(c => c.id === id);

        if (value === 'keep') {
            resolutions[id] = 'keep';
        } else {
            resolutions[id] = conflict.original;
        }
    });

    resolve({ action: 'apply', resolutions: resolutions });
}
function showGlossaryUpdateDialog(newItems, doc, processingMode = 'translate') {

    new Dialog({
        title: loc('TitleUpdateGlossary') || "Update AI Glossary",
        content: `
        <div class="ai-assistant-content">
            <p>${loc('TextNewTermsFound') || "The AI identified new terms. Add them to the glossary?"}</p>
            <div style="max-height: 200px; overflow-y: auto; background: #eee; padding: 5px; color: #333;">
                ${itemsHtml}
            </div>
        </div>`,
        buttons: {
            add: {
                label: loc('BtnAddToGlossary') || "Add to Glossary",
                icon: '<i class="fas fa-plus"></i>',
                callback: async () => {
                    await addToGlossary(newItems);
                    checkNextBatch(doc, processingMode);
                }
            },
            cancel: {
                label: loc('BtnCancel') || "Cancel",
                icon: '<i class="fas fa-times"></i>',
                callback: () => {
                    checkNextBatch(doc, processingMode);
                }
            }
        },
        default: "add"
    }).render(true);
}

