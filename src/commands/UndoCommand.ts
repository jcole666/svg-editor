import type { Session } from '../app/Session';
import { NothingToUndoError } from '../app/NothingToUndoError';
import { UndoNotAllowedError } from '../app/UndoNotAllowedError';
import type { Command } from './Command';

/**
 * undo —— 撤销上一次编辑命令（§3）。
 *
 * P5 第一版基于快照：整份文档换回上一个快照。
 * 换回后连"哪条命令被撤销"都不知道，所以反馈只能是笼统的一句——
 * 这正是下一版要重构成 Command 模式的原因。
 */
export class UndoCommand implements Command {
  constructor(private readonly session: Session) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.session.history.isIoBlocked) {
      throw new UndoNotAllowedError();
    }

    const restored = this.session.history.undo(document);
    if (restored === null) {
      throw new NothingToUndoError();
    }

    this.session.setDocument(restored);
    return ['undo: restored previous snapshot'];
  }
}
