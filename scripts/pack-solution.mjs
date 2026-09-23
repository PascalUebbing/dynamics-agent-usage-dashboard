import { ZipArchive } from 'archiver';
import {
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const solutionSource = join(root, 'solution', 'src');
const solutionOutput = join(root, 'solution', 'out');
const dashboardOutput = join(root, 'dist', 'dashboard');
const webResourceTarget = join(solutionSource, 'WebResources', 'pue_', 'agentusage');
const sourceSolutionXmlPath = join(solutionSource, 'Other', 'Solution.xml');
const solutionName = 'DynamicsAgentUsageDashboard';

function parseVersion(argv) {
  const index = argv.indexOf('--version');
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value || !/^\d+\.\d+\.\d+$/.test(value)) {
    throw new Error('Use --version with a semantic version, for example --version 0.1.0.');
  }
  return value;
}

function zipDirectory(source, target) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(target);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();
  });
}

const version = parseVersion(process.argv.slice(2));
const solutionVersion = `${version}.0`;

for (const file of ['index.html', 'dashboard.js', 'dashboard.css']) {
  const source = join(dashboardOutput, file);
  if (!existsSync(source)) {
    throw new Error(`Missing ${source}. Run npm run build first.`);
  }
}

const sourceSolutionXml = readFileSync(sourceSolutionXmlPath, 'utf8');
if (!sourceSolutionXml.includes('<Managed>2</Managed>')) {
  throw new Error('Solution source must contain <Managed>2</Managed>.');
}

mkdirSync(webResourceTarget, { recursive: true });
for (const file of ['index.html', 'dashboard.js', 'dashboard.css']) {
  cpSync(join(dashboardOutput, file), join(webResourceTarget, file));
}
writeFileSync(
  sourceSolutionXmlPath,
  sourceSolutionXml.replace(/<Version>[^<]+<\/Version>/, `<Version>${solutionVersion}</Version>`),
  'utf8',
);

rmSync(solutionOutput, { recursive: true, force: true });
mkdirSync(solutionOutput, { recursive: true });

for (const packageType of ['managed', 'unmanaged']) {
  const stagingRoot = join(
    tmpdir(),
    `dynamics-agent-usage-pack-${process.pid}-${packageType}`,
  );
  const packageRoot = join(stagingRoot, 'package');
  const packagePath = join(
    solutionOutput,
    `${solutionName}_${version}_${packageType}.zip`,
  );

  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(packageRoot, { recursive: true });

  try {
    cpSync(solutionSource, packageRoot, { recursive: true });
    const solutionXml = readFileSync(join(packageRoot, 'Other', 'Solution.xml'), 'utf8')
      .replace('<Managed>2</Managed>', `<Managed>${packageType === 'managed' ? 1 : 0}</Managed>`)
      .replace(/<Version>[^<]+<\/Version>/, `<Version>${solutionVersion}</Version>`);
    writeFileSync(join(packageRoot, 'solution.xml'), solutionXml, 'utf8');
    cpSync(
      join(packageRoot, 'Other', 'Customizations.xml'),
      join(packageRoot, 'customizations.xml'),
    );
    rmSync(join(packageRoot, 'Other'), { recursive: true, force: true });
    await zipDirectory(packageRoot, packagePath);
  } finally {
    rmSync(stagingRoot, { recursive: true, force: true });
  }
}

console.log(`Created managed and unmanaged ${version} packages in ${solutionOutput}.`);
