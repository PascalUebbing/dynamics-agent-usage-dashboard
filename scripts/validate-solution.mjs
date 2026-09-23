import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'solution', 'src');
const solutionXml = readFileSync(join(source, 'Other', 'Solution.xml'), 'utf8');
const customizationsXml = readFileSync(
  join(source, 'Other', 'Customizations.xml'),
  'utf8',
);
const workflowPath = join(
  source,
  'Workflows',
  'CopilotCreditConsumptionEndToEnd-3C9D1E202B3C4D5E9F6A7B8C9D0E1F2A.json',
);
const workflow = JSON.parse(readFileSync(workflowPath, 'utf8'));

const requiredPaths = [
  'Entities/cat_agentdetail/Entity.xml',
  'Entities/cat_syncmetadata/Entity.xml',
  'Entities/cat_TenantCapacity/Entity.xml',
  'Roles/Agent Usage Dashboard Reader.xml',
  'WebResources/pue_/agentusage/index.html.data.xml',
  'WebResources/pue_/agentusage/dashboard.js.data.xml',
  'WebResources/pue_/agentusage/dashboard.css.data.xml',
  'environmentvariabledefinitions/pue_CustomerIntentAgentResourceId/environmentvariabledefinition.xml',
  'environmentvariabledefinitions/pue_RetentionDays/environmentvariabledefinition.xml',
  '[Content_Types].xml',
];

const errors = [];
for (const path of requiredPaths) {
  if (!existsSync(join(source, path))) {
    errors.push(`Missing solution component: ${path}`);
  }
}

for (const required of [
  '<UniqueName>DynamicsAgentUsageDashboard</UniqueName>',
  '<Managed>2</Managed>',
  'pue_/agentusage/index.html',
  'pue_CustomerIntentAgentResourceId',
  'pue_RetentionDays',
]) {
  if (!solutionXml.includes(required)) {
    errors.push(`Solution manifest is missing: ${required}`);
  }
}

for (const connection of ['ccsync_bapref', 'ccsync_dvhttpref', 'ccsync_dvref']) {
  if (!customizationsXml.includes(`connectionreferencelogicalname="${connection}"`)) {
    errors.push(`Missing connection reference: ${connection}`);
  }
}

if (!customizationsXml.includes('<WebResources />')) {
  errors.push('Customizations.xml must contain the childless WebResources placeholder.');
}

const actions = workflow?.properties?.definition?.actions;
if (!actions?.Process || !actions?.Build_EnvMap?.actions?.Retention) {
  errors.push('Flow is missing its sync or 365-day retention scope.');
}
if (
  !JSON.stringify(workflow).includes(
    '/licensing/entitlements/MCSMessages/resources',
  )
) {
  errors.push('Flow is missing the supported MCSMessages resource endpoint.');
}

const serialized = `${solutionXml}\n${customizationsXml}\n${JSON.stringify(workflow)}`;
for (const forbidden of [
  /client[_-]?secret/i,
  /password\s*[:=]/i,
  /https:\/\/[a-z0-9-]+\.crm\d*\.dynamics\.com/i,
]) {
  if (forbidden.test(serialized)) {
    errors.push(`Potential environment-specific or secret value matched ${forbidden}.`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Solution source validation passed.');
