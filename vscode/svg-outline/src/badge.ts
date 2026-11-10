/** 资源管理器里要不要给这个路径加 []。目录一律不加。 */
export function badgeFor(filePath: string, isDirectory: boolean): string | undefined {
  if (isDirectory) {
    return undefined;
  }
  if (filePath.toLowerCase().endsWith('.svg')) {
    return '[]';
  }
  return undefined;
}
