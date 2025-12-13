## v1.4.0 - Retroactive Statistics
*   **NEU: Übersetzungs-Statistik:** Ein neues Statistik-Feature (erreichbar über den "Statistik"-Button im Hauptmenü) zeigt dir genau an, wie viel Arbeit dir das Modul bereits abgenommen hat.
    *   **Retroaktiv:** Zählt Wörter aller jemals mit dem Modul übersetzten Seiten.
    *   **Detail-Ansicht:** Zeigt separate Wortzähler für "Übersetzung" und "Grammatik-Check".
    *   **Zeit-Ersparnis:** Berechnet die gesparte Zeit basierend auf realistischen Werten (300 Wörter/Stunde für Übersetzung, 1000 Wörter/Stunde für Lektorat).

## v1.3.1 - Usability & Documentation
*   **Documentation:** Eine umfangreiche, deutsche Anleitung (`anleitung.md`) ist nun direkt im Modul enthalten und über die `README.md` verlinkt.
*   **Prompt-Marker:** Prompts und Antworten werden nun mit klaren Markern (`[ANFANG_DER_ANFRAGE]`, `[ENDE_DER_ANFRAGE]`) versehen, um das Kopieren sicherer zu machen.
*   **Prompt-Längen-Warnung:** Du kannst nun eine Warnschwelle für die Prompt-Länge einstellen (Standard: 100k Zeichen), um Probleme mit dem Kontext-Fenster der KI zu vermeiden.
*   **Fehlerbehebung:** Verbesserte Fehlermeldungen bei unvollständigen KI-Antworten (fehlende `[ENDE_DER_ANTWORT]` Marker) und falschen JSON-Daten.
*   **Fix:** Lokalisierungsschlüssel für Einstellungen korrigiert.

## v1.3.0 - ApplicationV2, UI Polish & Prompt Refinements
*   **ApplicationV2 Migration:** Das gesamte Modul wurde auf die moderne Foundry V12+ ApplicationV2 Architektur migriert. Dies sorgt für eine flüssigere UI, besseres Layout-Management und Zukunftssicherheit.
*   **UI Polish:** Bessere Lesbarkeit im Konflikt-Dialog, neuer "Alle neuen übernehmen" Button, und Scrollbars (fixes UI overflow).
*   **Prompt Refinements:**
    *   **Glossar-Konsistenz:** Die KI wurde angewiesen, strikt das Format `Original = Übersetzung` im Glossar zu nutzen, ohne störende Sprach-Labels wie `(English)`.
    *   **Kontext-Intelligenz:** Die Prompts wurden verfeinert, um logische Fehler (wie "Schattenwandeln Zwilling" statt "Schattenzwilling") besser zu korrigieren und intelligent mit Compound-Wörtern umzugehen.

## v1.2.8 - Save-Logic & Conflict Fixes
*   **Fix: Konflikt-Dialog Async Saving:** Der "Konflikt-Dialog" wartet nun korrekt auf deine Entscheidung, bevor er weitermacht. Zuvor wurde die Eingabe ("Original wiederherstellen" vs. "Neu behalten") unter bestimmten Umständen ignoriert und der original Text ungeprüft gespeichert.
*   **Verbesserung: Konflikt-Modus:** Die strikte Konflikt-Erkennung (die nach veränderten/fehlenden `[[#ID...]]` Markern sucht) ist nun **nur noch im Grammatik-Modus** aktiv. Bei normalen Übersetzungen, wo sich Text und Satzbau natürlich ändern, führte dies zu unnötigen Fehlalarmen.

## v1.2.7 - Grammatik-Scope Logik Fix
*   **Fix:** Die "Grammatik-Prüfung" respektiert nun korrekt den ausgewählten Seitenbereich. Sie validiert nicht mehr das gesamte Journal gegen die Teil-Antwort der KI, was falsche Warnungen über "Fehlende Begriffe" auf nicht ausgewählten Seiten eliminiert.
*   **Fix:** `selectedPageIds` werden nun korrekt von der Prompt-Erstellung bis zur Validierung durchgereicht.

## v1.2.6 - Hotfix Layout
*   **Fix:** Behoben eines kritischen Layout-Fehlers ("Fenster in Fenster"), bei dem ein schließendes `</div>` Tag fehlte.
*   **Fix:** HTML-Sanitizer hinzugefügt, um Layout-Bruch durch Sonderzeichen zu verhindern.

## v1.2.5 - Stability & External Access Fixes
*   **Fix: Thread-Safe Glossary Check:** Die interne Logik für Glossar-Checks wurde komplett überarbeitet (lokaler State statt globaler Map). Dies behebt die fehlerhafte "Konflikt"-Erkennung, insbesondere bei langsameren Verbindungen oder externem Zugriff.
*   **Prompt-Hardening (Anti-Halluzination):** Die KI-Prompts (DE/EN) wurden gehärtet. Sie enthalten nun explizite Anweisungen, IDs niemals neu zu nummerieren. Dies verhindert, dass die KI "[[#1:...]]" erfindet, wo vorher "[[#12:...]]" war.
*   **UI-Layout Fix:** Der Konflikt-Dialog hat nun eine Scrollbar und bricht nicht mehr aus dem Bildschirm aus, wenn viele Fehler gefunden werden.

## v1.2.4 - Stabilität & "Smart Check" Update
*   **Intelligente Scope-Erkennung:** Das Modul prüft nun intelligent, *welche* Seiten/Items in der KI-Antwort tatsächlich aktualisiert wurden. Dies eliminiert falsche Warnungen über "Fehlende Begriffe", wenn du nur einen Teil eines Dokuments übersetzt (Partial Prompting).
*   **Robuste Kontext-Wiederherstellung (v4.5):** 
    *   Komplett neu geschriebene Logik zum Finden von "Lücken" (Deterministische Nachbar-Interpolation).
    *   Findet nun zuverlässig den Kontext fehlender Begriffe, selbst wenn die KI die Formatierung oder Leerzeichen der Marker ändert (z.B. `[[ # 123 : ... ]]`).
    *   Tolerante Konflikterkennung (Whitespace) dient als Sicherheitsnetz gegen versehentliches Übersehen von geänderten Begriffen.
*   **Lokalisierte Konflikt-UI:** Der Dialog für Glossar-Konflikte ist nun vollständig lokalisiert (deutsche Buttons/Labels).
*   **Fix:** Probleme behoben, bei denen "Geister-Begriffe" von anderen Seiten bei Teil-Updates Fehlalarme auslösten.

## v1.2.2 - Smarte KI-Workflow Optimierung
*   **Smart Auto-Next-Batch**: Das Modul merkt sich nun, ob du im "Übersetzungs-Modus" oder "Grammatik-Check-Modus" bist.
*   **Workflow-Optimierung**: Nach Abschluss eines Batches wird automatisch der nächste *relevante* Batch geöffnet (z.B. findet es beim Grammatik-Check die nächste Seite, die noch nicht geprüft wurde).
*   **Status-Tracking**: Verbessertes internes Tracking für `aiGrammarChecked` vs `aiProcessed`.
*   **Lokalisierung**: Nachrichten für das spezifische neue Auto-Next-Verhalten hinzugefügt.

## v1.2.1 - Visuelles Status Tracking
*   **Visuelles Tracking für Grammatik-Checks**: Neues Icon (`fa-spell-check`) in der Seitenliste hinzugefügt. Du kannst nun zwischen Seiten unterscheiden, die nur "Übersetzt" (Grüner Haken) sind, und solchen, die "Grammatik-Geprüft" (Blauer Haken) wurden.
*   **Status-Tracking**: Das Modul unterscheidet nun deutlich zwischen `aiProcessed` (Übersetzung) und `aiGrammarChecked` (Grammatik-Check) Status.
*   **Rechtliche Updates**: Prominente rechtliche Hinweise zur privaten Nutzung von urheberrechtlich geschützten Übersetzungen hinzugefügt.
*   **Metadaten-Fixes**: Lizenz- und Readme-Felder in `module.json` korrigiert.

## v1.2.0 - Grammar Check Mode & Conflict Protection
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

## v1.1.5 - UX Polishing & Bugfixes
*   **BUGFIX: Dialog-Reihenfolge:**
    *   Ein Fehler wurde behoben, bei dem das "Nächster Batch"-Fenster gleichzeitig mit dem "Glossar Update"-Fenster geöffnet wurde. Die Dialoge erscheinen nun korrekt nacheinander.
*   **BUGFIX: Syntax Error:**
    *   Ein kritischer Syntax-Fehler (`Declaration or statement expected`) wurde behoben, der das Modul unbenutzbar machte.

## v1.1.4 - AI Prompt Logic Overhaul
*   **NEU: Optimierte Prompt-Struktur:**
    *   Die KI-Prompts wurden komplett überarbeitet und in eine klare Struktur (`Role / Input / Security / Logic / Output`) gegliedert. Das sorgt für deutlich stabilere und konsistentere Ergebnisse bei allen KI-Modellen.
*   **NEU: Verbesserte Glossar-Logik:**
    *   Die KI gibt nun kein leeres JSON-Objekt mehr zurück, wenn keine neuen Begriffe gefunden wurden, sondern eine kurze Textnachricht. Das verhindert Verwirrung und unnötige "leere" Updates.
*   **NEU: Intelligente Begriffs-Korrektur:**
    *   Die Regel für vorübersetzte Begriffe (`%%Original%%`) wurde verfeinert: Die KI darf diese nun anpassen, wenn es **zwingend** für die Grammatik oder Logik des Satzes notwendig ist. Das verhindert "hölzerne" Übersetzungen.

## v1.1.3 - Security & Deep ID Verification
*   **NEU: Deep ID Check (Sicherheit):**
    *   Das Modul prüft nun **rekursiv jede einzelne ID** in der KI-Antwort gegen das Original-Dokument.
    *   Verhindert, dass die KI versehentlich interne IDs (z.B. von `pdftofoundry`) erfindet oder verändert, was zu Datenverlust führen könnte.
*   **NEU: Verbesserte Lokalisierung:**
    *   Alle Dialoge und Fehlermeldungen sind nun vollständig ins Deutsche übersetzt (inkl. Glossar-Update-Fenster).
    *   "Unsorted" wird nun korrekt als "Unsortiert" angezeigt.
*   **NEU: Konsistente Namens-Prompts:**
    *   Die KI wird nun explizit angewiesen, Namen immer zweisprachig (`Deutsch / Englisch`) zu formatieren, wenn ein Glossar verwendet wird.

## v1.1.2 - Advanced Automation Features
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

