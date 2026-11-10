import * as vscode from 'vscode';

import { badgeFor } from './badge';
import { parseOutline, type OutlineNode } from './outline';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(new SvgBadgeProvider()),
    vscode.languages.registerDocumentSymbolProvider(
      [{ language: 'xml', pattern: '**/*.svg' }, { language: 'svg' }, { pattern: '**/*.svg' }],
      new SvgOutlineProvider(),
    ),
  );
}

export function deactivate(): void {}

class SvgBadgeProvider implements vscode.FileDecorationProvider {
  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
    if (uri.scheme !== 'file') {
      return undefined;
    }
    return vscode.workspace.fs.stat(uri).then(
      (stat) => {
        const badge = badgeFor(uri.fsPath, (stat.type & vscode.FileType.Directory) !== 0);
        if (badge === undefined) {
          return undefined;
        }
        return new vscode.FileDecoration(badge, 'SVG');
      },
      () => undefined,
    );
  }
}

class SvgOutlineProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    if (!document.fileName.toLowerCase().endsWith('.svg')) {
      return [];
    }
    return parseOutline(document.getText()).map(toSymbol);
  }
}

function toSymbol(node: OutlineNode): vscode.DocumentSymbol {
  const start = new vscode.Position(node.startLine, node.startCharacter);
  const end = new vscode.Position(node.endLine, node.endCharacter);
  const range = new vscode.Range(start, end);
  const symbol = new vscode.DocumentSymbol(node.name, '', vscode.SymbolKind.Object, range, range);
  symbol.children = node.children.map(toSymbol);
  return symbol;
}
