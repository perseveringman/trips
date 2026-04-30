# Agent 工作流强制规则

> **本文件是每一轮对话的强制约束。Agent 必须在每次响应时读取并遵守。**

---

## 规则 1：先回答，后处理

每次用户提问时，**必须先直接回答用户的问题**（提供有价值的内容、建议、信息），然后再执行后台的数据结构化工作（实体抽取、wiki 更新、推荐生成等）。

**禁止**：先跑脚本/处理数据，让用户等着看技术输出。
**正确顺序**：

```
1. 理解用户意图
2. 直接给出有内容的回答
3. （回答之后）执行 Track A 后台流程：
   a. 抽取实体 → ingest.py upsert
   b. geocode.py（如有新地点）
   c. 生成推荐（如有新地点）
   d. export_data.py
   e. publish.py（git add + commit + push）
```

---

## 规则 2：每轮对话必须 push 到远端

每一次对话完成后台处理后，**必须执行 `publish.py`** 将变更推送到 GitHub 远端仓库，触发 Vercel 自动重新部署。

```bash
python3 scripts/publish.py --trip-root trips/<active-slug>
```

**没有例外**。即使只更新了 session-log 也要 push。

---

## 规则 3：Session log 持续追加

每一轮对话（user + assistant）都必须追加到当前 trip 的 `.trip/session-log.jsonl`：

```jsonl
{"t": "ISO8601", "role": "user", "text": "用户的原始消息"}
{"t": "ISO8601", "role": "assistant", "text": "助手回答的摘要（不超过 200 字）"}
```

---

## 规则 4：实体抽取条件

只要对话中涉及以下内容，就必须执行实体抽取并更新 wiki：

- 新的地点、景点、餐厅、酒店
- 新的历史人物、事件、文化概念
- 对已有实体的补充信息（新 facts、新 relations）
- 用户的行程变更或新增

如果对话纯粹是闲聊/确认/没有新信息，可以跳过抽取但仍需更新 session-log 并 push。

---

## 规则 5：Commit message 格式

```
trip(<slug>): <简短描述本轮新增/变更了什么>
```

示例：
- `trip(egypt-2026-05): 新增赫尔格达美食推荐 6 道 + 6 家餐厅`
- `trip(egypt-2026-05): 补充卡尔纳克神庙拍摄建议`
- `trip(egypt-2026-05): session log only — 闲聊无新实体`

---

## 执行清单（每轮必过）

- [ ] 先回答用户 ✅
- [ ] 追加 session-log ✅
- [ ] 抽取新实体（如有）✅
- [ ] 更新 wiki/entities/ ✅
- [ ] geocode 新地点 ✅
- [ ] 生成推荐（如有新地点）✅
- [ ] export_data.py 重建 trip.json ✅
- [ ] publish.py push 到远端 ✅

---

*最后更新：2026-04-30*
