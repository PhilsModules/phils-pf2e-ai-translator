import { loc, resolvePrompt, getCleanData, getContextDescription, getGlossaryContent, processUpdate, addToGlossary, MODULE_ID, injectOfficialTranslations } from './TranslationLogic.js';

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
            <div style="text-align: center;">
                <button id="btn-select-journal" type="button">
                    <i class="fas fa-list"></i> ${loc('SelectJournalBtn') || "Select Journal"}
                </button>
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

                html.find('#btn-select-journal').click(() => {
                    const journals = globalThis.game.journal?.contents.filter(j => j.isOwner) || [];
                    if (journals.length === 0) {
                        ui.notifications.warn(loc('WarnNoJournalsOwned') || "No journals found that you own.");
                        return;
                    }

                    let options = "";
                    journals.forEach(j => {
                        options += `<option value="${j.id}">${j.name}</option>`;
                    });

                    const selectContent = `
                    <div class="form-group">
                        <label>${loc('LabelChooseJournal') || "Choose Journal:"}</label>
                        <select id="journal-select" style="width: 100%; margin-bottom: 10px;">${options}</select>
                    </div>`;

                    new Dialog({
                        title: loc('TitleSelectJournal') || "Select Journal",
                        content: selectContent,
                        buttons: {
                            select: {
                                label: loc('BtnSelect') || "Select",
                                callback: (h) => {
                                    const id = h.find('#journal-select').val();
                                    const selectedDoc = game.journal.get(id);
                                    if (selectedDoc) {
                                        if (!selectedDoc.isOwner) {
                                            ui.notifications.warn(loc('WarnNoPermission') || "You do not have permission to translate this Journal (Required: Owner).");
                                            return;
                                        }
                                        html.closest('.app').find('.close').click(); // Close main picker
                                        new TranslationDialog(selectedDoc).render(true);
                                    }
                                }
                            }
                        },
                        default: "select"
                    }).render(true);
                });
            }
        }).render(true);
    }
}

export class TranslationDialog {
    constructor(doc) {
        this.doc = doc;
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

            pageList.forEach(p => {
                const isProcessed = p.getFlag(MODULE_ID, 'aiProcessed');
                let isChecked = false;

                // Auto-select logic: Select first 'batchSize' unprocessed pages
                if (!isProcessed && selectedCount < batchSize) {
                    isChecked = true;
                    selectedCount++;
                }

                const statusIcon = isProcessed ? `<i class="fas fa-check-circle" style="color:#2ecc71; margin-left:4px;"></i>` : "";
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
                    icon: '<i class="fas fa-copy"></i>',
                    callback: (html) => {
                        const prompt = html.find('[name="prompt"]').val();
                        const onlyNames = html.find('#only-names-check').is(':checked');
                        let selectedPageIds = [];
                        html.find('.page-selector:checked').each((i, el) => selectedPageIds.push($(el).val()));

                        let finalUserPrompt = prompt;
                        if (onlyNames) finalUserPrompt += " [IMPORTANT: Analyze/Translate ONLY proper names, places. Ignore body text.]";

                        if (onlyNames) prepareGlossaryGenPrompt(doc, finalUserPrompt, systemName, false, url, selectedPageIds);
                        else prepareTranslatePrompt(doc, finalUserPrompt, systemName, false, url, selectedPageIds);
                    }
                }
            },
            default: "go",
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
    const translatedData = await injectOfficialTranslations(cleanData);
    const jsonString = JSON.stringify(translatedData, null, 2);
    const glossaryContent = getGlossaryContent();
    let promptKey = "TranslateAndCreateGlossary";
    if (glossaryContent && glossaryContent.length > 10) promptKey = "TranslateWithGlossary";

    const defaultPrompt = loc('DefaultTranslate') || "Translate.";
    const finalPrompt = resolvePrompt(promptKey, { systemName, jsonString, userPrompt: userPrompt || defaultPrompt, glossaryContent: glossaryContent || "" });
    const expectGlossaryCreation = (promptKey === "TranslateAndCreateGlossary");
    const expectGlossaryUpdate = (promptKey === "TranslateWithGlossary");
    copyAndOpen(finalPrompt, doc, true, targetUrl, expectGlossaryCreation, expectGlossaryUpdate, false);
}

async function prepareGlossaryGenPrompt(doc, userPrompt, systemName, sendFull, targetUrl, selectedPages = null) {
    const cleanData = getCleanData(doc, sendFull, selectedPages);

    // Inject official translations so the AI sees the "German" version of known terms
    // and doesn't suggest them as new glossary items.
    await injectOfficialTranslations(cleanData);

    const textContent = getContextDescription(doc, cleanData);
    const defaultPrompt = loc('DefaultGlossary') || "Create a list of important terms.";
    const finalPrompt = resolvePrompt("GenerateGlossary", { systemName, docDesc: textContent, userPrompt: userPrompt || defaultPrompt });
    copyAndOpen(finalPrompt, doc, true, targetUrl, false, false, true);
}

async function copyAndOpen(text, doc, isUpdateMode, targetUrl, expectGlossaryCreation = false, expectGlossaryUpdate = false, isGlossaryMode = false) {
    if (!text) { ui.notifications.error(loc('ErrorEmptyPrompt') || "Error: Empty Prompt"); return; }
    try {
        await navigator.clipboard.writeText(text);
        ui.notifications.info(loc('PromptCopied') || "Prompt copied to clipboard!");
        window.open(targetUrl, "_blank");
        if (isUpdateMode) showResultDialog(doc, "", null, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode);
    } catch (err) { ui.notifications.error(loc('ErrorCopyFailed') || "Copy failed"); }
}

export function showResultDialog(doc, initialContent = "", errorMsg = null, expectGlossaryCreation = false, expectGlossaryUpdate = false, isGlossaryMode = false) {
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

    new Dialog({
        title: title, content: content,
        buttons: {
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
                            showResultDialog(doc, text, errorText, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode);
                            return;
                        }

                        // 2. Glossary Mode: MUST contain "name": "AI Glossary"
                        if (isGlossaryMode && !(text.includes('"name": "AI Glossary"') || text.includes('"name": "AI Glossar"'))) {
                            const errorText = loc('ErrorInvalidGlossaryJson') || "Error: This does not look like the Glossary JSON. Please paste the Glossary JSON block.";
                            ui.notifications.error(errorText);
                            showResultDialog(doc, text, errorText, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode);
                            return;
                        }

                        const result = await processUpdate(doc, text);

                        if (typeof result === 'string') {
                            showResultDialog(doc, text, result, expectGlossaryCreation, expectGlossaryUpdate, isGlossaryMode);
                        } else if (result === true || result.success) {
                            // Success

                            // Check for new glossary items
                            if (result.newGlossaryItems && result.newGlossaryItems.length > 0) {
                                showGlossaryUpdateDialog(result.newGlossaryItems);
                            }

                            // CHAINING: If we expect a glossary update/creation, open the Glossary Dialog next
                            if ((expectGlossaryCreation || expectGlossaryUpdate) && !isGlossaryMode) {
                                setTimeout(() => {
                                    showResultDialog(doc, "", null, false, false, true);
                                }, 500);
                            }
                        }
                    }
                }
            }
        },
        default: "update"
    }).render(true);
}

function showGlossaryUpdateDialog(newItems) {
    let itemsHtml = "<ul>";
    newItems.forEach(item => {
        itemsHtml += `<li><b>${item.original}</b> = ${item.translation}</li>`;
    });
    itemsHtml += "</ul>";

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
                }
            },
            cancel: {
                label: loc('BtnCancel') || "Cancel",
                icon: '<i class="fas fa-times"></i>'
            }
        },
        default: "add"
    }).render(true);
}
