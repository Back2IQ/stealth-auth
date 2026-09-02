# PATENTSCHRIFT-SKIZZE (DPMA / EPA / USPTO)

**Aktenzeichen / Referenz:** B2IQ-PAT-2026-STEALTH01  
**Anmelder:** Back2IQ (Inhaber: Deniz Kiran, Antalya / Deutschland)  
**Titel der Erfindung (DE):**  
*Verfahren und System zur gerätelosen, kognitiven Mehrfaktor-Authentifizierung basierend auf einer deterministischen Radix-26-Zustandsanzeige mit dynamischer Offset-Verschiebung und desynchronisationsresistentem Zustandsfenster.*

**Title of the Invention (EN):**  
*Method and System for Zero-Device Cognitive Multi-Factor Authentication based on Deterministic Radix-26 State Indications with Dynamic Offset Shifts and Desynchronization-Resistant Windowing.*

**Klassifikation (IPC/CPC):**  
- `H04L 9/40` – Netzwerksicherheit, Authentifizierungsprotokolle
- `G06F 21/31` – Benutzerauthentifizierung
- `G06F 21/36` – Authentifizierung durch kognitive oder visuelle Interaktion

---

## 1. TECHNISCHES GEBIET DER ERFINDUNG
Die vorliegende Erfindung betrifft das Gebiet der Cybersicherheit und Kryptografie, insbesondere Systeme und computerimplementierte Verfahren zur Mehrfaktor-Authentifizierung (MFA) von menschlichen Benutzern an geschützten Datenverarbeitungssystemen, Netzwerken und industriellen Kontrollsystemen, ohne dass physische Zusatzgeräte (Smartphones, Hardware-Tokens, Smartcards, Biometrie-Scanner) erforderlich sind.

---

## 2. STAND DER TECHNIK & TECHNISCHES PROBLEM
Herkömmliche Mehrfaktor-Authentifizierungsverfahren (MFA) beruhen typischerweise auf:
1. Einem Wissensfaktor (z.B. statisches Passwort) und
2. Einem Besitzfaktor (z.B. SMS-OTP, TOTP-Generator auf dem Smartphone, FIDO2/WebAuthn YubiKey, Smartcard).

### Nachteile des Stands der Technik:
- **Physische Restriktionen:** In hochsensiblen Zonen wie Reinräumen der Halbleiterfertigung (Halbleiter-Fabs, Nanotechnologie), pharmazeutischen Sterilbereichen, kerntechnischen Anlagen oder militärischen SCIF-Einrichtungen (Sensitive Compartmented Information Facility) ist das Mitführen von Mobiltelefonen, Funksendern, Kameras und nicht-sterilisierbaren USB-Geräten strengstens untersagt.
- **Angriffsflächen bei Executive Travel:** Hochrangige Entscheidungsträger und Ingenieure sind bei Auslandsreisen in repressive Staaten dem Risiko physischer Geräteeinbehaltung an Grenzkontrollstellen ("Border Device Forensics") sowie IMSI-Catchern und simulierten Evil-Twin-Mobilfunkzellen ausgesetzt.
- **Klassische "Cognitive Passwords" sind anfällig für Desynchronisation:** Bisherige One-Time-Password-Konzepte im Gedächtnis scheiterten in der Praxis daran, dass abgebrochene Logins oder parallele Zugriffsversuche den Zähler des Servers und das Gedächtnis des Nutzers desynchronisieren, was zu dauerhaften Aussperrungen führte.

---

## 3. TECHNISCHE LÖSUNG DER ERFINDUNG
Die Erfindung löst diese Probleme durch die synergetische Kombination einer **Radix-26-Zustandsabbildung**, einer **getarnten Benutzeroberflächen-Visualisierung**, einer **kognitiven Muskelgedächtnis-Transformation** und einer **fehlertoleranten Server-State-Engine mit asymmetrischem Lookahead-Fenster**.

---

## 4. PATENTANSPRÜCHE (PATENT CLAIMS)

### Patentanspruch 1 (Verfahrensanspruch / Method Claim – Hauptanspruch)
**1. Verfahren zur token- und gerätelosen kognitiven Mehrfaktor-Authentifizierung eines Benutzers an einem Datenverarbeitungssystem**, umfassend folgende computerimplementierte Schritte:
- **a)** Bereitstellen eines serverseitig in einem Datenspeicher persistent gespeicherten, sequentiellen Authentifizierungszählers $N \in \mathbb{N}_0$, der einem Benutzerkonto eindeutig zugeordnet ist;
- **b)** Erzeugen einer Authentifizierungsherausforderung (Challenge) bei Eingang einer Anmeldeanforderung, wobei der aktuelle Zählerstand $N$ deterministisch in ein Zustandstupel $(C, I)$ zerlegt wird, gemäß:
  $$C = \lfloor N / 26 \rfloor, \quad I = (N \bmod 26) + 1 \quad (I \in \{1, 2, \dots, 26\})$$
- **c)** Generieren einer optischen Zustandsanzeige $H(N)$ an einer Client-Benutzeroberfläche, wobei $H(N)$ für $C=0$ durch eine Zeichenkette des Index $I$ und für $C \ge 1$ durch eine verkettete Zeichenkette $C \mathbin{\Vert} \text{"-"} \mathbin{\Vert} I$ gebildet wird;
- **d)** Bereitstellen eines dem Index $I$ eineindeutig zugeordneten geheimen Zeichens $L(I) \in \{\text{'A'}, \dots, \text{'Z'}\}$ für eine im Gehirn des Benutzers ablaufende kognitive Transformation $\mathcal{T}(S, L(I))$ auf einem im Muskelgedächtnis des Benutzers gespeicherten Master-Passwort $S$, um ein transformiertes Einmal-Passwort $P_N$ zu bilden;
- **e)** Empfangen einer vom Benutzer an der Client-Benutzeroberfläche eingegebenen Antwortzeichenkette $P'$ oder eines davon kryptografisch abgeleiteten Prüfwerts;
- **f)** Serverseitiges Verifizieren der empfangenen Antwort gegen ein definiertes Fehlertoleranz-Zustandsfenster $W(N) = [N - \Delta_{\text{back}}, N + \Delta_{\text{fwd}}]$ mit $\Delta_{\text{fwd}} \ge 1$;
- **g)** Bei Feststellung einer Übereinstimmung der Antwort mit einem Zustand $N' \in W(N)$:
  - Automatisches Neusynchronisieren und Aktualisieren des im Datenspeicher gespeicherten Zählers auf den Folgezustand $N_{\text{neu}} = N' + 1$, und
  - Freigeben der geschützten Zugriffsberechtigung für das Benutzerkonto.

### Patentanspruch 2 (Tarnungs- und Steganografie-Merkmal)
**2. Verfahren nach Anspruch 1**, dadurch gekennzeichnet, dass die Zustandsanzeige $H(N)$ auf der Client-Benutzeroberfläche steganografisch als scheinbare Systemversionsnummer, Patch-Kennzeichnung oder Sitzungs-ID getarnt dargestellt wird, sodass ein unberechtigter Dritter die Authentifizierungsfunktion der Anzeige nicht erkennen kann.

### Patentanspruch 3 (Kryptografische Nonce-Bindung gegen Replay)
**3. Verfahren nach Anspruch 1 oder 2**, dadurch gekennzeichnet, dass mit jeder Challenge eine kryptografisch zufällige, temporäre Server-Nonce $R_{\text{sess}}$ und eine Sitzungskennung generiert wird, und die Antwort $P'$ als $\text{HMAC-SHA256}(P_N, R_{\text{sess}} \mathbin{\Vert} \text{SessionID})$ übertragen und verifiziert wird, wobei die Challenge nach einmaliger Verifikation oder Zeitablauf ungültig wird.

### Patentanspruch 4 (Kognitive Muskelgedächtnis-Ankerinjektion)
**4. Verfahren nach einem der Ansprüche 1 bis 3**, dadurch gekennzeichnet, dass die kognitive Transformation $\mathcal{T}(S, L(I))$ das Einfügen des Zeichens $L(I)$ an einer festen, dem Benutzer vorbekannten Muskelgedächtnis-Ankerposition $k$ innerhalb der Master-Passwort-Zeichenkette $S$ umfasst.

### Patentanspruch 5 (Wort-Grenzen-Transformation zur kognitiven Latenz-Eliminierung)
**5. Verfahren nach einem der Ansprüche 1 bis 3**, dadurch gekennzeichnet, dass die optische Zustandsanzeige als ein Codename-Wort $W$ (z. B. "Falcon", "Nexus") aus einem deterministischen Wörterbuch dargestellt wird, wobei der Benutzer ohne Zählen des Alphabets das erste Zeichen $W[0]$ an einer ersten definierten Ankerposition (z. B. als Präfix) und das letzte Zeichen $W[|W|-1]$ an einer zweiten definierten Ankerposition (z. B. als Suffix) mit dem Master-Passwort $S$ verknüpft, um eine kognitive Latenzzeit von unter 0,2 Sekunden zu erzielen.

### Patentanspruch 6 (Bildgestützte kognitive Objekt-Identifikation mit sprachgebundenem Geheimfaktor)
**6. Verfahren nach einem der Ansprüche 1 bis 3**, dadurch gekennzeichnet, dass die optische Zustandsanzeige als ein grafisches Icon oder Bild eines physischen Objekts $O$ (z. B. "Hut", "Auto", "Katze") dargestellt wird, wobei der Benutzer das Objekt in seiner im Benutzerkonto voreingestellten Sprache kognitiv benennt und das Anfangszeichen (z. B. 'H' in Großschreibung) sowie das Endzeichen (z. B. 't' in Kleinschreibung) des sprachspezifischen Objektbegriffs als dynamische Faktoren in das Master-Passwort einfügt, wodurch die Sprachkonfiguration als zusätzlicher impliziter Authentifizierungsfaktor dient und ein OCR-Textabgriff durch Schadsoftware verhindert wird.

### Patentanspruch 7 (Pseudo-CAPTCHA Steganografie)
**7. Verfahren nach einem der Ansprüche 1 bis 3**, dadurch gekennzeichnet, dass die optische Zustandsanzeige als ein verzerrtes, scheinbares Anti-Bot-Sicherheitsprüfzeichen (Pseudo-CAPTCHA) dargestellt wird, wobei der Benutzer die Randzeichen des Prüfzeichens in sein Master-Passwort integriert, während ein unberechtigter Dritter über die Natur des Authentifizierungsfeldes getäuscht wird.

### Patentanspruch 8 (Emergency Dual-Challenge Resynchronisation)
**8. Verfahren nach einem der Ansprüche 1 bis 7**, dadurch gekennzeichnet, dass bei einer außerhalb des Fensters $W(N)$ liegenden Desynchronisation eine Zweifach-Zustandsanzeige $(H(N), H(N+1))$ präsentiert wird und der Benutzer eine verkettete Doppel-Transformation eingibt, wodurch der Server den Zählerstand ohne Rückgriff auf externe Geräte re-kalibriert.

### Patentanspruch 9 (System- und Vorrichtungsanspruch)
**9. Datenverarbeitungssystem zur gerätelosen kognitiven Mehrfaktor-Authentifizierung**, umfassend:
- Mindestens einen Prozessor;
- Einen Speicher, der Befehle enthält, die bei Ausführung durch den Prozessor bewirken, dass das System die Schritte des Verfahrens nach mindestens einem der Ansprüche 1 bis 8 ausführt.

---

## 5. ERFINDERISCHE TÄTIGKEIT & ABGRENZUNG
- **Gegenüber TOTP (RFC 6238):** Kein physisches Gerät, kein Uhren-Drift-Problem, keine Hardware-Angriffsfläche.
- **Gegenüber statischen Passwörtern:** Vollständige Resistenz gegen Keylogger und Shoulder-Surfing durch strikte Einmal-Zustandsüberführung.
- **Gegenüber matrixbasierten Challenge-Systemen:** Keine visuelle Matrix auf dem Bildschirm erforderlich (welche Shoulder Surfern die Zuordnung preisgibt); stattdessen genügt eine unauffällige Zahl wie "14" oder "1-14", die nur der autorisierte Nutzer mit seiner privaten Anker-Regel interpretieren kann.
