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
   c. Unsplash 搜图（为新实体配图）
   d. 生成推荐（如有新地点）
   e. export_data.py
   f. publish.py（git add + commit + push）
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

## 规则 5：实体配图（Unsplash）

每当新增或更新实体时，**必须通过 Unsplash 为实体搜索一张高质量配图**。

### 搜图规则

1. **搜索关键词**：使用实体的英文 alias（或 id 的英文翻译）作为搜索词，优先加上地理限定词。例如：
   - 帝王谷 → `"Valley of the Kings Egypt"`
   - 科什里 → `"Koshari Egyptian food"`
   - 图坦卡蒙 → `"Tutankhamun mask"`

2. **图片选择**：选择最能代表该实体的一张照片（优先选有辨识度的、构图好的）

3. **存储位置**：图片 URL 写入实体 frontmatter 的 `image` 字段：
   ```yaml
   image: "https://images.unsplash.com/photo-xxxxx?w=800&q=80"
   imageCredit: "Photo by Name on Unsplash"
   imageSource: unsplash
   ```

4. **URL 格式**：使用 Unsplash 的 raw URL 并附加 `?w=800&q=80` 参数控制尺寸和质量

5. **归属声明**：必须记录摄影师署名到 `imageCredit` 字段

6. **批量处理**：如果一轮对话新增多个实体，为每个实体都搜图

### ⚠️ Unsplash 搜图踩坑记录（强制遵守）

以下是实际操作中遇到的问题和解决方案，**必须按此执行**：

#### 坑 1：Unsplash API 需要有效的 Client-ID

- **现象**：直接调用 `api.unsplash.com` 返回 `401 Unauthorized`
- **原因**：需要注册 Unsplash Developer 应用获取 Access Key
- **解决方案**：不依赖 API，改用 **WebSearch 搜索 + 直链验证** 的方式：
  1. 用 WebSearch 搜索 `site:unsplash.com {英文关键词}`
  2. 从搜索结果中获取 Unsplash 图片页面
  3. 构造 `https://images.unsplash.com/photo-{ID}?w=800&q=80` 格式 URL
  4. 用 HEAD 请求验证 URL 可访问（200）

#### 坑 2：Unsplash 网页有反爬 bot 验证

- **现象**：WebFetch 直接抓取 `unsplash.com/s/photos/xxx` 返回验证页面（Anubis）
- **解决方案**：**不要用 WebFetch 抓 Unsplash 网页**。改用以下方法：
  - 直接构造 `images.unsplash.com/photo-{ID}` URL（CDN 无反爬）
  - 通过 WebSearch 间接获取图片 ID
  - 使用已知有效的 Unsplash photo ID 库

#### 坑 3：随意编造 photo ID 大概率 404

- **现象**：凭记忆或推测构造的 `photo-xxxx` URL 约 30-40% 会 404
- **解决方案**：**必须逐个 HEAD 请求验证**。流程：
  ```python
  req = urllib.request.Request(url, method='HEAD')
  req.add_header('User-Agent', 'Mozilla/5.0')
  resp = urllib.request.urlopen(req, timeout=8)
  # 只有 status==200 才写入 entity
  ```
  对于 404 的，更换备选 ID 重试。

#### 坑 4：禁止盲目复用图片

- **错误做法**：把同一张图配给多个不相关实体（如金字塔图配给帝王谷）
- **正确策略**：
  - **每个实体必须有独立的、内容匹配的配图**
  - 如果确实找不到某实体的专属照片，**宁可留空（image: null）也不要配错图**
  - 同一张图最多允许被 2 个**高度相关**的实体共用（如胡夫+吉萨金字塔群）
  - 人物实体：搜索其雕像/浮雕/面具照片，而非随意用某个景点图
  - 地点实体：必须搜索该地点本身的照片

#### 坑 6：配图内容正确性验证（最重要！）

- **现象**：URL 返回 200 但图片内容和实体完全不匹配
- **根本原因**：只验证了链接可用性，没验证内容是否正确
- **强制规则**：
  1. **必须用 WebFetch/Read 实际查看图片**，确认内容与实体匹配
  2. 或者使用**来源可追溯**的图片——通过 WebSearch 搜索 `unsplash.com {实体英文名}` 获取的结果页中的图片，其内容天然匹配
  3. **禁止凭记忆/猜测 photo ID**——你不知道某个 ID 对应什么内容
  4. **禁止批量用同一张图**——每个实体必须独立搜索
  5. 配图后必须自检：「这张图片展示的是不是这个实体本身？」

- **正确流程**：
  ```
  WebSearch "unsplash {entity english name}" 
  → 从结果中找到 unsplash.com/photos/xxx 页面
  → 提取 photo ID
  → 构造 URL 并 HEAD 验证
  → WebFetch 该 unsplash 照片页确认描述匹配
  → 写入 entity
  ```

- **宁缺毋滥**：找不到正确配图就设 `image: null`，绝不配错图

#### 坑 5：`site:unsplash.com` 搜索不一定返回 Unsplash 结果

- **现象**：搜索引擎结果可能不包含 Unsplash 页面
- **解决方案**：维护一份**已验证的 Unsplash photo ID 参考库**（按主题分类），优先从库中取用：

```
# 埃及相关已验证 photo ID（2026-04-30 验证通过）
金字塔/吉萨:    photo-1503177119275-0aa32b3a9368 (Simon Berger)
狮身人面像:     photo-1539650116574-8efeb43e2750 (Fynn Schmidt)
卢克索/神庙:    photo-1565967511849-76a60a516170 (Spencer Davis)
卡尔纳克:       photo-1599423300746-b62533397364 (Fynn Schmidt)
帝王谷/陵墓:    photo-1553913861-c0fddf2619ee (Jeremy Zero)
开罗:           photo-1572252009286-268acec5ca0a (Omar Elsharawy)
开罗清真寺:     photo-1560611588-163f295eb145 (Omar Elsharawy)
赫尔格达/红海:  photo-1544551763-46a013bb70d5 (Sebastian Pena Lambarri)
热气球:         photo-1545156521-77bd85671d30 (Ian Dooley)
帆船/尼罗河:    photo-1547471080-7cc2caa01a7e (Simon Berger)
沙滩/海岛:      photo-1507525428034-b723cf961d3e (Sean Oulashin)
图坦卡蒙:       photo-1594322436404-5a0526db4d13 (Robert Bhatt)
丹德拉/古迹:    photo-1562979314-bee7453e911c (Fynn Schmidt)
博物馆/室内:    photo-1569230919100-d3fd5e1132f4 (Fynn Schmidt)
```

#### 最佳实践总结

```
1. WebSearch 搜索 "unsplash.com {实体英文名}" 获取真实图片页
2. 从搜索结果中提取 photo ID
3. 构造 URL: https://images.unsplash.com/photo-{ID}?w=800&q=80
4. HEAD 请求验证 200
5. 404 → 重新搜索，不要随意替换为其他图
6. ⚠️ 内容验证：确认图片展示的确实是该实体
7. 写入 entity frontmatter (image / imageCredit / imageSource)
8. 找不到正确图 → 设 image: null，不配错图
9. 新发现的有效 ID 追加到参考库（标注实际内容描述）
```

#### 参考库格式要求

```
# 格式：photo-ID (摄影师) — 实际图片内容描述
# 只有确认过内容的才能入库
photo-1503177119275-0aa32b3a9368 (Simon Berger) — 吉萨三座金字塔远景
photo-1545156521-77bd85671d30 (Ian Dooley) — 热气球升空
photo-1544551763-46a013bb70d5 (Sebastian Pena Lambarri) — 红海蓝色水面
photo-1572252009286-268acec5ca0a (Omar Elsharawy) — 开罗城市天际线+清真寺
photo-1594322436404-5a0526db4d13 (Robert Bhatt) — 图坦卡蒙金面具特写
```

---

## 规则 6：Commit message 格式

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
- [ ] Unsplash 搜图配图（新实体）✅
- [ ] geocode 新地点 ✅
- [ ] 生成推荐（如有新地点）✅
- [ ] export_data.py 重建 trip.json ✅
- [ ] publish.py push 到远端 ✅

---

*最后更新：2026-04-30T13:00+08:00*
