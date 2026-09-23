# Installation

## 1. Voraussetzungen prüfen

- Dynamics 365 Customer Service oder Contact Center mit Dataverse
- Power Automate Premium
- System Administrator für den Import
- Tenant-, Power-Platform- oder Billing-Administrator für die Power Platform API
- Customer Intent Agent und Intentdaten im Zielsystem

Die Alpha-Version ist für die Public Cloud vorbereitet.

## 2. Managed Solution importieren

`DynamicsAgentUsageDashboard_<version>_managed.zip` aus dem GitHub Release unter
**make.powerapps.com → Lösungen → Lösung importieren** importieren.

Beim Import die Connection References binden:

| Connection Reference | Connector | Konfiguration |
|---|---|---|
| Agent Usage - Power Platform API | HTTP with Microsoft Entra ID | Base Resource URL und Entra Resource URI: `https://api.powerplatform.com` |
| Agent Usage - Dataverse Web API | HTTP with Microsoft Entra ID | beide Werte auf die aktuelle Org-URL setzen |
| Agent Usage - Dataverse | Microsoft Dataverse | Verbindung zur aktuellen Umgebung |

Die Power-Platform-API-Verbindung muss durch einen geeigneten Mandantenadministrator
autorisiert werden.

## 3. Ersten Sync ausführen

Den Flow **Agent Usage Dashboard - Daily Credit Sync** aktivieren und einmal manuell
starten. Der erste 180-Tage-Lauf kann deutlich länger als Folgeläufe dauern.

In `cat_syncmetadata` muss danach gelten:

- `cat_lastsyncstatus = Success`
- `cat_lastsyncedat` ist aktuell
- `cat_lastsyncmessage` enthält keinen Fehler

Creditwerte für einen kurzen Zeitraum gegen
**Power Platform Admin Center → Licensing → Copilot Studio** abgleichen.

## 4. Customer Intent Agent zuordnen

Nach dem ersten Lauf die Tabelle `cat_agentdetail` öffnen und die Resource ID des
Customer Intent Agent bestimmen. Nicht allein nach einem vermuteten Namen zuordnen:
Verbrauch und Metadaten müssen im Zielmandanten plausibilisiert werden.

Den bestätigten Wert als Current Value der Environment Variable
`pue_CustomerIntentAgentResourceId` speichern.

Optional kann `pue_RetentionDays` angepasst werden. Der Standardwert `365` entspricht
zwölf Monaten. Es sind nur positive Ganzzahlen zulässig.

## 5. Leser berechtigen

Die mitgelieferte Rolle **Agent Usage Dashboard Reader** den Customer-Service-Benutzern oder
den betreffenden Business-Unit-Teams zuweisen.

Für erkannte Intents benötigen Benutzer zusätzlich Leserechte auf
`msdyn_intententity`. Diese Rechte sollten aus den bestehenden Customer-Service-Rollen
kommen; die Solution verändert keine Microsoft-Rollen.

## 6. Navigation ergänzen

Customer Service workspace im modernen App-Designer bearbeiten:

1. neue Seite beziehungsweise Web-Resource-Navigation hinzufügen,
2. Web Resource `pue_/agentusage/index.html` wählen,
3. Titel auf Deutsch und Englisch pflegen,
4. App speichern, veröffentlichen und in einer Testrolle öffnen.

Dieser Schritt bleibt bewusst manuell, damit die Solution keine verwaltete Microsoft-
App mit einer umgebungsspezifischen App-ID überschreibt.

## 7. Abnahme

Die Prüfliste in [validation.md](validation.md) vollständig durchführen.

## Update

Eine neuere Managed Solution über die bestehende Version importieren. Connections und
Dataverse-Daten bleiben erhalten. Nach dem Import prüfen, ob der Flow weiterhin
aktiviert ist.

## Deinstallation

Vor dem Löschen entscheiden, ob historische Creditdaten exportiert werden sollen.
Anschließend die Managed Solution löschen. Der manuell ergänzte Navigationspunkt muss
gegebenenfalls separat aus Customer Service workspace entfernt werden.
