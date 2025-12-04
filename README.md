![Foundry v13 Compatible](https://img.shields.io/badge/Foundry-v13-brightgreen)
![Foundry v12 Compatible](https://img.shields.io/badge/Foundry-v12-green)
![License](https://img.shields.io/badge/License-GPLv3-blue)
![Version](https://img.shields.io/badge/Version-1.1.4-orange)
[![Patreon](https://img.shields.io/badge/Support-Patreon-ff424d?logo=patreon)](https://www.patreon.com/PhilsModules)

# Phil's PF2e AI Translator

**Automatisierte Übersetzung von Foundry VTT Journalen mit KI (ChatGPT, Claude, Gemini, etc.)**

Dieses Modul hilft dir, **große Abenteuer-Module** oder lange Texte in Foundry VTT schnell und konsistent zu übersetzen. Es ist speziell für **PF2e** optimiert, funktioniert aber auch systemunabhängig.

---

## 🚀 Features (v1.1.4 Update)

*   **NEU: Optimierte Prompt-Struktur:**
    *   Die KI-Prompts wurden komplett überarbeitet und in eine klare Struktur (`Role / Input / Security / Logic / Output`) gegliedert. Das sorgt für deutlich stabilere und konsistentere Ergebnisse bei allen KI-Modellen.
*   **NEU: Verbesserte Glossar-Logik:**
    *   Die KI gibt nun kein leeres JSON-Objekt mehr zurück, wenn keine neuen Begriffe gefunden wurden, sondern eine kurze Textnachricht. Das verhindert Verwirrung und unnötige "leere" Updates.
*   **NEU: Intelligente Begriffs-Korrektur:**
    *   Die Regel für vorübersetzte Begriffe (`%%Original%%`) wurde verfeinert: Die KI darf diese nun anpassen, wenn es **zwingend** für die Grammatik oder Logik des Satzes notwendig ist. Das verhindert "hölzerne" Übersetzungen.

## 🚀 Features (v1.1.3 Update)

*   **NEU: Deep ID Check (Sicherheit):**
    *   Das Modul prüft nun **rekursiv jede einzelne ID** in der KI-Antwort gegen das Original-Dokument.
    *   Verhindert, dass die KI versehentlich interne IDs (z.B. von `pdftofoundry`) erfindet oder verändert, was zu Datenverlust führen könnte.
*   **NEU: Verbesserte Lokalisierung:**
    *   Alle Dialoge und Fehlermeldungen sind nun vollständig ins Deutsche übersetzt (inkl. Glossar-Update-Fenster).
    *   "Unsorted" wird nun korrekt als "Unsortiert" angezeigt.
*   **NEU: Konsistente Namens-Prompts:**
    *   Die KI wird nun explizit angewiesen, Namen immer zweisprachig (`Deutsch / Englisch`) zu formatieren, wenn ein Glossar verwendet wird.

## 🚀 Features (v1.1.2 Update)

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

---

## 🚀 Key Features

* **No API Costs:** Works with the free web versions of Gemini, ChatGPT, & Co.
* **Batch Translation:** Translate multiple pages at once.
* **Glossary Support:** Automatically generates a glossary of names and terms to ensure consistent translation across pages.
* **Smart Paste:** Automatically finds and extracts the JSON code block from the AI response.
* **Official Translation Integration:** Checks the installed German Pathfinder 2e system module for existing translations to ensure consistency with official terms.
* **Context-Aware:** Preserves HTML formatting and links safely.
* **Safety First:** Automatically creates a **Backup** (Copy) of your Journal before applying changes.

## 📦 Installation

1.  Open Foundry VTT.
2.  Go to the **Add-on Modules** tab.
3.  Click **Install Module**.
4.  Paste the following **Manifest URL** into the field:
    ```
    https://github.com/PhilsModules/phils-pf2e-ai-translator/releases/latest/download/module.json
    ```
5.  Click **Install**.

## 📖 How to Use

1.  **Open the Translator:** Go to the Journal Directory and click the **"AI Translation Assistant"** button.
2.  **Select Content:** Choose the Journal and Pages you want to translate.
3.  **Generate Prompt:** The module generates an optimized prompt. Click **"Copy Prompt"**.
4.  **AI Magic:** Paste the prompt into Gemini/ChatGPT and copy the **entire response**.
5.  **Update:** Click **"Paste"** in Foundry and then **Update Journal**.

---

# Deutsche Anleitung

**Übersetze deine Foundry VTT Journale kostenlos mit KI.**

Phil's Pf2e Ai Translator verbindet deine Foundry VTT Welt mit der Power moderner KI. Das Besondere: **Du brauchst keine teuren API-Keys!** Das Modul arbeitet als intelligenter "Prompt-Engineer" für die kostenlosen Web-Versionen von Gemini, ChatGPT & Co.

## 🚀 Funktionen

* **Kostenlos:** Nutze die Web-Interfaces der KI-Anbieter (keine API-Kosten).
* **Batch-Übersetzung:** Übersetze mehrere Seiten oder ganze Journale auf einmal.
* **Glossar-Support:** Erstellt automatisch ein Glossar für Namen und Begriffe, damit die Übersetzung über alle Seiten hinweg konsistent bleibt.
* **Smart Paste:** Du kannst die gesamte Antwort der KI kopieren. Das Modul filtert automatisch den JSON-Code heraus.
* **Offizielle Übersetzung:** Prüft das installierte deutsche Pathfinder 2e System-Modul auf existierende Übersetzungen, um Konsistenz mit offiziellen Begriffen zu garantieren.
* **Sicher:** HTML-Formatierungen und Links bleiben erhalten.
* **Safety First:** Erstellt automatisch ein **Backup** (Kopie) deines Journals, bevor Änderungen angewendet werden.

## 📦 Installation

1.  Öffne Foundry VTT.
2.  Gehe zum Reiter **Add-on Modules**.
3.  Klicke auf **Install Module**.
4.  Füge die folgende **Manifest URL** unten ein:
    ```
    https://github.com/PhilsModules/phils-pf2e-ai-translator/releases/latest/download/module.json
    ```
5.  Klicke auf **Install**.

## 📖 Bedienung

1.  **Translator öffnen:** Gehe in das Journal-Verzeichnis und klicke auf den **"KI Übersetzungs-Assistent"** Button.
2.  **Inhalt wählen:** Wähle das Journal und die Seiten aus, die du übersetzen möchtest.
3.  **Prompt generieren:** Das Modul erstellt einen optimierten Befehl. Klicke auf **"Prompt kopieren"**.
4.  **KI fragen:** Füge den Text bei Gemini/ChatGPT ein und kopiere die **gesamte Antwort**.
5.  **Update:** Klicke in Foundry auf **"Einfügen"** und dann auf **"Journal aktualisieren"**.

---

## 👨‍💻 Author
* **Phil** (GitHub: [PhilsModules](https://github.com/PhilsModules))

## 📄 License
This module is licensed under the [GPL-3.0 License](LICENSE).

---
<div align="center">
    <h2>❤️ Support the Development</h2>
    <p>If you enjoy this module and want to support open-source development for Foundry VTT, check out my Patreon!</p>
    <p>Gefällt dir das Modul? Unterstütze die Weiterentwicklung auf Patreon!</p>
    <a href="https://www.patreon.com/PhilsModules">
        <img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patron" />
    </a>
    <p>Made with ❤️ for the Foundry VTT Community</p>
</div>

