import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { Repl } from '../../src/cli/Repl';

/**
 * 端到端层：真实走 Repl 的"读入 → 分词 → 分派 → 执行 → 打印"整条链路，
 * 只把 stdio 换成内存流，因此连提示符、错误格式、退出行为都被覆盖。
 */
async function runSession(lines: readonly string[]): Promise<string> {
  const input = new PassThrough();
  const output = new PassThrough();

  let captured = '';
  output.on('data', (chunk: Buffer) => {
    captured += chunk.toString();
  });

  const repl = new Repl({ input, output });
  const finished = repl.start();

  for (const line of lines) {
    input.write(`${line}\n`);
  }
  input.end();

  await finished;
  return captured;
}

describe('P9 端到端：Repl 完整链路', () => {
  it('打印横幅与提示符', async () => {
    const output = await runSession(['exit']);
    expect(output).toContain("svg-editor 0.1 — type 'help' for commands");
    expect(output).toContain('svg> ');
  });

  it('一条完整的操作链：init → create → tree', async () => {
    const output = await runSession([
      'init 800 600',
      'create rect r1 10 20 100 50 #eee',
      'tree',
      'exit',
    ]);

    expect(output).toContain('canvas 800x600 created');
    expect(output).toContain('rect#r1 created');
    expect(output).toContain('svg (800x600)');
    expect(output).toContain('rect#r1  x=10 y=20 w=100 h=50 fill=#eee');
  });

  it('未知命令走 Repl 自己的分支', async () => {
    const output = await runSession(['foo bar', 'exit']);
    expect(output).toContain('error: unknown command: foo');
  });

  it('领域错误带 error: 前缀打印', async () => {
    const output = await runSession(['tree', 'exit']);
    expect(output).toContain("error: no document. use 'init' or 'read' first");
  });

  it('exit 之后的输入不再执行', async () => {
    const output = await runSession(['init', 'exit', 'create rect r1 0 0 1 1']);
    expect(output).not.toContain('rect#r1 created');
  });

  it('注释行与空行不产生任何输出', async () => {
    const output = await runSession(['# 这是注释', '', '   ', 'init', 'exit']);
    expect(output).not.toContain('error');
    expect(output).toContain('canvas 800x600 created');
  });

  it('undo / redo 在端到端链路上可用', async () => {
    const output = await runSession([
      'init',
      'create circle c1 100 100 20',
      'move c1 30 0',
      'undo',
      'redo',
      'exit',
    ]);

    expect(output).toContain('circle#c1 moved to (130,100)');
    expect(output).toContain('circle#c1 moved back to (100,100)');
  });

  it('输入流结束时正常收尾（不依赖 exit）', async () => {
    const output = await runSession(['init']);
    expect(output).toContain('canvas 800x600 created');
  });
});
