# DynPass-Onboarding — Design

**Datum:** 2026-09-03
**Projekt:** Back2IQ StealthAuth (`@back2iq/stealth-auth`)
**Status:** Entwurf, abgestimmt, noch nicht implementiert

---

## 1 · Kern-These

Der Nutzer wählt kein Verfahren aus — **er baut sein eigenes**. Quelle des Hinweises,
Darreichung, welche Zeichen er entnimmt und wo er sie in seinem Passwort einsetzt:
alles frei.

Das ist gleichzeitig ein Bedienungs- und ein Sicherheitsgewinn, und beides zeigt in
dieselbe Richtung. Der einzige verbleibende Angriff auf eine gestohlene Datenbank ist
gemeinsames Raten von Master-Geheimnis **und** Verfahren. Die bisherigen fünf festen
Profile trugen etwa 6 Bit zu diesem Faktor bei; die freie Palette trägt 11–12 Bit bei.
Das ist der 16- bis 64-fache Aufwand für den Angreifer, und der Nutzer bezahlt dafür
nichts — er bekommt das Verfahren, das zu seinem Kopf passt.

Kein Wettbewerber hat das: TOTP ist für alle gleich, FIDO2 ist für alle gleich.

---

## 2 · Ausgangslage

Der Code hat diesen Stand (Refactoring vom 2026-09-02, 59 Tests grün):

- Der Server zieht pro Login eine **Zufalls-Challenge** aus 26 Werten. Kein Zähler,
  keine Desynchronisation, keine erschöpfbare Tabelle.
- Er speichert **je einen Ed25519-Public-Key pro Challenge-Wert**, abgeleitet aus
  `scrypt(T(S, Challenge), Salt)`. Kein Master-Geheimnis, keine kognitive Regel.
- Der Client signiert `nonce:sessionId`; eine gestohlene Datenbank kann sich nicht
  einloggen (empirisch: 0 von 100 Fälschungsversuchen).

**Der offene Widerspruch:** Die Hint-Quelle ist heute doppelt kodiert. `pictorial-object`
und `pseudo-captcha` existieren sowohl als `DisguiseMode` (Server, was angezeigt wird)
als auch als `MathOperatorType` (Client, wie transformiert wird). Beide werden getrennt
gesetzt und können auseinanderlaufen. Dieses Design löst das auf.

---

## 3 · Die Ableitungskette

Eine einzige Kette, an der alle Varianten hängen — nichts liegt daneben:

```
1. Server zieht Challenge-Index  ──►  rendert den Hinweis (Quelle + Darreichung)
2. Nutzer bildet den EXTRAKT     ──►  1–2 Zeichen aus dem Hinweis
                                      oder die Werte gewählter Gitterfelder
3. Nutzer platziert den Extrakt  ──►  an seinen Positionen im Master-Geheimnis
4. Client leitet den Schlüssel ab ──►  scrypt → Ed25519 → Signatur über nonce:sessionId
```

Schritt 2 und 3 sind der frei gestaltbare Teil. Schritt 1 und 4 sind fix.

---

## 4 · Datenmodell

Das Profil wird gespalten, weil der Server nur die Hälfte wissen darf.

```ts
/** Was der Server weiss — er muss den Hinweis rendern koennen. */
interface PublicProfile {
  profileId: string;
  label: string;                    // "Alltag", "Notfall"
  hintSource: HintSource;
  delivery: HintDelivery;
  answerMode: 'type' | 'pick';
  locale?: SupportedLocale;
  challengeSpaceSize: number;       // 26, oder 6..10 bei persoenlichen Fragen
  questionIds?: string[];           // nur bei personal-question, Reihenfolge = Index
  countersign: string;              // vom Nutzer gewaehlt, siehe 4.4
}

/** Existiert nur im Kopf des Nutzers und im Client. Wird nie gesendet. */
interface SecretProfile {
  profileId: string;
  placement:
    | { kind: 'slots'; slots: DynPassSlot[] }
    | { kind: 'recipe'; recipe: CognitiveRecipe };   // Power-User-Ausstieg
  answers?: Record<string, string>;  // nur waehrend des Onboardings im Speicher
}

interface DynPassSlot {
  take: 'first' | 'last' | 'nth';
  n?: number;                        // 1-basiert, nur bei take === 'nth'
  at: number;                        // Position im ORIGINAL-Master-Geheimnis
  case?: 'upper' | 'lower' | 'as-is';
}
```

`placement` ist ein **diskriminiertes Entweder-oder**. Zwei optionale Felder
nebeneinander wären genau die Doppelkodierung, die dieses Design beseitigt.

### 4.1 · Die Palette

| Quelle | Challenge-Raum | Was der Nutzer sieht | Extrakt |
|---|---|---|---|
| `codename-word` | 26 | `Codename: Falcon` | Zeichen aus dem Wort |
| `pictorial-object` | 26 | ein Icon, ohne Wort | Zeichen aus dem selbst benannten Objekt |
| `pseudo-captcha` | 26 | `[ X 7 9 k m P ]` | Zeichen aus dem Badge |
| `numeric-badge` | 26 | `v1.7`, `Ticket #7` | Ziffern |
| `grid-matrix` | 26 | 3×3-ASCII-Gitter | Zeichen entlang eines Pfads |
| `personal-question` | 6–10 | `Wie hiess dein erster Lehrer? (5 Buchstaben)` | Zeichen aus der eigenen Antwort |

Darreichung: `text` · `icon` · `audio` · `ascii-grid`.

Zulässige Kombinationen werden als Tabelle validiert. Eine Sperre ergibt sich aus dem
Konzept selbst: **`delivery: 'audio'` ist bei `pictorial-object` verboten** — wer das
Objekt vorliest, zerstört genau den Sprachfaktor, der diese Quelle ausmacht.

### 4.2 · Freie Platzierung

Alle Positionen zählen im **Original**-Master-Geheimnis, und alle Einfügungen werden
gleichzeitig angewandt. Der Nutzer denkt in seinem vertrauten Passwort; die Reihenfolge
der Regeln ist ihm egal.

```
Master:  M a m a 1 9 7 7
Pos:     0 1 2 3 4 5 6 7 8

slots: [ { take:'first', at:0 }, { take:'last', at:4 } ]
Hinweis "Falcon"  ->  F an 0, n an 4
Ergebnis:  F M a m a n 1 9 7 7
```

**Vorschläge statt Vorschriften.** Das Onboarding berechnet aus dem tatsächlichen
Passwort die Stellen, an denen die Zeichenklasse wechselt (Buchstabe/Ziffer/Symbol/
Gross-Klein), plus Anfang und Ende, und bietet sie als Ein-Klick-Vorschläge an. Bei
`Mama1977` sind das 0, 4 und 8. Jede andere Position bleibt frei wählbar.

Genau eine Warnung: eine Position **innerhalb einer Folge von drei oder mehr identischen
Zeichen**. Dort gibt es keinen Orientierungspunkt, den man lernen könnte, und Übung
hilft nicht, weil nichts zu sehen ist. Bei den meisten Passwörtern kommt das nie vor.

Grenzen: 1–2 Slots, keine zwei Slots auf derselben Position, jede Position ≤ Passwortlänge.

### 4.3 · Persönliche Fragen

Der stärkste Bedienungsvorteil im ganzen Entwurf: **Die Antwort steht bereits im
Langzeitgedächtnis.** Nichts zu lernen, und sie überlebt sechs Monate Nichtnutzung —
genau die Stelle, an der jedes andere kognitive Verfahren stirbt. Das ist der Kanal,
der die Break-Glass-Positionierung einlöst.

- Öffentlicher Katalog von ~40 Fragen mit stabilen IDs (erster Lehrer, Strasse der
  Kindheit, erstes Auto, erstes Haustier, bester Schulfreund, …).
- Der Nutzer wählt 6–10 und beantwortet sie im Onboarding. Die Reihenfolge der
  gewählten IDs ist der Challenge-Index 1..n.
- **Die Antworten verlassen den Client nie.** Sie erzeugen lokal die Public Keys und
  werden danach verworfen.
- Die Challenge zeigt die **Antwortlänge** mit an: `Wie hiess dein erster Lehrer?
  (5 Buchstaben)`. Das entscheidet *Meier* gegen *Herr Meier* und rettet den Login,
  ohne die Antwort zu verraten.
- Das Onboarding prüft auf Kollisionen: zwei Antworten mit gleichem Anfangs- und
  Endzeichen erzeugen identische Schlüssel und müssen ersetzt werden.

### 4.4 · Gegenlosung

Der Nutzer wählt beim Onboarding ein Erkennungswort (`countersign`, z. B. „Blaue Tür").
Der Server zeigt es bei **jeder** Challenge mit an. Eine nachgebaute Loginseite kennt es
nicht und fliegt auf den ersten Blick auf — ein sichtbares Feature, kein unsichtbarer
Schutz. Das Erkennungswort ist keine Anmeldeinformation; es liegt im Klartext beim
Server und darf das auch.

### 4.5 · Auswählen statt Tippen

`answerMode` ist unabhängig von der Quelle und nur für `grid-matrix` zugelassen — nur
dort gibt es Felder zum Anklicken. Bei `pick` zeigt der Server das Gitter, der Nutzer
klickt die Felder, die seine Regel erfüllt (etwa „alle Felder der Hauptdiagonale" oder
„alle Wörter mit gerader Buchstabenzahl"). Die Werte der gewählten Felder bilden den
Extrakt und laufen danach durch dieselbe Platzierung wie getippte Zeichen — Schritt 3
der Ableitungskette bleibt unverändert. Auf Touchgeräten angenehmer als Tippen, und ein
Keylogger fängt nur Koordinaten ohne Bedeutung.

Alle anderen Quellen verwenden `answerMode: 'type'`; jede andere Kombination wird von
der Validierungstabelle abgelehnt.

### 4.6 · Mehrere Profile pro Konto

`UserAuthRecord.profiles: StoredProfile[]`, jedes mit eigenem `PublicProfile` und eigener
Schlüsseltabelle. Ein schnelles Profil für den Alltag, ein tieferes für Notfall oder
Reise — ein Master-Geheimnis, zwei Verfahren. `createChallenge(userId, profileId?)`
nimmt das Standardprofil, wenn keines genannt wird.

---

## 5 · Auflösung der Doppelkodierung

- `DisguiseMode` wird aus `hintSource` + `delivery` **abgeleitet** und nicht mehr vom
  Aufrufer übergeben. Der `disguiseConfig`-Parameter von `createChallenge` entfällt.
- Der Server liest den `PublicProfile` aus dem Datensatz. Anzeige und Transformation
  können strukturell nicht mehr auseinanderlaufen.
- Die bestehende Operator-Palette (`digit-sum`, `square-root-floor`, `power-modulo`,
  `grid-matrix-traverse`, Pipelines) bleibt **vollständig erhalten** und ist über
  `placement.kind === 'recipe'` erreichbar. Das neue Modell liegt darüber, nicht daneben.
- Neuer Engine-Operator `place-hint-chars`, der die Slots ausführt. Die Onboarding-Wahl
  kompiliert zu einer `CognitiveRule`; es gibt weiterhin nur eine Ausführungs-Engine.

---

## 6 · Der Trainer

Kein Einmal-Gate, sondern ein Begleiter.

**Beim Einrichten:** drei Proberunden mit **Zeitmessung**. `verifyTrainingAttempt` gibt
statt `boolean` künftig `{ correct: boolean; elapsedMs: number }` zurück; der Assistent
aggregiert zu `{ correctCount, avgMs }` und zeigt es dem Nutzer: „3 von 3 richtig, im
Schnitt 1,8 s." Liegt der Schnitt über 3 s oder gab es Fehler, bietet der Assistent
eine zweite Variante zum **Vergleichen** an — dieselbe Quelle, Zeichen an den Rändern.
Der Nutzer entscheidet nach Erfahrung, nicht nach Vorschrift.

**Danach:** eine Fünf-Sekunden-Mikroübung, die die Regel wach hält. Für den Betreiber
fällt dabei eine gemessene Zuverlässigkeitsquote pro Mitarbeiter ab — er weiss **vor**
dem Notfall, wer im Notfall durchkommt. Das kann kein Backup-Code-Zettel.

---

## 7 · Partner-Policy

Der Partner gibt den Rahmen, der Nutzer füllt ihn aus:

| Stufe | Bedeutung |
|---|---|
| `frei` | Der Nutzer wählt alles aus der Palette. |
| `kuratiert` | Der Partner gibt eine Whitelist von Quellen und Darreichungen vor. |
| `klassen-fix` | Der Partner pinnt Quelle und Darreichung; der Nutzer parametriert Entnahme und Platzierung. |

`klassen-fix` ist die Empfehlung für Umgebungen mit einheitlichem Support: Schulung,
Helpdesk-Skripte und Audit bleiben einheitlich, aber weil die Slots pro Nutzer
verschieden sind, gewinnt ein Angreifer aus einem geknackten Konto nichts über das
nächste. Ein hartes `total-fix` bleibt möglich, setzt aber die Verfahrens-Entropie des
gesamten Mandanten auf null und muss im Setup mit einem Hinweis versehen werden.

---

## 8 · Sicherheitsnotizen

Kurz, weil es Implementierungsdetails sind:

- Gespeicherte `questionIds` verraten bei einem Datenbankeinbruch, **welche** Erinnerungen
  ein Mensch verwendet — eine Rechercheliste. Nicht wegdesignbar, solange die Frage auf
  einem fremden Terminal erscheinen soll. Gehört so in die Kundendokumentation.
- Challenge-Raum 6–10 bedeutet: ein Beobachter sieht bei täglicher Nutzung binnen zwei
  Wochen alle Fragen. Für seltene Nutzung (Notfall, Reise) unkritisch, für den
  Alltagslogin nicht empfohlen. Das Onboarding kennzeichnet den Kanal entsprechend.
- `delivery: 'audio'` in offenen Räumen wird vorgelesen und mitgehört. Hinweis im
  Assistenten, keine Sperre.
- Passwortstärke: keine Sperre. Das Onboarding zeigt an, wie lange ein Angreifer mit
  gestohlener Tabelle bräuchte, und schlägt zwei zusätzliche Zeichen vor.

---

## 9 · Änderungen am Bestand

| Datei | Änderung |
|---|---|
| `src/types.ts` | `PublicProfile`, `SecretProfile`, `DynPassSlot`, `HintSource`, `HintDelivery`; `UserAuthRecord.profiles` ersetzt `publicKeyTable` |
| `src/core/placement.ts` | **neu** — Slots ausführen, Klassengrenzen berechnen, Warnungen |
| `src/core/questions.ts` | **neu** — Fragenkatalog mit IDs |
| `src/core/cognitive.ts` | Operator `place-hint-chars` |
| `src/core/key-table.ts` | Tabellengrösse aus `challengeSpaceSize` statt Konstante |
| `src/server/stealth-auth-server.ts` | `createChallenge(userId, profileId?)`, `disguiseConfig` entfällt, Gegenlosung im Payload |
| `src/client/onboarding.ts` | Palette, Positionsvorschläge, gemessene Proberunden, Kollisionsprüfung |
| `src/client/stealth-auth-client.ts` | `answerChallenge` nimmt `SecretProfile` statt `CognitiveRule` |
| `docs/*.md` | Auf den Code ziehen: Zufallsziehung statt Zähler, Public Keys statt Verifier-Tabelle, kein Lookahead |

**Breaking Changes:** `registerUser`, `createChallenge`, `verifyTrainingAttempt`.
Version auf 2.0.0.

---

## 10 · Teststrategie

TDD, jeder Punkt zuerst rot:

- **Platzierung:** Positionen zählen im Original; gleichzeitige Einfügung; zwei Slots
  auf derselben Position werden abgelehnt; Position > Passwortlänge wird abgelehnt.
- **Klassengrenzen:** `Mama1977` → {0, 4, 8}; `!!!!!1g0750n17!!!!!` → {0, 5, 14, 19}.
- **Warnung:** Position 3 in `!!!!!…` warnt; Position 4 in `Mama1977` warnt nicht.
- **Palette:** jede zulässige Kombination aus Quelle × Darreichung authentifiziert
  Ende-zu-Ende; `pictorial-object` + `audio` wird abgelehnt.
- **Persönliche Fragen:** 6–10 erzeugen eine Tabelle dieser Grösse; Antworten tauchen
  in keinem gespeicherten Datensatz auf; Kollision zweier Antworten wird erkannt.
- **Mehrere Profile:** zwei Profile am selben Konto, jedes für sich anmeldefähig.
- **Gegenlosung:** liegt auf jeder Challenge an.
- **Trainer:** liefert `elapsedMs`; bietet bei > 3 s eine Alternative an.
- **Konsistenz:** `createChallenge` nimmt keinen `disguiseConfig` mehr entgegen; die
  Anzeige folgt immer dem gespeicherten Profil.
- **Regression:** die 59 bestehenden Tests bleiben grün oder werden bewusst angepasst.

---

## 11 · Ausdrücklich nicht Teil dieses Designs

- **AitM-Reverse-Proxy.** Ein Echtzeit-Relay reicht Challenge und Signatur durch.
  Origin-Binding braucht ein Gerät — genau das, was hier fehlen soll. Die Gegenlosung
  erledigt statisches Phishing, nicht Evilginx.
- **Beobachtungsresistenz.** Zwei bis drei Beobachtungen eines Logins geben die Regel
  preis. Das ist die Grenze des menschlichen Arbeitsgedächtnisses, nicht des Codes,
  und der Grund, warum seltene Nutzung (Break-Glass, Reise, Helpdesk) die tragfähige
  Positionierung bleibt.
