import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { DuplicateRegistrationError } from '../extension/DuplicateRegistrationError';
import { ExtensionHub } from '../extension/ExtensionHub';
import type { PluginContext } from '../extension/PluginContext';

export interface LoaderLog {
  write(line: string): void;
}

interface Contributions {
  shapes: string[];
  commands: string[];
  decorators: string[];
  attributes: string[];
}

interface PluginEntry {
  module?: unknown;
  enabled?: unknown;
  options?: unknown;
}

const EMPTY: Contributions = { shapes: [], commands: [], decorators: [], attributes: [] };

/**
 * 配置装配。不写死任何一个插件的名字或 import。
 * 失败只打印一行，撤回这个插件登记过的东西，然后继续下一个。
 */
export class PluginLoader {
  constructor(private readonly log: LoaderLog = { write: (line) => console.log(line) }) {}

  async loadConfig(configPath: string, hub: ExtensionHub): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      this.log.write('error: invalid plugin config');
      return;
    }

    if (!isValidConfig(parsed)) {
      this.log.write('error: invalid plugin config');
      return;
    }

    const baseDir = path.dirname(path.resolve(configPath));
    for (const entry of parsed.plugins) {
      if (entry.enabled === false) {
        continue;
      }
      const options =
        entry.options !== null && typeof entry.options === 'object' ? entry.options : undefined;
      await this.loadSpecifier(String(entry.module), baseDir, hub, options);
    }
  }

  /** 代码装配和配置装配最后都进这里。 */
  async loadSpecifier(
    specifier: string,
    baseDir: string,
    hub: ExtensionHub,
    options?: unknown,
  ): Promise<void> {
    let resolved: string;
    try {
      resolved = resolveModule(specifier, baseDir);
    } catch {
      this.log.write(`error: plugin not found: ${specifier}`);
      return;
    }

    const name = pluginName(resolved, specifier);
    let imported: { default?: unknown };
    try {
      imported = (await import(pathToFileURL(resolved).href)) as { default?: unknown };
    } catch (error) {
      this.log.write(`error: plugin failed to activate: ${name} (${reasonOf(error)})`);
      return;
    }

    if (imported.default === undefined) {
      this.log.write(`error: plugin has no default export: ${specifier}`);
      return;
    }

    const plugin = instantiate(imported.default);
    if (plugin === null) {
      this.log.write(`error: plugin failed to activate: ${name} (activate is not a function)`);
      return;
    }

    const staged = new StagedContext(hub);
    try {
      plugin.activate(staged, options);
    } catch (error) {
      staged.rollback();
      if (error instanceof DuplicateRegistrationError) {
        this.log.write(`error: ${error.message}`);
        return;
      }
      this.log.write(`error: plugin failed to activate: ${name} (${reasonOf(error)})`);
      return;
    }

    let declared: Contributions;
    try {
      declared = readContributions(resolved);
    } catch (error) {
      staged.rollback();
      this.log.write(`error: plugin failed to activate: ${name} (${reasonOf(error)})`);
      return;
    }
    const registered = staged.registered();
    if (!sameContributions(declared, registered)) {
      staged.rollback();
      this.log.write(
        `error: plugin manifest mismatch: ${name} (declared: ${formatContributions(declared)}, registered: ${formatContributions(registered)})`,
      );
    }
  }
}

class StagedContext implements PluginContext {
  private readonly shapes: string[] = [];
  private readonly commands: string[] = [];
  private readonly decorators: string[] = [];
  private readonly attributes: string[] = [];

  constructor(private readonly hub: ExtensionHub) {}

  get session() {
    return this.hub.session;
  }

  registerShape(provider: Parameters<PluginContext['registerShape']>[0]): void {
    this.hub.shapes.register(provider);
    this.shapes.push(provider.typeName);
  }

  registerCommand(spec: Parameters<PluginContext['registerCommand']>[0]): void {
    this.hub.commands.register(spec);
    this.commands.push(spec.name);
  }

  registerDecorator(decorator: Parameters<PluginContext['registerDecorator']>[0]): void {
    this.hub.decorators.register(decorator);
    this.decorators.push(decorator.name);
  }

  registerAttribute(handler: Parameters<PluginContext['registerAttribute']>[0]): void {
    this.hub.attributes.register(handler);
    this.attributes.push(handler.name);
  }

  registered(): Contributions {
    return {
      shapes: [...this.shapes],
      commands: [...this.commands],
      decorators: [...this.decorators],
      attributes: [...this.attributes],
    };
  }

  rollback(): void {
    for (const name of this.shapes) {
      this.hub.shapes.unregister(name);
    }
    for (const name of this.commands) {
      this.hub.commands.unregister(name);
    }
    for (const name of this.decorators) {
      this.hub.decorators.unregister(name);
    }
    for (const name of this.attributes) {
      this.hub.attributes.unregister(name);
    }
  }
}

interface PluginInstance {
  activate(ctx: PluginContext, options?: unknown): void;
}

function instantiate(exported: unknown): PluginInstance | null {
  const value = typeof exported === 'function' ? new (exported as new () => unknown)() : exported;
  if (value === null || typeof value !== 'object' || typeof (value as PluginInstance).activate !== 'function') {
    return null;
  }
  return value as PluginInstance;
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function pluginName(resolved: string, specifier: string): string {
  const pkgPath = path.join(path.dirname(resolved), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return specifier;
  }
  try {
    const json = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: unknown };
    if (typeof json.name === 'string' && json.name.length > 0) {
      return json.name;
    }
  } catch {
    return specifier;
  }
  return specifier;
}

function readContributions(resolved: string): Contributions {
  const pkgPath = path.join(path.dirname(resolved), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { ...EMPTY, shapes: [], commands: [], decorators: [], attributes: [] };
  }
  const json = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { contributes?: Partial<Contributions> };
  const contributes = json.contributes ?? {};
  return {
    shapes: asList(contributes.shapes),
    commands: asList(contributes.commands),
    decorators: asList(contributes.decorators),
    attributes: asList(contributes.attributes),
  };
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function sameContributions(left: Contributions, right: Contributions): boolean {
  return formatContributions(left) === formatContributions(right);
}

function formatContributions(value: Contributions): string {
  return [
    `attributes=${[...value.attributes].sort().join(',')}`,
    `commands=${[...value.commands].sort().join(',')}`,
    `decorators=${[...value.decorators].sort().join(',')}`,
    `shapes=${[...value.shapes].sort().join(',')}`,
  ].join(';');
}

function isValidConfig(value: unknown): value is { plugins: PluginEntry[] } {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const plugins = (value as { plugins?: unknown }).plugins;
  if (!Array.isArray(plugins)) {
    return false;
  }
  return plugins.every((entry) => {
    if (entry === null || typeof entry !== 'object') {
      return false;
    }
    const item = entry as PluginEntry;
    if (item.enabled === false) {
      return true;
    }
    return typeof item.module === 'string' && item.module.length > 0;
  });
}

function resolveModule(specifier: string, baseDir: string): string {
  if (specifier.startsWith('.')) {
    return resolveEntry(path.resolve(baseDir, specifier));
  }
  const baseFile = fs.existsSync(path.join(baseDir, 'package.json'))
    ? path.join(baseDir, 'package.json')
    : path.join(baseDir, 'noop.js');
  return createRequire(baseFile).resolve(specifier);
}

function resolveEntry(full: string): string {
  if (!fs.existsSync(full)) {
    throw new Error('not found');
  }
  if (fs.statSync(full).isFile()) {
    return full;
  }
  const pkgPath = path.join(full, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const json = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { main?: unknown };
    if (typeof json.main === 'string') {
      const mainFile = path.resolve(full, json.main);
      if (fs.existsSync(mainFile)) {
        return mainFile;
      }
    }
  }
  for (const name of ['index.ts', 'index.js', 'index.mjs']) {
    const candidate = path.join(full, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('not found');
}

export function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 6; i += 1) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: unknown };
        if (json.name === 'svg-editor') {
          return dir;
        }
      } catch {
        // 继续往上找
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return process.cwd();
}
