import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const solutionSource = join(root, 'solution', 'src');
const solutionOutput = join(root, 'solution', 'out');
const dashboardOutput = join(root, 'dist', 'dashboard');
const webResourceTarget = join(solutionSource, 'WebResources', 'pue_', 'agentusage');
const solutionXmlPath = join(solutionSource, 'Other', 'Solution.xml');
const solutionName = 'DynamicsAgentUsageDashboard';

function parseVersion(argv) {
  const index = argv.indexOf('--version');
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value || !/^\d+\.\d+\.\d+$/.test(value)) {
    throw new Error('Use --version with a semantic version, for example --version 0.1.1.');
  }
  return value;
}

function runPac(args, cwd) {
  const actionPacPath = process.env.POWERPLATFORMTOOLS_PACPATH;
  if (actionPacPath) {
    const result = spawnSync(actionPacPath, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`PAC CLI failed with exit code ${result.status}.`);
    }
    return;
  }

  const isWindows = process.platform === 'win32';
  const executable = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'pac';
  const commandArgs = isWindows
    ? ['/d', '/s', '/c', ['pac', ...args].join(' ')]
    : args;
  const result = spawnSync(executable, commandArgs, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`PAC CLI failed with exit code ${result.status}.`);
  }
}

const version = parseVersion(process.argv.slice(2));
const solutionVersion = `${version}.0`;

for (const file of ['index.html', 'dashboard.js', 'dashboard.css']) {
  const source = join(dashboardOutput, file);
  if (!existsSync(source)) {
    throw new Error(`Missing ${source}. Run npm run build first.`);
  }
}

const solutionXml = readFileSync(solutionXmlPath, 'utf8');
if (!solutionXml.includes('<Managed>2</Managed>')) {
  throw new Error('Solution source must contain <Managed>2</Managed>.');
}

mkdirSync(webResourceTarget, { recursive: true });
for (const file of ['index.html', 'dashboard.js', 'dashboard.css']) {
  cpSync(join(dashboardOutput, file), join(webResourceTarget, file));
}
writeFileSync(
  solutionXmlPath,
  solutionXml.replace(/<Version>[^<]+<\/Version>/, `<Version>${solutionVersion}</Version>`),
  'utf8',
);

rmSync(solutionOutput, { recursive: true, force: true });
mkdirSync(solutionOutput, { recursive: true });

const stagingRoot = join(tmpdir(), `agent-usage-pack-${process.pid}`);
rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(stagingRoot, { recursive: true });
cpSync(solutionSource, join(stagingRoot, 'src'), { recursive: true });
mkdirSync(join(stagingRoot, 'out'), { recursive: true });

try {
  for (const packageType of ['Managed', 'Unmanaged']) {
    const suffix = packageType.toLowerCase();
    const fileName = `${solutionName}_${version}_${suffix}.zip`;
    runPac(
      [
        'solution',
        'pack',
        '--folder',
        'src',
        '--zipfile',
        `out/${fileName}`,
        '--packagetype',
        packageType,
        '--errorlevel',
        'Warning',
      ],
      stagingRoot,
    );

    const stagedPackage = join(stagingRoot, 'out', fileName);
    if (!existsSync(stagedPackage)) {
      throw new Error(`PAC CLI did not create ${stagedPackage}.`);
    }
    cpSync(stagedPackage, join(solutionOutput, fileName));
  }
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}

console.log(`Created managed and unmanaged ${version} packages in ${solutionOutput}.`);
