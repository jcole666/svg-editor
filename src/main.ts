import { Repl } from './cli/Repl';

function main(): void {
  const repl = new Repl();
  void repl.start();
}

main();
