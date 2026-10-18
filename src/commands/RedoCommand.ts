import type { Session } from '../app/Session';
import { NothingToRedoError } from '../app/NothingToRedoError';
import { UndoNotAllowedError } from '../app/UndoNotAllowedError';
import type { Command } from './Command';

/** redo —— 重做（§3）。快照版同样是"整份文档换回去"。 */
export class RedoCommand implements Command {
  constructor(private readonly session: Session) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.session.history.isIoBlocked) {
      throw new UndoNotAllowedError();
    }

    const restored = this.session.history.redo(document);
    if (restored === null) {
      throw new NothingToRedoError();
    }

    this.session.setDocument(restored);
    return ['redo: restored next snapshot'];
  }
}
