import { describe, expect, it } from 'vitest';

import { Tokenizer } from '../../src/cli/Tokenizer';

describe('P3 Tokenizer 注释与引号规则（§2 通用约定）', () => {
  const tokenizer = new Tokenizer();

  it('按空白切分', () => {
    expect(tokenizer.tokenize('create rect r1 10 20 100 50')).toEqual([
      'create',
      'rect',
      'r1',
      '10',
      '20',
      '100',
      '50',
    ]);
  });

  it('双引号包裹的整段算一个参数', () => {
    expect(tokenizer.tokenize('create text t1 20 40 "My Diagram"')).toEqual([
      'create',
      'text',
      't1',
      '20',
      '40',
      'My Diagram',
    ]);
  });

  it('空字符串 "" 也算一个参数', () => {
    expect(tokenizer.tokenize('create text t1 0 0 ""')).toEqual([
      'create',
      'text',
      't1',
      '0',
      '0',
      '',
    ]);
  });

  it('# 开头的整行是注释', () => {
    expect(tokenizer.tokenize('# 这是注释')).toEqual([]);
    expect(tokenizer.tokenize('   # 缩进后仍是注释')).toEqual([]);
    expect(tokenizer.tokenize('#')).toEqual([]);
  });

  it('行内 # 不是注释——颜色值必须保留（§6.1 的 #4a90d9）', () => {
    expect(tokenizer.tokenize('create rect start 120 100 160 60 #4a90d9 in node1')).toEqual([
      'create',
      'rect',
      'start',
      '120',
      '100',
      '160',
      '60',
      '#4a90d9',
      'in',
      'node1',
    ]);
  });

  it('引号内的 # 原样保留', () => {
    expect(tokenizer.tokenize('create text t1 0 0 "标题 #1"')).toEqual([
      'create',
      'text',
      't1',
      '0',
      '0',
      '标题 #1',
    ]);
  });

  it('空行返回空数组', () => {
    expect(tokenizer.tokenize('')).toEqual([]);
    expect(tokenizer.tokenize('    ')).toEqual([]);
  });
});
