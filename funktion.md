# 🧙‍♂️ Phil's PF2e AI Translator – Das "Grimoire der Faulheit"

Moin! Willkommen im Club der effizienten Spielleiter (oder der hoffnungslos überforderten, wir urteilen hier nicht). Du hast dich also für **Phil's PF2e AI Translator** entschieden. Exzellent.

Vielleicht sitzt du gerade da, nippst an deinem lauwarmen Kaffee und fragst dich: *"Was zur Hölle treibt dieses Ding eigentlich mit meinen Daten, und muss ich einen Rettungswurf auf Willen machen, damit mein Rechner nicht explodiert?"*

Lehn dich zurück. Hier ist der Deep Dive unter die Haube – erklärt für Leute, die wissen, wie man einen Charakterbogen ausfüllt, aber bei JSON-Dateien Weinkrämpfe bekommen.

---

## 🏗️ Das Prinzip: Du bist der Drogenkurier (für Daten)

Machen wir uns nichts vor: Dieses Modul ist eigentlich nur ein glorifizierter Vermittler. Ein digitaler Zuhälter für Texte, wenn du so willst. Da wir (noch) keine direkte Standleitung in das Gehirn von ChatGPT oder Claude haben (weil das Geld kostet und API-Keys nerven), bist du die **biologische Schnittstelle**.

Der Workflow ist ein okkultes Ritual in 6 Schritten:

1.  **Das Opfer wählen:** Öffne den "AI Translator". Zieh dein Journal per Drag & Drop rein, als würdest du einen nervigen Goblin in eine Fallgrube schubsen.
2.  **Die Waffe wählen:** 
    * *"Übersetzen":* Wenn du Text hast, der noch englischer ist als Fish & Chips.
    * *"Grammatik-Check":* Wenn der Text schon deutsch ist, aber aussieht, als hätte ihn ein besoffener Ork mit Fäustlingen getippt.
3.  **Die Beschwörungsformel:** Klick auf **"Übersetzung starten"**. Das Modul generiert jetzt einen Prompt, der so präzise formuliert ist, dass selbst ein Dschinn ihn nicht missverstehen könnte. Er landet in deiner Zwischenablage.
4.  **Der Gang nach Canossa:** Du gehst zu ChatGPT, Claude, DeepSeek oder deiner Oma (falls sie gut JSON spricht)... `Strg+V` (Einfügen). Enter.
5.  **Das Ernten:** Die KI kotzt (hoffentlich) perfekten, formatierten Text aus (JSON). Du kopierst diesen Kauderwelsch.
6.  **Die Erlösung:** Zurück zu Foundry. Einfügen. Klick auf **"Update"**.
    * *Ergebnis:* BÄM! Dein Journal glänzt wie eine polierte Plattenrüstung.

---

## 📚 Die "Akademische Bibliothek" (Woher das Ding alles weiß)

Damit die KI nicht halluziniert und aus einem *"Fireball"* plötzlich eine *"pikante Gewürzkugel"* macht, betreibt das Modul massives *Mansplaining* gegenüber der KI. Es füttert sie mit Kontext.

### 1. Die Heilige Schrift (Das offizielle `lang-de-pf2e`)
Das Modul ist ein Stalker. Es durchwühlt obsessiv die Dateien des **"Pathfinder 2 Deutsch"**-Systems.
* Es liest die Systemdateien (`en.json` vs. `de.json`) und lernt Vokabeln. Es weiß, dass *Agile* = *Agil* ist.
* Es bricht in die Kompendien ein (Bestiarien, Zauber, Feats). Es scannt tausende Einträge, nur um sicherzugehen, dass es den korrekten deutschen Namen für *"Mage Hand"* kennt.
* **Der Effekt:** Es baut sich ein gigantisches Wörterbuch im RAM auf und schreit die KI an: *"WAG ES NICHT, 'MAGE HAND' ZU ÜBERSETZEN! DAS HEISST 'TELEKINETISCHE HAND', DU STÜCK SILIZIUM!"*

### 2. Deine Hausregeln (Das "AI Glossary")
Vielleicht bist du einer dieser GMs, die alles besser wissen. Gut so!
Wenn du ein Journal namens **"AI Glossary"** (oder "AI Glossar") anlegst, wird das zum Gesetz.
* Du willst, dass *"Goblin"* als *"Knöchelkauer"* übersetzt wird? Schreib es rein.
* Das Modul schaut zuerst hier nach. Dein Wort ist Gottes Wort. Die offizielle Übersetzung kann einpacken.

### 3. Der Autopilot (Weil wir faul sind)
Hand aufs Herz: Niemand pflegt gerne Glossare. Das wäre Buchhaltung, kein Rollenspiel.
Deshalb zwingt das Modul die KI, diese Drecksarbeit zu übernehmen.
*   Bei jeder Übersetzung scannt die KI automatisch nach neuen Eigennamen.
*   Sie präsentiert dir diese Neuzugänge auf dem Silbertablett.
*   Ein Klick, und sie landen in deinem **"AI Glossary"**.
Das Ding wächst also organisch mit. Du musst nicht mal darüber nachdenken. Maximale Faulheit bei maximaler Ordnung.

---

## 🛡️ Der Grammatik-Check: Das "Keuschheitsgürtel-Protokoll"

Das hier ist mein persönliches Highlight. Das Feature für Kontrollfreaks.
Wenn wir nur Grammatik korrigieren wollen, haben wir ein Problem: KIs sind "kreativ". Kreativität ist Scheiße, wenn es um Regelbegriffe geht. Wir wollen nicht, dass die KI den Text "schöner" macht und dabei Regelbegriffe verfälscht.

### Die Operation "Indexierter Schutzschild"
Wir tricksen die KI aus, indem wir sie behandeln wie ein kleines Kind, das nichts anfassen darf.

1.  **Die Geiselnahme:** Das Modul scannt deinen Text nach bekannten Begriffen (z.B. "Feuerball", "Machtattacke").
2.  **Die Verschlüsselung:** Es ersetzt das Wort durch einen hässlichen Platzhalter mit ID: `[[#1:Feuerball]]`.
3.  **Der Befehl:** Der Prompt an die KI lautet sinngemäß: *"Korrigiere die Grammatik drumherum, aber wenn du den Text in den eckigen Klammern anfasst, lösche ich deine Festplatte."*

### Der Lügendetektor (Wenn die KI dich verarschen will)
Die KI antwortet. Jetzt kommt der Sicherheits-Check.
Das Modul schaut sich an, was zurückkam: `[[#1: ??? ]]`.

* **Szenario A:** `[[#1:Feuerball]]`
    * *Modul:* "Brav." Entfernt die Klammern. Text bleibt "Feuerball". Alles gut.
* **Szenario B:** `[[#1:Flammenkugel]]`
    * *Modul:* **ALARMSTUFE ROT! 🚨**
    * Die KI dachte sich: *"Oh, Flammenkugel klingt viel poetischer!"*
    * Das Modul blockiert sofort und knallt dir ein Warnfenster ins Gesicht:

> **⚠️ Halluzination erkannt!**
> Die KI hat versucht, **ID #1** zu ändern.
> Original: `Feuerball`
> KI-Vorschlag: `Flammenkugel`
>
> [ ] Willst du diesen Blödsinn akzeptieren? (Checkbox)

* **Checkbox leer:** Das Modul sagt *"Fick dich, KI"* und schreibt wieder gnadenlos "Feuerball".
* **Checkbox an:** Du gibst nach und akzeptierst den neuen Begriff (vielleicht war es ja doch besser).

Du hast also die **absolute Macht**. Keine "Remaster-Verschlimmbesserungen" durch halluzinierende Algorithmen.

---

## 🔒 Die Sicherheitsnetze (Der "Oh Scheiße"-Button)

Weil wir wissen, dass Software von Menschen gemacht wird (und Menschen Fehler machen), gibt es Fallschirme:

1.  **Der ID-Check:** Bevor gespeichert wird, prüft das Modul: *"Sind alle Seiten noch da?"* Wenn die KI eine Seite gefressen hat, wird der Vorgang abgebrochen.
2.  **Das Zwangs-Backup:** Bevor auch nur ein Buchstabe überschrieben wird, dupliziert das Modul dein Journal als `Dein Journal (Backup)`.
    * Wenn alles schiefgeht und dein Text plötzlich aussieht wie alter sumerischer Keilschrift-Code -> Lösch das Original, nimm das Backup, und tu so, als wäre nichts passiert.

---

## ⚡ TL;DR für den Barbaren in dir

1.  **Reinziehen:** Journal in das Fenster werfen.
2.  **Copy:** Text für die KI klauen.
3.  **Paste:** KI machen lassen, Ergebnis zurückwerfen.
4.  **Bier trinken:** Das Modul prüft, ob die KI Mist gebaut hat, macht ein Backup und speichert dann erst.

Jetzt geh und erschaffe Welten (oder übersetze sie dir privat, wir haben ja alle den Disclaimer gelesen). 🤖✨

