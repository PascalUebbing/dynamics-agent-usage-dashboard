import AdmZip from 'adm-zip';
import { existsSync } from 'node:fs';

const packagePath = process.argv[2];
if (!packagePath || !existsSync(packagePath)) {
  throw new Error('Pass the solution ZIP path to verify.');
}

const zip = new AdmZip(packagePath);
const customizations = zip.readAsText('customizations.xml');
const solution = zip.readAsText('solution.xml');

for (const entity of ['cat_agentdetail', 'cat_syncmetadata', 'cat_TenantCapacity']) {
  if (!customizations.includes(`<Name LocalizedName=`) || !customizations.includes(`>${entity}</Name>`)) {
    throw new Error(`Packed customizations.xml does not define table ${entity}.`);
  }
}

for (const webResource of [
  'pue_/agentusage/index.html',
  'pue_/agentusage/dashboard.js',
  'pue_/agentusage/dashboard.css',
]) {
  if (!solution.includes(`schemaName="${webResource}"`)) {
    throw new Error(`Packed solution.xml is missing ${webResource}.`);
  }
}

for (const environmentVariable of [
  'environmentvariabledefinitions/pue_CustomerIntentAgentResourceId/environmentvariabledefinition.xml',
  'environmentvariabledefinitions/pue_RetentionDays/environmentvariabledefinition.xml',
]) {
  if (!zip.getEntry(environmentVariable)) {
    throw new Error(`Packed solution is missing ${environmentVariable}.`);
  }
}

if (!zip.getEntry('Workflows/CopilotCreditConsumptionEndToEnd-3C9D1E202B3C4D5E9F6A7B8C9D0E1F2A.json')) {
  throw new Error('Packed solution is missing the daily sync flow.');
}

console.log('Packed solution contains table definitions, web resources, and flow.');
