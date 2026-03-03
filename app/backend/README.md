# backend 最小骨架（小许）

已实现模块：

1. `engine/board.js`
   - 棋盘基础常量
   - 初始局面数据
   - 基础工具函数

2. `engine/rules.js`
   - 规则引擎骨架 `XiangqiRuleEngine`
   - `validateMove` 合法走子占位校验（边界、回合、同阵营占位）
   - `applyMove` 状态推进

3. `ai/levels.js`
   - AI 三档策略占位：`easy / medium / hard`
   - easy: 随机
   - medium: 吃子优先
   - hard: 预留搜索入口（当前占位）

4. `state/gameSession.js`
   - 对局状态管理 `GameSessionStore`
   - create/get/list/applyMove/undo

5. `api/draft.js`
   - 对局状态管理 API 草案（函数式接口）
   - 会话创建、走子、AI落子、悔棋、查询

## 下一步建议
- 补齐各棋子完整走法与将军/绝杀判定
- 将 AI 的候选走法来源切换为规则引擎合法步生成
- 加入最小单元测试（规则 + 会话 + AI）
