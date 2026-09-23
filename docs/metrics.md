# Kennzahlendefinitionen

## Billed Copilot Credits

Summe von `cat_billedcredit` für:

- den gewählten Zeitraum,
- die aktuelle Environment ID,
- die in `pue_CustomerIntentAgentResourceId` bestätigte Resource ID.

Mehrere API-Zeilen pro Agent und Tag sind zulässig, weil Feature, Tool, Modell, Kanal
oder Wissensquelle eine feinere Körnung erzeugen.

## Non-billed Credits

Summe von `cat_nonbilledcredit` mit denselben Filtern. Diese Menge wird getrennt
angezeigt und nicht in billed Credits eingerechnet.

## Erkannte Intents

Anzahl aktiver Zeilen in `msdyn_intententity` nach `createdon`.

Microsoft beschreibt die Tabelle als Zuordnung eines Intents zu einem Objekt wie Fall
oder Konversation, um sich entwickelnde Intents zu erfassen. Diese Kennzahl ist deshalb
eine Intent-Erkennung beziehungsweise -Zuordnung, keine interne Agent-Ausführung.

## Engagierte Konversationen

Fachliche Zieldefinition:

> Konversationen mit erkanntem Intent, die einem menschlichen oder AI-Agent angeboten
> und von diesem angenommen wurden.

Die Alpha-Version zeigt für diese Kennzahl `—`. Die öffentlich dokumentierte
`msdyn_intententity`-Tabelle belegt die Intent-Zuordnung, aber nicht allein die Annahme
der Konversation. Vor Implementierung muss die Join- und Statuslogik gegen das konkrete
Customer-Service-Schema und den Out-of-box-Report validiert werden.

## Verhältniskennzahlen

- Credits je erkanntem Intent = billed Credits / erkannte Intents
- Credits je engagierter Konversation = billed Credits / engagierte Konversationen

Bei null oder nicht verfügbarer Basis zeigt das Dashboard `—` und keine Null oder
Schätzung.

## Nicht unterstützte Kennzahlen

- Tokenverbrauch
- interne Agent-Ausführungen
- Kosten in Währung

Sie werden erst ergänzt, wenn Microsoft eine belastbare Quelle und Definition
bereitstellt.
