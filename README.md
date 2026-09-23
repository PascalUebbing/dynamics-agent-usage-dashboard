# Dynamics Agent Usage Dashboard

[![CI](https://github.com/PascalUebbing/dynamics-agent-usage-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/PascalUebbing/dynamics-agent-usage-dashboard/actions/workflows/ci.yml)
[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)

Open-Source-Verbrauchsdashboard für Microsoft Dynamics 365 Customer Service. Der erste
MVP betrachtet den **Customer Intent Agent** und läuft vollständig im jeweiligen
Kundenmandanten.

> **Status: Alpha.** Dashboard, Credit-Sync und Solution-Build sind implementiert und
> lokal validiert. Die Zuordnung der Microsoft-internen Agent-Ressource und die exakte
> Kennzahl „engagierte Konversationen“ müssen vor einem produktiven Release in einer
> Customer-Service-Sandbox gegen echte Mandantendaten validiert werden.

## Was der MVP zeigt

- billed und non-billed Copilot Credits aus der Power Platform Licensing API
- tägliche Trends für die aktuelle Dataverse-Umgebung
- erkannte Intents aus `msdyn_intententity`
- Aufschlüsselung nach Intent und Intent-Gruppe
- Sync-Status und letzter erfolgreicher Datenstand
- explizite Warnungen bei fehlender Ressourcen-Zuordnung oder nicht verfügbarer
  Kennzahl
- deutsche und englische Oberfläche anhand der Dynamics-Benutzersprache

Die Lösung zeigt **keine erfundenen Token- oder Execution-Zahlen**. Microsofts
öffentlich dokumentierte Licensing API liefert Credits, aber keine verlässliche Zahl
interner Customer-Intent-Agent-Ausführungen. „Engagierte Konversationen“ bleiben
sichtbar als nicht verfügbar, bis die dafür notwendige Customer-Service-Beziehung im
Zielproduktschema validiert und der Daily-Aggregator ergänzt ist.

## Architektur

```text
Power Platform Licensing API
          │
          ▼
Daily Power Automate flow ──────► Dataverse Credit tables
                                      │
Customer Service intent entities ─────┤
                                      ▼
                           React web resource
                                      │
                                      ▼
                     Customer Service workspace
```

- Der tägliche Flow läuft um 03:00 UTC und verwendet ausschließlich
  mandanteneigene Connections.
- Die aktuelle Environment ID kommt aus dem Flow-Kontext; tenantweite API-Daten werden
  vor dem Schreiben auf diese Umgebung gefiltert.
- Der erste Lauf lädt bis zu 180 Tage, spätere Läufe aktualisieren überlappend die
  letzten sieben Tage.
- Standardmäßig werden 365 Tage gehalten; `pue_RetentionDays` macht die Frist
  mandantenseitig konfigurierbar.
- Verbrauchsdaten werden nur in Dataverse gespeichert. Es gibt keinen zentralen Dienst
  und keine Abhängigkeit von diesem GitHub-Repository zur Laufzeit.
- Das Dashboard ist eine React-/TypeScript-Web-Resource mit Fluent UI.

Mehr Details: [Architektur](docs/architecture.md) und
[Kennzahlendefinitionen](docs/metrics.md).

## Voraussetzungen

- Dynamics 365 Customer Service oder Contact Center mit Dataverse
- System Administrator für Solution-Import und Konfiguration
- Tenant-, Power-Platform- oder Billing-Administrator für die Licensing-API-Connection
- Power Automate Premium für die beiden HTTP-with-Microsoft-Entra-ID-Connections
- aktivierter Customer Intent Agent für reale Intentdaten

## Installation

Eine vollständige Anleitung steht in [docs/installation.md](docs/installation.md).

Kurzfassung:

1. `DynamicsAgentUsageDashboard_<version>_managed.zip` aus dem GitHub Release
   importieren.
2. Die drei Connection References an mandanteneigene Verbindungen binden.
3. Den Flow **Agent Usage Dashboard - Daily Credit Sync** einschalten und einmal
   ausführen.
4. Die Resource ID des Customer Intent Agent als Current Value der Environment Variable
   `pue_CustomerIntentAgentResourceId` hinterlegen.
5. `pue_/agentusage/index.html` einmalig im App-Designer zur Navigation von Customer
   Service workspace hinzufügen.
6. Die mitgelieferte Rolle **Agent Usage Dashboard Reader** den gewünschten Benutzern beziehungsweise
   Business-Unit-Teams zuweisen.

## Lokale Entwicklung

Voraussetzungen: Node.js 22 oder neuer. Für einen Solution-Import wird zusätzlich die
[Power Platform CLI](https://aka.ms/PowerPlatformCLI) benötigt.

```powershell
npm install
npm run dev
npm test
npm run build
npm run solution:pack -- --version 0.1.1
```

Außerhalb von Dynamics zeigt `npm run dev` deterministische Demodaten. In Dynamics
verwendet die App ausschließlich den aktuellen `Xrm`-Kontext und relative Dataverse
Web-API-Aufrufe.

## Repository-Struktur

```text
.github/workflows/   CI und Release
docs/                Architektur, Installation, Kennzahlen und Validierung
scripts/             reproduzierbarer Solution-Build
solution/src/        Dataverse-Tabellen, Rollen, Flow und Web-Resource-Metadaten
src/                 React-App, Dataverse-Adapter, Domänenlogik und Lokalisierung
```

## Datenschutz und Sicherheit

Das Projekt speichert keine Prompts, Transkripte oder API-Geheimnisse. Persistiert
werden nur aggregierbare Credit-Metadaten sowie Sync-Status. Intentdaten werden im
Dashboard direkt aus dem vorhandenen Customer-Service-Datenmodell gelesen.

Sicherheitsprobleme bitte gemäß [SECURITY.md](SECURITY.md) melden.

## Herkunft des Credit-Syncs

Der Credit-Sync und die Tabellenstruktur basieren auf dem MIT-lizenzierten Community-
Projekt [Copilot Credit Consumption](https://github.com/PetrosFeleskouras/copilot-credit-consumption).
Details stehen in [NOTICE](NOTICE). Das Dashboard, die Dynamics-Einbettung und die
Customer-Intent-Agent-spezifische Logik werden in diesem Repository entwickelt.

## Lizenz

[MIT](LICENSE). Dieses Projekt steht in keiner Verbindung zu Microsoft und wird von
Microsoft weder unterstützt noch gepflegt.

---

**English summary:** An open-source Dynamics 365 Customer Service dashboard for
Customer Intent Agent Copilot Credits and intent activity. All runtime data remains in
the customer's Dataverse environment.
