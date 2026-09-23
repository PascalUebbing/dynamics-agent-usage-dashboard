# Validierungscheckliste

## Build

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run solution:pack -- --version <semver>`
- Managed ZIP enthält Entities, Roles, Workflow, Environment Variable und Web Resources

## Sandbox-Import

- Managed Solution importiert ohne Fehler
- alle drei Connection References lassen sich binden
- Flow lässt sich aktivieren
- Dashboard-Web-Resource lädt in Customer Service workspace
- DE/EN folgt der Benutzersprache

## Credit-Sync

- Flow nutzt die aktuelle Environment ID
- andere Environments desselben Mandanten erscheinen nicht im Dashboard
- erster Backfill endet erfolgreich
- zweiter Lauf erzeugt keine doppelten Summen
- Continuation Token wird mit einem ausreichend großen Datensatz verarbeitet
- Creditwerte stimmen für denselben API-Datenstand mit dem Admin Center überein
- fehlende oder abgelaufene Connection erzeugt sichtbaren Failed-Status

## Customer Intent Agent

- Resource ID im Zielmandanten zweifelsfrei identifiziert
- Environment Variable gesetzt
- Dashboard filtert strikt auf diese ID
- `msdyn_intententity` enthält die erwarteten Kanäle/Objekttypen
- erkannte Intents sind stichprobenartig reproduzierbar
- Join für engagierte Konversationen gegen den Microsoft-Report validiert, bevor diese
  Kennzahl aktiviert wird

## Sicherheit

- Reader kann Dashboard und Aggregate lesen
- Reader kann Konfiguration und Syncdaten nicht verändern
- Benutzer ohne Intent-Rechte erhält eine sichtbare Warnung
- keine Tokens, Connection IDs, Org-URLs oder Gesprächsinhalte im Repository/Bundle

## ALM

- Managed Upgrade erhält Connections und Daten
- Unmanaged Paket nur für Entwicklung gekennzeichnet
- Deinstallation entfernt Solution-Komponenten
- manuelle Customer-Service-Navigation ist dokumentiert
