<div align="center">

# Phil's PF2e AI Translator

![Foundry v12 Compatible](https://img.shields.io/badge/Foundry-v12-green)
![Foundry v13 Compatible](https://img.shields.io/badge/Foundry-v13-brightgreen)
![System](https://img.shields.io/badge/System-PF2e-blue)
![License](https://img.shields.io/badge/License-GPLv3-blue)
[![Version](https://img.shields.io/badge/version-v1.4.0-blue)](https://github.com/PhilsModules/phils-pf2e-ai-translator/releases)
[![Patreon](https://img.shields.io/badge/SUPPORT-Patreon-ff424d?logo=patreon)](https://www.patreon.com/PhilsModules)

<br>

**Der smarte Übersetzungs-Helfer für Foundry VTT – keine API-Kosten, volle Kontrolle.**
<br>
*The smart translation helper for Foundry VTT – no API costs, full control.*

<br>

<a href="#-deutsche-anleitung"><img src="https://img.shields.io/badge/%20-Deutsche_Anleitung-black?style=for-the-badge&logo=germany&logoColor=red" alt="Deutsche Anleitung"></a> <a href="#-english-instructions"><img src="https://img.shields.io/badge/%20-English_Instructions-black?style=for-the-badge&logo=united-kingdom&logoColor=white" alt="English Instructions"></a>

</div>

> [!CAUTION]
> ### ⚖️ Private Use Only / Nur für den privaten Gebrauch
> **English:** Translations of copyrighted works (e.g. Pathfinder adventures) created with this module may **only be used for private purposes**. Publication, distribution, or commercial use (sale) is prohibited.
>
> **Deutsch:** Die mit diesem Modul erstellten Übersetzungen urheberrechtlich geschützter Werke dürfen **nur für den privaten Gebrauch** verwendet werden. Eine Veröffentlichung, Verbreitung oder kommerzielle Nutzung (Verkauf) ist nicht gestattet.

> [!TIP]
> ### ✅ Official Approval / Offizielle Freigabe
> **English:** The concept and workflow of this module have been **vetted and approved by Jan Wagner (Primetide), Head of Digital at Ulisses Spiele**.
> It has been confirmed that this technical approach (mapping existing glossary terms for private use) complies with community guidelines and respects the intellectual property of **Ulisses Spiele** and **Paizo**.
>
> **Deutsch:** Das Konzept und der Workflow dieses Moduls wurden von **Jan Wagner (Primetide), Head of Digital bei Ulisses Spiele**, geprüft und freigegeben.
> Es wurde bestätigt, dass dieser technische Ansatz (Mapping bestehender Glossar-Begriffe für den privaten Gebrauch) den Community-Richtlinien entspricht und das geistige Eigentum von **Ulisses Spiele** und **Paizo** respektiert.


# <img src="https://flagcdn.com/48x36/de.png" width="28" height="21" alt="DE"> Deutsche Anleitung

**Übersetze deine Foundry VTT Journale kostenlos mit KI.**

Phil's Pf2e Ai Translator verbindet deine Foundry VTT Welt mit der Power moderner KI. Das Besondere: **Du brauchst keine teuren API-Keys!** Das Modul arbeitet als intelligenter "Prompt-Engineer" für die kostenlosen Web-Versionen von Gemini, ChatGPT & Co.

> 🧙‍♂️ **Deep Dive:** Willst du wissen, wie der "Grammatik-Schutzschild" und die "KI-Geiselnahme" genau funktionieren? Lies das [Grimoire der Faulheit (funktion.md)](funktion.md).
>
> 🧐 **Für das gehobene Auditorium:** Bevorzugst du eine eloquente Ausdrucksweise? [Exegese der Systemarchitektur](funktionen.md).
>
> 📖 **Hier geht es zur** [ausführlichen Anleitung](anleitung.md).

## 🚀 Funktionen

* 💸 **Kostenlos:** Nutze die Web-Interfaces der KI-Anbieter (keine API-Kosten).
* 📚 **Batch-Übersetzung:** Übersetze mehrere Seiten oder ganze Journale auf einmal.
* 🧠 **Glossar-Support:** Erstellt automatisch ein Glossar für Namen und Begriffe, damit die Übersetzung über alle Seiten hinweg konsistent bleibt.
* 🧹 **Smart Paste:** Du kannst die gesamte Antwort der KI kopieren. Das Modul filtert automatisch den JSON-Code heraus.
* 🛡️ **Offizielle Begriffe:** Prüft das installierte deutsche Pathfinder 2e System-Modul auf existierende Übersetzungen, um Konsistenz mit offiziellen Begriffen zu garantieren (z.B. *Fortitude* -> *Zähigkeit*).
* 🎨 **Kontext-Sicher:** HTML-Formatierungen und Links bleiben erhalten.
* 💾 **Safety First:** Erstellt automatisch ein **Backup** (Kopie) deines Journals, bevor Änderungen angewendet werden.

## 📦 Installation

1.  Öffne Foundry VTT.
2.  Gehe zum Reiter **Add-on Modules**.
3.  Klicke auf **Install Module**.
4.  Füge die folgende **Manifest URL** unten ein:
    ```text
    https://github.com/PhilsModules/phils-pf2e-ai-translator/releases/latest/download/module.json
    ```
5.  Klicke auf **Install**.

## 📖 Bedienung

### Workflow A: Übersetzung (Grüner Haken ✅)
1.  **Seiten wählen**: Wähle die Seiten, die du übersetzen möchtest.
2.  **Prompt generieren**: Klicke auf **"Übersetzung starten"**.
3.  **KI-Verarbeitung**: Prompt bei ChatGPT/Claude einfügen -> Antwort kopieren (JSON).
4.  **Update**: In Foundry einfügen -> **"Journal aktualisieren"**.
5.  **Loop**: Das Modul prüft automatisch auf verbleibende Seiten. Falls vorhanden, öffnet sich das nächste Fenster **automatisch vorausgewählt** für die Übersetzung.

### Workflow B: Grammatik-Check (Blauer Haken 🧙‍♂️)
1.  **Seiten wählen**: Wähle Seiten (auch bereits übersetzte) für die Grammatikprüfung.
2.  **Prompt generieren**: Klicke auf **"Grammatik Check"**.
3.  **KI-Verarbeitung**: Prompt bei ChatGPT/Claude einfügen -> Antwort kopieren (JSON).
4.  **Update**: In Foundry einfügen -> **"Journal aktualisieren"**.
5.  **Konfliktlösung**: Wenn die KI geschützte Begriffe ändern will (z.B. "Feuerball" -> "Flammenkugel"), erscheint ein Warndialog. Du entscheidest: Original behalten oder Änderung akzeptieren?


# <img src="https://flagcdn.com/48x36/gb.png" width="28" height="21" alt="EN"> English Instructions

**Automated Translation of Foundry VTT Journals with AI**

This module helps you to translate **large adventure modules** or long texts in Foundry VTT quickly and consistently. It is optimized for **PF2e** but works system-independently.

## 🚀 Key Features

* **No API Costs:** Works with the free web versions of Gemini, ChatGPT, & Co.
* **Batch Translation:** Translate multiple pages at once.
* **Glossary Support:** Automatically generates a glossary of names and terms to ensure consistent translation across pages.
* **Smart Paste:** Automatically finds and extracts the JSON code block from the AI response.
* **Official Translation Integration:** Checks the installed German Pathfinder 2e system module for existing translations to ensure consistency with official terms.
* **Safety First:** Automatically creates a **Backup** (Copy) of your Journal before applying changes.

## 📖 How to Use

### Workflow A: Translation (Green Check ✅)
1.  **Select Pages**: Choose the pages you want to translate.
2.  **Generate Prompt**: Click **"Copy Prompt"**.
3.  **AI Processing**: Paste into ChatGPT/Claude -> Copy Response (JSON).
4.  **Update**: Paste into Foundry -> **"Update Journal"**.
5.  **Loop**: The module automatically checks for remaining pages. If found, it opens the next window **pre-selected** for translation.

### Workflow B: Grammar Check (Blue Spell Check 🧙‍♂️)
1.  **Select Pages**: Choose pages (even if already translated) to check grammar.
2.  **Generate Prompt**: Click **"Grammar Check"**.
3.  **AI Processing**: Paste into ChatGPT/Claude -> Copy Response (JSON).
4.  **Update**: Paste into Foundry -> **"Update Journal"**.
5.  **Conflict Resolution**: If the AI tries to change protected terms, a warning dialog appears. You decide: Keep Original or Accept Change?


# ⚖️ Credits & Licenses

## Special Thanks
Ein riesiges Dankeschön und viele Grüße an **Primetide** und **Abaddon3851** für die Prüfung und Freigabe des Moduls!

## Pathfinder German Translation Data
Portions of this module utilize data from the [Pathfinder German Translation module](https://github.com/Foundry-VTT-PF2-German/lang-de-pf2e) by Marco Seither. Licensed under the MIT License.

> **MIT License**
>
> **Copyright (c) 2023 Marco Seither**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Module License
**Phil's PF2e AI Translator** is licensed under the [GPL-3.0 License](LICENSE).


<div align="center">
    <h2>❤️ Support the Development</h2>
    <p>If you enjoy this module and want to support open-source development for Foundry VTT, check out my Patreon!</p>
    <p>Gefällt dir das Modul? Unterstütze die Weiterentwicklung auf Patreon!</p>
    <a href="https://www.patreon.com/PhilsModules">
        <img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patron" width="200" />
    </a>
    <br><br>
    <p><i>Made with ❤️ for the Foundry VTT Community</i></p>
</div>


