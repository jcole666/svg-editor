import { describe, expect, it } from 'vitest';

import { UsageError } from '../../src/commands/UsageError';
import { DuplicateIdError } from '../../src/model/DuplicateIdError';
import { NoDocumentError } from '../../src/model/NoDocumentError';
import { NoSuchContainerError } from '../../src/model/NoSuchContainerError';
import { NotAContainerError } from '../../src/model/NotAContainerError';
import { UnknownShapeTypeError } from '../../src/model/UnknownShapeTypeError';
import { createRunner } from '../helpers';

describe('P3 create 命令与图形工厂', () => {
  it('六种内置类型都能创建并回显 label', () => {
    const run = createRunner();
    run('init');
    expect(run('create rect r1 10 20 100 50')).toEqual(['rect#r1 created']);
    expect(run('create circle c1 100 100 20')).toEqual(['circle#c1 created']);
    expect(run('create ellipse e1 1 2 3 4')).toEqual(['ellipse#e1 created']);
    expect(run('create line l1 0 0 10 10')).toEqual(['line#l1 created']);
    expect(run('create text t1 20 40 "My Diagram"')).toEqual(['text#t1 created']);
    expect(run('create g g1')).toEqual(['g#g1 created']);
  });

  it('可选 fill / stroke 参数生效（对齐 §4.1 的参数表）', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 10 20 100 50 #eee');
    run('create circle c1 100 100 20 red');
    run('create ellipse e1 1 2 3 4 blue');
    run('create line l1 0 0 10 10 black');

    expect(run('show r1')).toEqual([
      'rect#r1  parent=svg',
      '  x=10 y=20 w=100 h=50',
      '  fill=#eee',
    ]);
    expect(run('show l1')[1]).toBe('  (0,0) -> (10,10)');
    expect(run('show l1')).toContain('  stroke=black');
  });

  it('省略 fill 时不写入该属性', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 10 20 100 50');
    expect(run('show r1')).toEqual(['rect#r1  parent=svg', '  x=10 y=20 w=100 h=50']);
  });

  it('in 子句把图形挂进容器，并在回显里标出容器', () => {
    const run = createRunner();
    run('init');
    run('create g node1');
    expect(run('create rect start 120 100 160 60 #4a90d9 in node1')).toEqual([
      'rect#start created in g#node1',
    ]);
    expect(run('tree')).toEqual([
      'svg (800x600)',
      '└── g#node1',
      '    └── rect#start  x=120 y=100 w=160 h=60 fill=#4a90d9',
    ]);
  });

  it('in 子句可以多层嵌套（对齐 §6.1 的流程图构建方式）', () => {
    const run = createRunner();
    run('init 800 600');
    run('create g flowchart');
    run('create g node1 in flowchart');
    run('create rect start 120 100 160 60 #4a90d9 in node1');
    run('create text start-label 155 135 "开始" in node1');

    expect(run('tree node1')).toEqual([
      'g#node1',
      '├── rect#start        x=120 y=100 w=160 h=60 fill=#4a90d9',
      '└── text#start-label  (155,135) "开始"',
    ]);
  });

  it('text 的内容里可以有空格', () => {
    const run = createRunner();
    run('init');
    run('create text title 20 40 "My Diagram"');
    expect(run('show title')[1]).toBe('  (20,40) "My Diagram"');
  });

  it('text 内容恰好是 in 时不会被误判成 in 子句', () => {
    const run = createRunner();
    run('init');
    expect(run('create text t1 0 0 "in"')).toEqual(['text#t1 created']);
    expect(run('show t1')[1]).toBe('  (0,0) "in"');
  });

  it('text 内容为 in 且真的带 in 子句时也能正确拆分', () => {
    const run = createRunner();
    run('init');
    run('create g g1');
    expect(run('create text t1 0 0 "in" in g1')).toEqual(['text#t1 created in g#g1']);
    expect(run('tree g1')).toEqual(['g#g1', '└── text#t1  (0,0) "in"']);
  });

  it('id 重复报 id already exists', () => {
    const run = createRunner();
    run('init');
    run('create g g1');
    expect(() => run('create g g1')).toThrow(DuplicateIdError);
    expect(() => run('create g g1')).toThrow('id already exists: g1');
  });

  it('未知类型报 unknown shape type 并带上插件提示', () => {
    const run = createRunner();
    run('init');
    expect(() => run('create hexagon h1 1 2 3')).toThrow(UnknownShapeTypeError);
    expect(() => run('create hexagon h1 1 2 3')).toThrow(
      'unknown shape type: hexagon (is the plugin loaded?)',
    );
  });

  it('box 在本阶段按未知类型处理（§4.4 明确本阶段不要求实现）', () => {
    const run = createRunner();
    run('init');
    expect(() => run('create box n1 120 100 160 60 "开始"')).toThrow(UnknownShapeTypeError);
  });

  it('in 指向不存在的 id 报 no such container', () => {
    const run = createRunner();
    run('init');
    expect(() => run('create rect r 1 2 3 4 in node9')).toThrow(NoSuchContainerError);
    expect(() => run('create rect r 1 2 3 4 in node9')).toThrow('no such container: node9');
  });

  it('in 指向非容器图形时报 not a container', () => {
    const run = createRunner();
    run('init');
    run('create rect start 1 2 3 4');
    expect(() => run('create rect r 1 2 3 4 in start')).toThrow(NotAContainerError);
    expect(() => run('create rect r 1 2 3 4 in start')).toThrow('not a container: start');
  });

  it('参数个数不对时报用法错误', () => {
    const run = createRunner();
    run('init');
    expect(() => run('create rect r1 1 2')).toThrow(UsageError);
    expect(() => run('create rect r1 1 2 3 4 5 6')).toThrow(UsageError);
    expect(() => run('create g g1 extra')).toThrow(UsageError);
    expect(() => run('create')).toThrow(UsageError);
    expect(() => run('create rect')).toThrow(UsageError);
  });

  it('未 init 就 create 报 no document', () => {
    expect(() => createRunner()('create g g1')).toThrow(NoDocumentError);
  });

  it('失败的 create 不留下任何图形（先校验后修改）', () => {
    const run = createRunner();
    run('init');
    expect(() => run('create rect r1 1 2 3 4 in node9')).toThrow(NoSuchContainerError);
    expect(run('tree')).toEqual(['svg (800x600)']);
  });
});
