import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createRunner, errorLine } from '../helpers';

interface ErrorCase {
  readonly scenario: string;
  readonly setup: readonly string[];
  readonly command: string;
  readonly expected: string;
  /** 命令执行前后是否应当能取到 tree（用于验证"失败不改变任何状态"）。 */
  readonly hasDocument: boolean;
}

function unwritablePath(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'svg-editor-err-')), 'missing-dir', 'x.svg');
}

/** 只计算一次：命令里和期望值里必须是同一个路径字符串。 */
const UNWRITABLE = unwritablePath();

/**
 * 任务书 §4.2 的错误文案对照表。
 * 期望值刻意带上 `error: ` 前缀——这是 CLI 上真正打印的内容。
 */
const CASES: readonly ErrorCase[] = [
  {
    scenario: 'id 已存在',
    setup: ['init', 'create rect r1 0 0 1 1'],
    command: 'create rect r1 2 2 3 3',
    expected: 'error: id already exists: r1',
    hasDocument: true,
  },
  {
    scenario: 'id 不存在',
    setup: ['init'],
    command: 'move r9 1 2',
    expected: 'error: no such shape: r9',
    hasDocument: true,
  },
  {
    scenario: 'in 目标不存在',
    setup: ['init'],
    command: 'create rect r 1 2 3 4 in node9',
    expected: 'error: no such container: node9',
    hasDocument: true,
  },
  {
    scenario: 'in 目标不是容器',
    setup: ['init', 'create rect start 0 0 1 1'],
    command: 'create rect r 1 2 3 4 in start',
    expected: 'error: not a container: start',
    hasDocument: true,
  },
  {
    scenario: '未注册的图形类型',
    setup: ['init'],
    command: 'create hexagon h1 1 2 3',
    expected: 'error: unknown shape type: hexagon (is the plugin loaded?)',
    hasDocument: true,
  },
  {
    scenario: 'group 目标同时含某容器与其子孙',
    setup: ['init', 'create circle c1 0 0 1', 'group markers c1'],
    command: 'group bad c1 markers',
    expected: 'error: cannot group a container into its own descendant: markers',
    hasDocument: true,
  },
  {
    scenario: 'ungroup 根级容器',
    setup: ['init', 'create g scene'],
    command: 'ungroup scene',
    expected: 'error: cannot ungroup top-level container: scene',
    hasDocument: true,
  },
  {
    scenario: 'scale 非正数',
    setup: ['init', 'create rect r1 0 0 1 1'],
    command: 'scale r1 0',
    expected: 'error: scale factor must be positive',
    hasDocument: true,
  },
  {
    scenario: '文件不存在',
    setup: [],
    command: 'read no-such-file.svg',
    expected: 'error: cannot read file: no-such-file.svg',
    hasDocument: false,
  },
  {
    scenario: '文件不可写',
    setup: ['init'],
    command: `save ${UNWRITABLE}`,
    expected: `error: cannot write file: ${UNWRITABLE}`,
    hasDocument: true,
  },
  {
    scenario: '未 read/init 就执行其它命令',
    setup: [],
    command: 'tree',
    expected: "error: no document. use 'init' or 'read' first",
    hasDocument: false,
  },
];

describe('P8 任务书 §4.2 错误文案对照', () => {
  for (const testCase of CASES) {
    it(`${testCase.scenario} → ${testCase.expected}`, () => {
      const run = createRunner();
      for (const line of testCase.setup) {
        run(line);
      }

      const before = testCase.hasDocument ? run('tree') : null;
      expect(errorLine(run, testCase.command)).toBe(testCase.expected);

      // 失败不改变任何状态（§4.2 的隐含要求）
      if (before !== null) {
        expect(run('tree')).toEqual(before);
      }
    });
  }

  it('§4.2 的 cannot ungroup composite shape 在本阶段不可达（box 属插件化阶段）', () => {
    // §4.4 明确 box 是后续阶段的目标类型，本阶段应对它报 unknown shape type
    const run = createRunner();
    run('init');
    expect(errorLine(run, 'create box n1 120 100 160 60 "开始"')).toBe(
      'error: unknown shape type: box (is the plugin loaded?)',
    );
    // 因此 ungroup 的"复合图形"分支暂时没有任何类型能触发，等插件化阶段再启用
  });

  it('错误只加一次 error: 前缀', () => {
    const run = createRunner();
    run('init');
    const line = errorLine(run, 'move nope 1 2');
    expect(line.startsWith('error: ')).toBe(true);
    expect(line.startsWith('error: error: ')).toBe(false);
  });

  it('所有失败命令都不会污染撤销栈', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 1 1');

    errorLine(run, 'create rect r1 5 5 5 5');
    errorLine(run, 'move nope 1 2');
    errorLine(run, 'scale r1 0');
    errorLine(run, 'ungroup r1');

    // 撤销一次应当只撤销 create rect r1，而不是把失败的命令也撤掉
    run('undo');
    expect(run('tree')).toEqual(['svg (800x600)']);
  });
});
