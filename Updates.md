# Changelog

## v1.2.1 (December 10, 2025)
*   **Visual Tracking for Grammar Checks**: Added a new icon (`fa-spell-check`) to the page list. Now you can distinguish between pages that are just "Translated" (Green Check) and pages that have been "Grammar Checked" (Blue Spell Check).
*   **Status Tracking**: The module now distinctively tracks `aiProcessed` (Translation) and `aiGrammarChecked` (Grammar Check) states.
*   **Legal Updates**: Added prominent legal notices regarding private use of copyrighted translations.
*   **Metadata Fixes**: Corrected `module.json` license and readme fields.

## v1.2.0 Update

*   **NEU: Grammatik-Check Modus:**
    *   Ein neuer Modus prüft bereits deutsche Texte auf Grammatik, Rechtschreibung und Ausdruck, ohne sie neu zu übersetzen. Ideal für selbstgeschriebene Abenteuer oder DeepL-Vorübersetzungen.
*   **NEU: Indexed Glossary Protection:**
    *   Sowohl im Grammatik-Check als auch in der Übersetzung werden Glossar-Begriffe nun "hart" geschützt (`[[#ID:Begriff]]`).
    *   Offizielle Begriffe aus dem `lang-de-pf2e` Modul werden automatisch erkannt und geschützt, selbst wenn kein eigenes AI Glossar existiert.
*   **NEU: Konflikt-Management Dialog:**
    *   Sollte die KI (trotz Verbot) versuchen, einen geschützten Begriff zu ändern, fängt das Modul dies ab und zeigt einen Konflikt-Dialog.
    *   Du kannst für jeden Begriff entscheiden: "Original behalten" (Standard / Sicher) oder "KI-Änderung akzeptieren".
*   **Verbessert: Prompt-Sicherheit:**
    *   Prompts wurden weiter gehärtet, um Halluzinationen bei JSON-Strukturen zu minimieren.
*   **Code Cleanup:**
    *   Der Code wurde entrümpelt und optimiert. Keine "KI-Überreste" mehr in den Logs.

## v1.1.5 Update

*   **BUGFIX: Dialog-Reihenfolge:**
    *   Ein Fehler wurde behoben, bei dem das "Nächster Batch"-Fenster gleichzeitig mit dem "Glossar Update"-Fenster geöffnet wurde. Die Dialoge erscheinen nun korrekt nacheinander.
*   **BUGFIX: Syntax Error:**
    *   Ein kritischer Syntax-Fehler (`Declaration or statement expected`) wurde behoben, der das Modul unbenutzbar machte.

## v1.1.4 Update

*   **NEU: Optimierte Prompt-Struktur:**
    *   Die KI-Prompts wurden komplett überarbeitet und in eine klare Struktur (`Role / Input / Security / Logic / Output`) gegliedert. Das sorgt für deutlich stabilere und konsistentere Ergebnisse bei allen KI-Modellen.
*   **NEU: Verbesserte Glossar-Logik:**
    *   Die KI gibt nun kein leeres JSON-Objekt mehr zurück, wenn keine neuen Begriffe gefunden wurden, sondern eine kurze Textnachricht. Das verhindert Verwirrung und unnötige "leere" Updates.
*   **NEU: Intelligente Begriffs-Korrektur:**
    *   Die Regel für vorübersetzte Begriffe (`%%Original%%`) wurde verfeinert: Die KI darf diese nun anpassen, wenn es **zwingend** für die Grammatik oder Logik des Satzes notwendig ist. Das verhindert "hölzerne" Übersetzungen.

## v1.1.3 Update

*   **NEU: Deep ID Check (Sicherheit):**
    *   Das Modul prüft nun **rekursiv jede einzelne ID** in der KI-Antwort gegen das Original-Dokument.
    *   Verhindert, dass die KI versehentlich interne IDs (z.B. von `pdftofoundry`) erfindet oder verändert, was zu Datenverlust führen könnte.
*   **NEU: Verbesserte Lokalisierung:**
    *   Alle Dialoge und Fehlermeldungen sind nun vollständig ins Deutsche übersetzt (inkl. Glossar-Update-Fenster).
    *   "Unsorted" wird nun korrekt als "Unsortiert" angezeigt.
*   **NEU: Konsistente Namens-Prompts:**
    *   Die KI wird nun explizit angewiesen, Namen immer zweisprachig (`Deutsch / Englisch`) zu formatieren, wenn ein Glossar verwendet wird.

## v1.1.2 Update

*   **NEU: Smarter Backup:**
    *   Das Modul erstellt nun **keine doppelten Backups** mehr. Wenn bereits ein Backup existiert (z.B. "Kapitel 1 (Backup)"), wird dieses behalten und kein neues erstellt. Das verhindert, dass dein Journal-Ordner zugemüllt wird, wenn du Batch-Übersetzungen machst.
    *   Das Backup repräsentiert somit immer den **Originalzustand** vor der allerersten Übersetzung.
*   **NEU: Auto-Next-Batch Fix & Skip Button:**
    *   Der automatische Workflow für große Journale ("Nächster Batch") wurde verbessert und ist nun zuverlässiger.
    *   Ein neuer **"Überspringen / Weiter"** Button im Glossar-Dialog erlaubt es, den Glossar-Schritt zu überspringen und direkt mit dem nächsten Batch fortzufahren.
*   **NEU: Glossar Priorität:**
    *   Begriffe aus deinem `AI Glossary` haben nun **Vorrang** vor offiziellen Systemübersetzungen. Das gibt dir volle Kontrolle über spezifische Namen und Begriffe.
*   **NEU: Auto-Next-Batch Workflow:**
    *   Übersetzt du ein langes Journal? Das Modul öffnet nach jedem Batch automatisch das Fenster für die nächsten 10 Seiten. Kein manuelles Klicken mehr!
*   **Smart Warnings:**
    *   Warnt dich, wenn du noch kein Glossar hast, bevor du eine Übersetzung startest.
*   **Kontext-Awareness:**
    *   Lädt automatisch offizielle Übersetzungen (Skills, Conditions, etc.) aus dem PF2e-System und weist die KI an, diese zu nutzen.
*   **Glossar-Integration:**
    *   Erstellt und pflegt ein `AI Glossary` Journal. Die KI nutzt dieses Glossar für konsistente Namen über alle Texte hinweg.
*   **Batch-Verarbeitung:**
    *   Wählt automatisch immer 10 Seiten auf einmal aus, um Context-Limits der KI nicht zu sprengen.
*   **Multi-Provider Support:**
    *   Bereitet Prompts vor für: **ChatGPT, Claude, Gemini, Copilot, Perplexity**.
