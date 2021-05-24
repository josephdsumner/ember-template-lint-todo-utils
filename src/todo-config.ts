import { join } from 'path';
import { DaysToDecay } from './types';

/**
 * Gets the todo configuration.
 * Config values can be present in
 *
 * The package.json
 *
 * @example
 * ```json
 * {
 *   "lintTodo": {
 *     "daysToDecay": {
 *       "warn": 5,
 *       "error": 10
 *     }
 *   }
 * }
 * ```
 *
 * Environment variables (`TODO_DAYS_TO_WARN` or `TODO_DAYS_TO_ERROR`)
 * 	- Env vars override package.json config
 *
 * Passed in directly, such as from command line options.
 * 	- Passed in options override both env vars and package.json config
 *
 * @param baseDir - The base directory that contains the project's package.json.
 * @param todoConfig - The optional todo configuration.
 * @returns - The todo config object.
 */
export function getTodoConfig(
  baseDir: string,
  todoConfig: DaysToDecay = {}
): DaysToDecay | undefined {
  const daysToDecayPackageConfig = getFromPackageJson(baseDir);
  const daysToDecayEnvVars = getFromEnvVars();
  let mergedConfig = Object.assign({}, daysToDecayPackageConfig, daysToDecayEnvVars, todoConfig);

  // we set a default config if the mergedConfig is an empty object, meaning either or both warn and error aren't
  // defined and the package.json doesn't explicitly define an empty config (they're opting out of defining a todoConfig)
  if (Object.keys(mergedConfig).length === 0 && typeof daysToDecayPackageConfig === 'undefined') {
    mergedConfig = {
      warn: 30,
      error: 60,
    };
  }

  if (
    typeof mergedConfig.warn === 'number' &&
    typeof mergedConfig.error === 'number' &&
    mergedConfig.warn >= mergedConfig.error
  ) {
    throw new Error(
      `The provided todo configuration contains invalid values. The \`warn\` value (${mergedConfig.warn}) must be less than the \`error\` value (${mergedConfig.error}).`
    );
  }

  return mergedConfig;
}

function getFromPackageJson(basePath: string): DaysToDecay | undefined {
  let pkg;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    pkg = require(join(basePath, 'package.json'));
  } catch {}

  return pkg?.lintTodo?.daysToDecay;
}

function getFromEnvVars(): DaysToDecay {
  const config: DaysToDecay = {};

  const warn = getEnvVar('TODO_DAYS_TO_WARN');
  const error = getEnvVar('TODO_DAYS_TO_ERROR');

  if (Number.isInteger(warn)) {
    config.warn = warn;
  }

  if (Number.isInteger(error)) {
    config.error = error;
  }

  return config;
}

function getEnvVar(name: string) {
  if (process.env[name]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number.parseInt(process.env[name]!, 10);
  }
}
