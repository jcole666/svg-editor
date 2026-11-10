# 规模

由 `scripts/metrics.mjs` 对比 `final` 和 `HEAD` 生成，没有手填。
只数 `.ts` 源文件。测试、`node_modules`、`dist` 不算。VSCode 扩展单独列，不进 CLI 的增量。
圈复杂度按「1 + if / for / while / case / catch / && / || / ?」计，先去掉注释。

| 分类 | final 行数 | HEAD 行数 | 行数差 | final 圈复杂度 | HEAD 圈复杂度 | 圈复杂度差 |
|---|---:|---:|---:|---:|---:|---:|
| 内核 | 3497 | 3670 | 173 | 349 | 400 | 51 |
| 装配处 | 9 | 533 | 524 | 1 | 74 | 73 |
| 插件 | 0 | 662 | 662 | 0 | 78 | 78 |
| VSCode 扩展 | 0 | 255 | 255 | 0 | 47 | 47 |

## 文件

| 文件 | 分类 | 行数 | 圈复杂度 | 文件头注释 |
|---|---|---:|---:|---|
| `plugins/command-dir/DirCommand.ts` | 插件 | 44 | 6 | dir —— 列出进程当前工作目录的直接子项。 |
| `plugins/command-dir/DirectoryListing.ts` | 插件 | 15 | 1 | dir 用的目录访问端口。 |
| `plugins/command-dir/NodeFsDirectoryListing.ts` | 插件 | 21 | 4 | 适配器：把 node:fs 的 Dirent 收成 dir 命令能用的条目。符号链接不跟随。 |
| `plugins/command-dir/index.ts` | 插件 | 26 | 9 |  |
| `plugins/command-stats/StatsCommand.ts` | 插件 | 43 | 7 | stats —— 按当前子节点顺序深度优先数叶子。g 和 box 只算容器。 |
| `plugins/command-stats/index.ts` | 插件 | 14 | 1 |  |
| `plugins/shape-box/Box.ts` | 插件 | 55 | 3 | 带标题的矩形框。序列化仍是 <g data-kind="box">， |
| `plugins/shape-box/BoxAttributeHandler.ts` | 插件 | 40 | 8 | fill 改内部矩形，label 改内部文字。字段仍然封装在子图形里。 |
| `plugins/shape-box/BoxLabel.ts` | 插件 | 14 | 3 | 只给 box 那一行加 (box)。不关心别的标签写了什么。 |
| `plugins/shape-box/BoxProvider.ts` | 插件 | 52 | 9 |  |
| `plugins/shape-box/index.ts` | 插件 | 13 | 1 |  |
| `plugins/shape-builtin/CircleProvider.ts` | 插件 | 38 | 2 |  |
| `plugins/shape-builtin/EllipseProvider.ts` | 插件 | 40 | 2 |  |
| `plugins/shape-builtin/GroupProvider.ts` | 插件 | 30 | 3 |  |
| `plugins/shape-builtin/LineProvider.ts` | 插件 | 40 | 2 |  |
| `plugins/shape-builtin/RectProvider.ts` | 插件 | 40 | 2 |  |
| `plugins/shape-builtin/TextProvider.ts` | 插件 | 29 | 1 |  |
| `plugins/shape-builtin/expectArity.ts` | 插件 | 13 | 3 |  |
| `plugins/shape-builtin/index.ts` | 插件 | 20 | 1 | 六种内置图形。默认启动就会 activate，不依赖 plugins.config.json。 |
| `plugins/tree-modified-star/ModifiedStar.ts` | 插件 | 66 | 9 | 和上次保存（或 init / read 刚完成时）内容不一致的行尾加 *。 |
| `plugins/tree-modified-star/index.ts` | 插件 | 9 | 1 |  |
| `src/app/AttributeSnapshot.ts` | 内核 | 43 | 6 | set 走属性处理器时用的快照。 |
| `src/app/Command.ts` | 内核 | 21 | 2 | 一条命令对"撤销历史"的影响类别。 |
| `src/app/CommandExecutor.ts` | 内核 | 36 | 5 | 命令执行器：Invoker 里"真正把命令跑起来"的那一步。 |
| `src/app/CommandStack.ts` | 内核 | 64 | 5 | 命令栈 —— 撤销 / 重做的核心（对应课件命令模式 p22-25 的两个栈）。 |
| `src/app/GeometrySnapshot.ts` | 内核 | 48 | 6 | 几何快照：记下**一棵子树里每个节点的几何属性值**，用于精确还原。 |
| `src/app/NothingToRedoError.ts` | 内核 | 8 | 1 | 重做栈为空（任务书未规定文案，给出可读提示）。 |
| `src/app/NothingToUndoError.ts` | 内核 | 8 | 1 | 撤销栈为空（任务书未规定文案，给出可读提示）。 |
| `src/app/Session.ts` | 内核 | 52 | 3 | 一次 REPL 会话的状态：当前文档 + 命令栈。 |
| `src/app/UndoNotAllowedError.ts` | 内核 | 11 | 1 | 文档类命令执行后，undo/redo 被禁止。 |
| `src/app/UndoableCommand.ts` | 内核 | 14 | 1 | 可撤销命令：在 Command 之上增加"反向执行"。 |
| `src/cli/ErrorFormatter.ts` | 内核 | 16 | 2 | 把异常转成 CLI 上看到的那一行。 |
| `src/cli/Repl.ts` | 内核 | 111 | 16 | 允许替换输入输出流，方便端到端测试（默认用进程的 stdio）。 |
| `src/cli/Tokenizer.ts` | 内核 | 63 | 11 | 分词器：把一行输入切成参数列表。 |
| `src/commands/AddToCommand.ts` | 内核 | 68 | 6 | addto <gid> <id> —— 把已有图形移入容器（作为最后一个子节点）（§3）。 |
| `src/commands/CanvasCommand.ts` | 内核 | 44 | 4 | canvas [w] [h] —— 无参数显示画布尺寸；带参数修改尺寸。 |
| `src/commands/CreateCommand.ts` | 内核 | 79 | 14 | create <type> <id> [params…] [in <containerId>] |
| `src/commands/DeleteCommand.ts` | 内核 | 47 | 4 | delete <id> —— 删除图形；容器则连同全部子孙一起删。 |
| `src/commands/GroupCommand.ts` | 内核 | 132 | 17 | group <newGid> <id1> <id2>… —— 新建容器并收入若干图形。 |
| `src/commands/HelpCommand.ts` | 内核 | 31 | 2 | help —— 显示全部命令与语法。 |
| `src/commands/InitCommand.ts` | 内核 | 33 | 4 | init [w] [h] —— 新建空画布，作为当前文档（默认 800x600）。 |
| `src/commands/MoveCommand.ts` | 内核 | 76 | 5 | move <id> <dx> <dy> —— 平移（增量）。 |
| `src/commands/ReadCommand.ts` | 内核 | 36 | 2 | read <file.svg> —— 读入 SVG 文件为当前文档（§3）。 |
| `src/commands/RedoCommand.ts` | 内核 | 13 | 1 | redo —— 重做；从 redo 栈取出命令重新执行（§3）。 |
| `src/commands/SaveCommand.ts` | 内核 | 41 | 5 | save [file.svg] —— 保存当前文档；无参数时保存到 read 读入时的路径（§3）。 |
| `src/commands/ScaleCommand.ts` | 内核 | 56 | 4 | scale <id> <factor> —— 等比缩放：factor 同乘到图形的全部几何属性 |
| `src/commands/SetCommand.ts` | 内核 | 98 | 10 | set <id> <attr> <value> —— 设置属性。 |
| `src/commands/ShowCommand.ts` | 内核 | 29 | 2 | show <id> —— 显示单个图形的属性明细。 |
| `src/commands/TreeCommand.ts` | 内核 | 36 | 3 | tree [id] —— 显示结构树；带 id 时只显示以它为根的子树。 |
| `src/commands/UndoCommand.ts` | 内核 | 17 | 1 | undo —— 撤销上一次编辑命令（§3）。 |
| `src/commands/UngroupCommand.ts` | 内核 | 102 | 12 | ungroup <gid> —— 解散容器，子图形提升到原容器的父级、占据原容器的位置（§3）。 |
| `src/commands/UsageError.ts` | 内核 | 11 | 1 | 参数个数 / 形式不符合语法。 |
| `src/commands/ZOrderCommand.ts` | 内核 | 62 | 5 | front <id> / back <id> —— 调整同级 z-order：放到最前 / 最后（§3）。 |
| `src/extension/AttributeHandler.ts` | 内核 | 18 | 1 | apply 成功后要给用户看的两句。undo 用 undoSummary，不再自己猜改了什么。 |
| `src/extension/AttributeRegistry.ts` | 内核 | 31 | 3 | 属性处理器表。命中几个由 SetCommand 决定，这里只负责按注册顺序收集。 |
| `src/extension/CommandRegistry.ts` | 内核 | 30 | 2 | 命令注册表。内核只按名字取出规格再调用，不 import 具体命令类。 |
| `src/extension/CommandSpec.ts` | 内核 | 14 | 1 | 一条命令的规格：名字、help 文案、怎么造出命令对象。 |
| `src/extension/ConflictingAttributeHandlerError.ts` | 内核 | 8 | 1 | 一次 set 命中了两个处理器。按 ADR 的约定直接拒绝，不执行任何一个。 |
| `src/extension/DecoratorRegistry.ts` | 内核 | 30 | 3 | 树标签表。all() 的顺序就是行尾拼接的顺序。 |
| `src/extension/DuplicateRegistrationError.ts` | 内核 | 8 | 1 | 同一类扩展点里名字撞了。加载器捕获后打印，并撤回这个插件已经登记的东西。 |
| `src/extension/ElementView.ts` | 内核 | 12 | 1 | 读 SVG 时插件能看到的元素。XmlElement 满足这个形状， |
| `src/extension/ExtensionHub.ts` | 内核 | 26 | 1 | 一次进程里的四张表加会话。组合根和加载器共用它，命令执行时从这里取。 |
| `src/extension/PluginContext.ts` | 内核 | 18 | 1 | 插件 activate 时拿到的上下文。 |
| `src/extension/ShapeCatalog.ts` | 内核 | 73 | 14 | 图形类型注册表。create 按 typeName 找，read 先看 data-kind，没有再按标签。 |
| `src/extension/ShapeProvider.ts` | 内核 | 17 | 1 | 一种图形类型。create 和 read 都走它。 |
| `src/extension/TreeDecorator.ts` | 内核 | 18 | 1 | shape 为 null 时是最上面那行 `svg (800x600)`。 |
| `src/host/PluginLoader.ts` | 装配处 | 329 | 65 | 配置装配。不写死任何一个插件的名字或 import。 |
| `src/host/builtinHub.ts` | 装配处 | 12 | 1 | 不加载可选插件时的默认装配：六种图形 + 19 条命令。 |
| `src/host/codePlugins.ts` | 装配处 | 19 | 3 | 方式 A 要装的可选插件。顺序就是注册顺序，也是树标签的拼接顺序。 |
| `src/host/registerBuiltins.ts` | 装配处 | 146 | 1 | 把 Phase 1 的 19 条命令登记进注册表。 |
| `src/io/CannotReadFileError.ts` | 内核 | 11 | 1 | 读取 SVG 文件失败。 |
| `src/io/CannotWriteFileError.ts` | 内核 | 11 | 1 | 写出 SVG 文件失败。 |
| `src/io/ReadRejectedError.ts` | 内核 | 11 | 1 | 读入时插件明确拒绝整份文件（比如 box 缺了子部件）。 |
| `src/io/SvgReader.ts` | 内核 | 164 | 25 | 自动补 id 等提示，按出现顺序返回。 |
| `src/io/SvgWriter.ts` | 内核 | 25 | 4 | 把 Document 写成 SVG 文件（序列化）。 |
| `src/io/XmlElement.ts` | 内核 | 20 | 1 | 解析出来的 XML 元素节点（只保留 SVG 子集需要的信息）。 |
| `src/io/XmlParser.ts` | 内核 | 206 | 47 | 极简 XML 解析器：只覆盖 SVG 文件实际需要的子集。 |
| `src/io/svgValues.ts` | 内核 | 26 | 6 | 几何属性缺省按 0，和 SVG 的默认值一致。解析不了也按 0，避免读入中途崩掉。 |
| `src/main.ts` | 装配处 | 27 | 4 |  |
| `src/model/CannotGroupDescendantError.ts` | 内核 | 11 | 1 | 试图把一个容器和它自己的子孙分到同一组（会造成"自己包含自己"）。 |
| `src/model/CannotModifyCompositeError.ts` | 内核 | 11 | 1 | 想把 box 的矩形或文字单独删掉、挪走。 |
| `src/model/CannotUngroupCompositeError.ts` | 内核 | 11 | 1 | ungroup 打到 box 这类复合图形上。 |
| `src/model/CannotUngroupTopLevelError.ts` | 内核 | 11 | 1 | 画布根级的容器不能 ungroup（§4.2）。 |
| `src/model/Circle.ts` | 内核 | 92 | 7 | <circle id cx cy r> |
| `src/model/Document.ts` | 内核 | 233 | 22 | 某个图形在树中的位置。 |
| `src/model/DuplicateIdError.ts` | 内核 | 11 | 1 | 图形 id 重复。 |
| `src/model/Ellipse.ts` | 内核 | 102 | 9 | <ellipse id cx cy rx ry> |
| `src/model/Group.ts` | 内核 | 119 | 12 | <g> 容器 —— Composite 模式里的"组合"节点。 |
| `src/model/InvalidNumberError.ts` | 内核 | 11 | 1 | 数值参数无法解析时抛出（例如 set rect x abc）。 |
| `src/model/InvalidScaleFactorError.ts` | 内核 | 11 | 1 | scale 的因子必须为正数。 |
| `src/model/Line.ts` | 内核 | 102 | 9 | <line id x1 y1 x2 y2> |
| `src/model/NoDocumentError.ts` | 内核 | 11 | 1 | 还没有 init / read 就执行需要文档的命令。 |
| `src/model/NoSuchContainerError.ts` | 内核 | 11 | 1 | `in <containerId>` 指向的 id 不存在。 |
| `src/model/NoSuchShapeError.ts` | 内核 | 11 | 1 | 用 id 定位图形但不存在。 |
| `src/model/NotAContainerError.ts` | 内核 | 11 | 1 | `in <containerId>` 指向的图形存在，但不是容器（<g>）。 |
| `src/model/Rect.ts` | 内核 | 102 | 9 | <rect id x y width height> |
| `src/model/Shape.ts` | 内核 | 288 | 18 | 所有图形的抽象基类。 |
| `src/model/TextShape.ts` | 内核 | 95 | 7 | <text id x y>内容</text> |
| `src/model/UnknownAttributeError.ts` | 内核 | 11 | 1 | 属性不在 set 命令的白名单里时抛出。 |
| `src/model/UnknownShapeTypeError.ts` | 内核 | 11 | 2 | create 的类型名不在工厂注册表里。 |
| `src/view/ShapeDetailRenderer.ts` | 内核 | 19 | 3 | show 命令的文本渲染（对齐任务书 §5.2）。 |
| `src/view/TreeRenderer.ts` | 内核 | 92 | 11 | tree 命令的文本渲染（对齐任务书 §5.1）。 |
| `vscode/svg-outline/src/badge.ts` | VSCode 扩展 | 11 | 3 | 资源管理器里要不要给这个路径加 []。目录一律不加。 |
| `vscode/svg-outline/src/extension.ts` | VSCode 扩展 | 53 | 4 |  |
| `vscode/svg-outline/src/outline.ts` | VSCode 扩展 | 191 | 40 | 给大纲用的小解析器。XML 不完整时返回空，不把异常抛给 VSCode。 |
