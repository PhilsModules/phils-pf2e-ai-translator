# Phil's PF2e AI Translator

![Foundry v13 Compatible](https://img.shields.io/badge/Foundry-v13-brightgreen)
![Foundry v12 Compatible](https://img.shields.io/badge/Foundry-v12-green)
![License](https://img.shields.io/badge/License-GPLv3-blue)
![Version](https://img.shields.io/badge/Version-1.2.1-orange)


<a href="Updates.md"><img src="https://img.shields.io/badge/CHECK-Changelog-blue" style="height: 25px;"></a>
<a href="https://www.patreon.com/PhilsModules"><img src="https://img.shields.io/badge/SUPPORT-Patreon-ff424d?logo=patreon" style="height: 25px;"></a>

> [!CAUTION]
> ### ⚖️ Private Use Only / Nur für den privaten Gebrauch
> Translations of copyrighted works (e.g. Pathfinder adventures) created with this module may **only be used for private purposes**. Publication, distribution, or commercial use (sale) is prohibited.
>
> Die mit diesem Modul erstellten Übersetzungen urheberrechtlich geschützter Werke dürfen **nur für den privaten Gebrauch** verwendet werden. Eine Veröffentlichung, Verbreitung oder kommerzielle Nutzung (Verkauf) ist nicht gestattet.

**Automatisierte Übersetzung von Foundry VTT Journalen mit KI (ChatGPT, Claude, Gemini, etc.)**

Dieses Modul hilft dir, **große Abenteuer-Module** oder lange Texte in Foundry VTT schnell und konsistent zu übersetzen. Es ist speziell für **PF2e** optimiert, funktioniert aber auch systemunabhängig.

---
> [!NOTE]
>## Credits & Licenses
>
>### Pathfinder German Translation Data
>Portions of this module utilize data from the [Pathfinder German Translation module](https://github.com/Foundry-VTT-PF2-German/lang-de-pf2e) by Marco Seither.
>Licensed under the MIT License.

> Copyright (c) 2023 Marco Seither
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



# Deutsche Anleitung

**Übersetze deine Foundry VTT Journale kostenlos mit KI.**

Phil's Pf2e Ai Translator verbindet deine Foundry VTT Welt mit der Power moderner KI. Das Besondere: **Du brauchst keine teuren API-Keys!** Das Modul arbeitet als intelligenter "Prompt-Engineer" für die kostenlosen Web-Versionen von Gemini, ChatGPT & Co.

> 🧙‍♂️ **Deep Dive:** Willst du wissen, wie der "Grammatik-Schutzschild" und die "KI-Geiselnahme" genau funktionieren? Lies das [Grimoire der Faulheit (funktion.md)](funktion.md).

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

4.  **KI fragen:** Füge den Text bei Gemini/ChatGPT ein und kopiere die **gesamte Antwort**.
5.  **Update:** Klicke in Foundry auf **"Einfügen"** und dann auf **"Journal aktualisieren"**.

---

---

# English Instructions

**Automated Translation of Foundry VTT Journals with AI**

This module helps you to translate **large adventure modules** or long texts in Foundry VTT quickly and consistently. It is optimized for **PF2e** but works system-independently.

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

4.  **AI Magic:** Paste the prompt into Gemini/ChatGPT and copy the **entire response**.
5.  **Update:** Click **"Paste"** in Foundry and then **Update Journal**.

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

