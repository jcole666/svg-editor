/**
 * 分词器：把一行输入切成参数列表。
 *
 * 规则（任务书 §2 通用约定）：
 *   - 空白分隔参数
 *   - 双引号包裹的整段算一个参数（主要用于 text 的内容），例如 "My Diagram"
 *   - `#` **开头**的整行是注释，便于把手打命令序列存成脚本回放
 *
 * 关键细节：`#` 只在**行首**才是注释，行内不算。
 * 任务书 §6.1 的 `create rect start 120 100 160 60 #4a90d9 in node1` 里，
 * `#4a90d9` 是颜色值；若把行内 `#` 当注释，颜色和后面的 `in` 子句都会丢。
 */
export class Tokenizer {
  tokenize(line: string): string[] {
    // 整行注释：第一个非空白字符是 #
    if (line.trimStart().startsWith('#')) {
      return [];
    }

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
