const {
  apply,
  chain,
  mergeWith,
  move,
  SchematicsException,
  url,
  template,
  filter,
  forEach,
} = require('@angular-devkit/schematics');
const { getWorkspace } = require('@schematics/angular/utility/workspace');
const { join, relative, dirname, normalize } = require('@angular-devkit/core');

const APP_CHECK_DEBUG_SCRIPT = `<script>
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
</script>`;

const PROVIDER_LINE =
  'provideFirebaseAILogic(firebaseAILogicFromEnvironment(environment)),';

const SCAFFOLD_PATHS = [
  'environments/firebase.config.ts',
  'environments/environment.model.ts',
  'environments/environment.ts',
  'environments/environment.development.ts',
  'app/services/ai.service.ts',
  'app/ai-demo/ai-demo.ts',
  'app/ai-demo/ai-demo.scss',
];

/**
 * @param {import('./schema.json')} options
 */
function setup(options) {
  return async (host, context) => {
    const projectName = options.project || context.target?.project || 'app';
    const workspace = await getWorkspace(host);
    const project = workspace.projects.get(projectName);

    if (!project) {
      throw new SchematicsException(
        `Project "${projectName}" not found in angular.json.`,
      );
    }

    const sourceRoot = normalize(
      project.sourceRoot ?? join(project.root ?? '', 'src'),
    );
    const appRoot = normalize(join(sourceRoot, 'app'));
    const envRoot = normalize(join(sourceRoot, 'environments'));

    const resolved = {
      ...options,
      project: projectName,
      sourceRoot,
      appRoot,
      envRoot,
      model: options.model ?? 'gemini-3.5-flash',
      demo: options.demo !== false,
      skipEnvironments: options.skipEnvironments === true,
      skipPaths: [],
    };

    return chain([
      markExistingScaffoldFiles(resolved),
      mergeWith(generateFiles(resolved)),
      patchAppConfig(resolved),
      patchIndexHtml(resolved, project),
      ensureEnvironmentFileReplacements(resolved, projectName),
      logNextSteps(resolved),
    ])(host, context);
  };
}

/**
 * @param {Record<string, unknown> & { skipPaths: string[]; envRoot: string; appRoot: string }} options
 */
function markExistingScaffoldFiles(options) {
  return (host) => {
    for (const scaffoldPath of SCAFFOLD_PATHS) {
      if (options.skipEnvironments && scaffoldPath.startsWith('environments/')) {
        continue;
      }
      if (!options.demo && scaffoldPath.startsWith('app/ai-demo/')) {
        continue;
      }

      const targetPath = scaffoldPath.startsWith('environments/')
        ? join(options.envRoot, scaffoldPath.slice('environments/'.length))
        : join(options.appRoot, scaffoldPath.slice('app/'.length));

      if (host.exists(targetPath)) {
        options.skipPaths.push(scaffoldPath);
      }
    }

    return host;
  };
}

/**
 * @param {Record<string, unknown> & { skipPaths: string[]; model: string; skipEnvironments: boolean; demo: boolean; envRoot: string; appRoot: string }} options
 */
function generateFiles(options) {
  return apply(url('./files'), [
    filter((path) => {
      if (options.skipPaths.includes(path)) {
        return false;
      }
      if (options.skipEnvironments && path.startsWith('environments/')) {
        return false;
      }
      if (!options.demo && path.startsWith('app/ai-demo/')) {
        return false;
      }
      return true;
    }),
    template({
      model: options.model,
    }),
    forEach((fileEntry) => {
      if (fileEntry.path.endsWith('.template')) {
        fileEntry.path = fileEntry.path.slice(0, -'.template'.length);
      }
      return fileEntry;
    }),
    move((path) => {
      if (path.startsWith('environments/')) {
        return join(options.envRoot, path.slice('environments/'.length));
      }
      if (path.startsWith('app/')) {
        return join(options.appRoot, path.slice('app/'.length));
      }
      return path;
    }),
  ]);
}

/**
 * @param {Record<string, unknown> & { envRoot: string; appRoot: string }} options
 */
function patchAppConfig(options) {
  return (host, context) => {
    const appConfigPath = findAppConfigPath(host, options.appRoot);
    if (!appConfigPath) {
      context.logger.warn(
        'Could not find app.config.ts — add provideFirebaseAILogic(...) manually.',
      );
      return host;
    }

    const buffer = host.read(appConfigPath);
    if (!buffer) {
      return host;
    }

    let content = buffer.toString('utf8');

    if (content.includes('provideFirebaseAILogic')) {
      return host;
    }

    const envImportPath = toImportPath(
      dirname(appConfigPath),
      join(options.envRoot, 'environment'),
    );

    const importBlock = [
      "import {",
      "  firebaseAILogicFromEnvironment,",
      "  provideFirebaseAILogic,",
      "} from 'ngx-firebase-ai-logic';",
      `import { environment } from '${envImportPath}';`,
    ].join('\n');

    content = insertAfterLastImport(content, importBlock);

    if (!content.includes('providers: [')) {
      throw new SchematicsException(
        `${appConfigPath} has no providers: [] array — wire provideFirebaseAILogic manually.`,
      );
    }

    content = content.replace(
      /providers:\s*\[/,
      `providers: [\n    ${PROVIDER_LINE}`,
    );

    host.overwrite(appConfigPath, content);
    return host;
  };
}

/**
 * @param {Record<string, unknown> & { sourceRoot: string }} options
 * @param {import('@schematics/angular/utility/workspace').ProjectDefinition} project
 */
function patchIndexHtml(options, project) {
  return (host) => {
    const indexPath = normalize(
      join(
        options.sourceRoot,
        project.targets.get('build')?.options?.index ?? 'index.html',
      ),
    );

    if (!host.exists(indexPath)) {
      return host;
    }

    let content = host.read(indexPath).toString('utf8');

    if (content.includes('FIREBASE_APPCHECK_DEBUG_TOKEN')) {
      return host;
    }

    if (content.includes('</head>')) {
      content = content.replace(
        '</head>',
        `  ${APP_CHECK_DEBUG_SCRIPT}\n</head>`,
      );
    } else {
      content = `${APP_CHECK_DEBUG_SCRIPT}\n${content}`;
    }

    host.overwrite(indexPath, content);
    return host;
  };
}

/**
 * @param {Record<string, unknown> & { skipEnvironments: boolean; sourceRoot: string }} options
 * @param {string} projectName
 */
function ensureEnvironmentFileReplacements(options, projectName) {
  return (host) => {
    if (options.skipEnvironments) {
      return host;
    }

    const angularJsonPath = '/angular.json';
    if (!host.exists(angularJsonPath)) {
      return host;
    }

    const angularJson = JSON.parse(host.read(angularJsonPath).toString('utf8'));
    const project = angularJson.projects?.[projectName];
    const build = project?.architect?.build;
    const development = build?.configurations?.development;

    if (!development) {
      return host;
    }

    const replacements = development.fileReplacements ?? [];
    const envPath = join(options.sourceRoot, 'environments/environment.ts');
    const devEnvPath = join(
      options.sourceRoot,
      'environments/environment.development.ts',
    );

    const alreadyConfigured = replacements.some(
      (entry) =>
        normalize(entry.replace) === normalize(envPath) &&
        normalize(entry.with) === normalize(devEnvPath),
    );

    if (alreadyConfigured) {
      return host;
    }

    replacements.push({
      replace: envPath,
      with: devEnvPath,
    });

    development.fileReplacements = replacements;
    host.overwrite(angularJsonPath, `${JSON.stringify(angularJson, null, 2)}\n`);
    return host;
  };
}

/**
 * @param {Record<string, unknown> & { skipEnvironments: boolean; envRoot: string; appRoot: string; demo: boolean }} options
 */
function logNextSteps(options) {
  return (_host, context) => {
    context.logger.info('');
    context.logger.info('ngx-firebase-ai-logic setup complete.');
    context.logger.info('');
    context.logger.info('Replace placeholders next:');
    if (!options.skipEnvironments) {
      context.logger.info(`  • ${join(options.envRoot, 'firebase.config.ts')}`);
    }
    context.logger.info(
      `  • Model ID in ${join(options.appRoot, 'services/ai.service.ts')} (if needed)`,
    );
    context.logger.info('');
    context.logger.info('Firebase Console (see FIREBASE_SETUP.md in node_modules):');
    context.logger.info('  1. Enable AI Logic → Gemini Developer API');
    context.logger.info('  2. Register App Check + reCAPTCHA Enterprise');
    context.logger.info('  3. Restrict Browser API key');
    context.logger.info('');
    context.logger.info('Local dev:');
    context.logger.info(
      '  ng serve → copy App Check debug token from DevTools → Firebase Console',
    );
    if (options.demo) {
      context.logger.info('');
      context.logger.info('Demo component created at src/app/ai-demo/');
      context.logger.info(
        '  Add <app-ai-demo /> to your root template and import AiDemo in the parent component.',
      );
    }
    context.logger.info('');
    return _host;
  };
}

/**
 * @param {import('@angular-devkit/schematics').Tree} host
 * @param {import('@angular-devkit/core').Path} appRoot
 */
function findAppConfigPath(host, appRoot) {
  const candidates = [
    join(appRoot, 'app.config.ts'),
    join(appRoot, 'config/app.config.ts'),
  ];

  for (const candidate of candidates) {
    if (host.exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * @param {import('@angular-devkit/core').Path} fromDir
 * @param {import('@angular-devkit/core').Path} targetPathWithoutExtension
 */
function toImportPath(fromDir, targetPathWithoutExtension) {
  let rel = relative(fromDir, targetPathWithoutExtension).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}

/**
 * @param {string} content
 * @param {string} newImports
 */
function insertAfterLastImport(content, newImports) {
  const importRegex = /^import .+;$/gm;
  let lastMatch = null;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch) {
    return `${newImports}\n\n${content}`;
  }

  const insertAt = lastMatch.index + lastMatch[0].length;
  return `${content.slice(0, insertAt)}\n${newImports}${content.slice(insertAt)}`;
}

module.exports = setup;
