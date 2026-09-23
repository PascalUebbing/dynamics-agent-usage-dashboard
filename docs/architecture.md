# Architektur

## Ziele

- pro Kundenmandant installierbar
- keine zentrale Laufzeit und kein zentrales Datenlager
- keine hartkodierten Mandanten- oder Environment-IDs
- reproduzierbare Managed und Unmanaged Solutions
- sichtbare Fehler statt stiller Schätzungen

## Komponenten

### Daily Credit Sync

Der solution-aware Cloud Flow ruft täglich folgende Power-Platform-API-Routen auf:

```http
GET https://api.powerplatform.com/environmentmanagement/environments?api-version=2024-10-01
GET https://api.powerplatform.com/licensing/entitlements/MCSMessages?api-version=2024-10-01
GET https://api.powerplatform.com/licensing/entitlements/MCSMessages/resources
    ?fromDate=yyyy-MM-dd
    &toDate=yyyy-MM-dd
    &includeFields=users%2Ctags%2CasOfDate
    &pageSize=5000
    &continuationtoken={token}
    &api-version=2024-10-01
```

`workflow().tags.environmentName` bestimmt die aktuelle Environment ID. Nur deren
Verbrauchszeilen werden in `cat_agentdetail` geschrieben.

Der erste Lauf lädt bis zu 180 Tage. Danach werden die letzten sieben Tage ersetzt, damit
nachträgliche Microsoft-Korrekturen übernommen werden. Seiten und Dataverse-Batches
werden sequenziell verarbeitet. Ein separater Retention-Schritt löscht ältere
Credit-Fakten in 500er-Batches; die Frist kommt aus `pue_RetentionDays` und beträgt
standardmäßig 365 Tage.

### Dataverse

| Tabelle | Zweck |
|---|---|
| `cat_agentdetail` | Credit-Fakten pro Tag, Ressource und API-Dimension |
| `cat_tenantcapacity` | Capacity-Snapshot pro Lauf |
| `cat_syncmetadata` | Singleton mit Running/Success/Failed |
| `msdyn_intententity` | vorhandene Customer-Service-Zuordnung eines Intents zu Fall, E-Mail oder Konversation |

Die `cat_*`-Komponenten stammen aus dem MIT-lizenzierten Copilot-Credit-Consumption-
Projekt. Sie bleiben absichtlich schema-kompatibel, damit die bewährte Flow-Logik nicht
mit unvalidierten Metadatenänderungen neu implementiert wird.

### Dashboard

Die Web-Resource `pue_/agentusage/index.html` lädt ein React-/Fluent-UI-Bundle. Sie:

- ermittelt Client-URL und Benutzersprache aus dem aktuellen `Xrm`-Kontext,
- liest nur über die relative Dataverse Web API,
- filtert Credits strikt auf die konfigurierte Resource ID,
- zählt aktive `msdyn_intententity`-Zeilen als erkannte Intents,
- zeigt die engagierte Konversation nicht an, solange deren Produktschema-Abfrage nicht
  in einer Sandbox belegt ist.

Außerhalb von Dynamics wird ein deterministischer Demo-Provider verwendet.

## Ressourcen-Zuordnung

Die Licensing API liefert eine `resourceId`, aber garantiert für Microsoft-interne
Agents keinen stabilen Anzeigenamen. Die Environment Variable
`pue_CustomerIntentAgentResourceId` ist deshalb die einzige produktive Zuordnung.

Die Oberfläche darf eine Ressource vorübergehend auswählen, behandelt eine fehlende
persistierte Zuordnung aber weiterhin als Warnzustand.

## Sicherheitsgrenzen

- Connection Credentials bleiben in Power Platform Connections.
- Das Repository und die Solution enthalten keine Geheimnisse.
- Der Flow-Owner benötigt die administrativen Rechte zum Lesen der Licensing API.
- Dashboard-Leser erhalten organisationsweites Lesen auf den Credit-Tabellen.
- Lesen aus `msdyn_intententity` folgt den vorhandenen Customer-Service-Rollen.
- Gesprächsinhalte und Transkripte werden nicht gelesen.

## Bekannte Grenzen

- Public-Cloud-Endpunkt ist im Flow fest konfiguriert; Sovereign Clouds benötigen eine
  angepasste Variante.
- Die API dokumentiert einige optionale Metadaten nur teilweise.
- Ein nach Teilfehler vorhandener erster Backfill kann ältere Lücken nicht automatisch
  heilen; der Flow muss für einen vollständigen Neuaufbau kontrolliert zurückgesetzt
  werden.
- Die gewünschte 12-Monats-Historie entsteht fortlaufend. Der initiale API-Backfill ist
  auf den tatsächlich verfügbaren Microsoft-Zeitraum begrenzt.

## Quellen

- [Power Platform Licensing API](https://learn.microsoft.com/rest/api/power-platform/licensing/entitlement-insight/get-tenant-resources-across-environments)
- [Microsoft CAT: Copilot Credit consumption API](https://microsoft.github.io/mcscatblog/posts/copilot-credit-consumption-api/)
- [Customer Intent Agent](https://learn.microsoft.com/dynamics365/contact-center/administer/manage-customer-intent-agent)
- [`msdyn_intententity`](https://learn.microsoft.com/dynamics365/developer/reference/entities/msdyn_intententity)
