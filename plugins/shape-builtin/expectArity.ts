import { UsageError } from '../../src/commands/UsageError';

export function expectArity(
  params: string[],
  minimum: number,
  maximum: number,
  usage: string,
): void {
  if (params.length < minimum || params.length > maximum) {
    throw new UsageError(usage);
  }
}
