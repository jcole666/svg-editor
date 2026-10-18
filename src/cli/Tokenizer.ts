/**
 * 分词器：把一行输入切成参数列表。
 *
 * 规则（任务书 §2 通用约定）：
 *   - 空白分隔参数
 *   - 双引号包裹的整段算一个参数（主要用于 text 的内容），例如 "My Diagram"
 *   - `#` 到行尾是注释，便于把手打命令序列存成脚本回放
 *
 * 例：
 *   create text title 20 40 "My Diagram"   ->  ['create','text','title','20','40','My Diagram']
 *   create circle c1 100 100 20 red # 注释  ->  ['create','circle','c1','100','100','20','red']
 */
export class Tokenizer {
  tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let hasToken = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (inQuotes) {
        if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
        continue;
      }

      if (ch === '#') {
        break; // 注释开始，丢掉后面全部
      }

      if (ch === '"') {
        inQuotes = true;
        hasToken = true; // 空字符串 "" 也算一个参数
        continue;
      }

      if (ch === ' ' || ch === '\t' || ch === '\r') {
        if (hasToken) {
          tokens.push(current);
          current = '';
          hasToken = false;
        }
        continue;
      }

      current += ch;
      hasToken = true;
    }

    if (hasToken) {
      tokens.push(current);
    }

    return tokens;
  }
}
