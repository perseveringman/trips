// ── 跨文明对比时间轴：静态数据 ──

export interface CivEvent {
  year: number;       // 负数 = BC
  summary: string;    // 中文描述
  relation?: string;  // 与埃及的关联说明（可选）
}

export interface Civilization {
  id: string;
  name: string;
  emoji: string;
  color: string;
  startYear: number;
  endYear: number;
  events: CivEvent[];
}

// ── 两河流域 / 美索不达米亚 ──

const MESOPOTAMIA: Civilization = {
  id: "mesopotamia",
  name: "两河流域",
  emoji: "🏺",
  color: "#6b4c8a",
  startYear: -3500,
  endYear: -539,
  events: [
    { year: -3500, summary: "苏美尔城邦兴起（乌鲁克）", relation: "与埃及同期进入文明时代" },
    { year: -3200, summary: "楔形文字发明" },
    { year: -2334, summary: "萨尔贡统一两河流域，建立阿卡德帝国" },
    { year: -2112, summary: "乌尔第三王朝建立" },
    { year: -1894, summary: "古巴比伦王国建立" },
    { year: -1792, summary: "汉谟拉比颁布法典" },
    { year: -1595, summary: "赫梯人洗劫巴比伦" },
    { year: -1500, summary: "加喜特人统治巴比伦" },
    { year: -1350, summary: "阿马尔纳信件：巴比伦与埃及外交通信", relation: "与阿肯那顿时期埃及直接外交往来" },
    { year: -1225, summary: "亚述国王图库尔提-尼努尔塔一世攻占巴比伦" },
    { year: -911, summary: "新亚述帝国兴起" },
    { year: -853, summary: "卡尔卡尔战役（亚述 vs 埃及联军）", relation: "埃及参加反亚述联盟" },
    { year: -671, summary: "亚述征服埃及（以萨尔哈东）", relation: "亚述首次直接统治埃及" },
    { year: -663, summary: "亚述巴尼拔洗劫底比斯", relation: "底比斯遭到毁灭性打击" },
    { year: -626, summary: "新巴比伦帝国建立（那波帕拉萨尔）" },
    { year: -605, summary: "尼布甲尼撒二世在卡尔凯美什击败埃及", relation: "埃及失去叙利亚-巴勒斯坦影响力" },
    { year: -586, summary: "尼布甲尼撒二世摧毁耶路撒冷圣殿" },
    { year: -539, summary: "居鲁士大帝征服巴比伦，两河文明终结" },
  ],
};

// ── 赫梯 ──

const HITTITE: Civilization = {
  id: "hittite",
  name: "赫梯",
  emoji: "⚔️",
  color: "#8b4513",
  startYear: -1600,
  endYear: -1100,
  events: [
    { year: -1600, summary: "赫梯古王国在安纳托利亚建立" },
    { year: -1595, summary: "赫梯洗劫巴比伦" },
    { year: -1500, summary: "赫梯中王国时期" },
    { year: -1430, summary: "图特哈里亚一世扩张帝国版图" },
    { year: -1380, summary: "苏庇路里乌玛一世登基，帝国鼎盛" },
    { year: -1350, summary: "苏庇路里乌玛征服米坦尼王国", relation: "削弱了埃及在叙利亚的盟友" },
    { year: -1327, summary: "埃及王后请求赫梯王子（赞南扎事件）", relation: "图坦卡蒙去世后，王后写信给赫梯求婚" },
    { year: -1295, summary: "穆瓦塔里二世即位" },
    { year: -1274, summary: "卡迭什战役（拉美西斯二世 vs 赫梯）", relation: "古代史上最大规模战车会战" },
    { year: -1259, summary: "埃及-赫梯和约（人类最早和约）", relation: "拉美西斯二世与赫梯签订银板条约" },
    { year: -1245, summary: "赫梯公主嫁给拉美西斯二世", relation: "埃及-赫梯联姻和平" },
    { year: -1237, summary: "图特哈里亚四世即位" },
    { year: -1210, summary: "苏庇路里乌玛二世（末代大王）" },
    { year: -1200, summary: "青铜时代崩溃开始", relation: "海上民族同时威胁赫梯和埃及" },
    { year: -1190, summary: "海上民族攻击赫梯本土" },
    { year: -1178, summary: "赫梯帝国崩溃灭亡" },
    { year: -1100, summary: "新赫梯城邦在叙利亚延续" },
  ],
};

// ── 古希腊 ──

const GREECE: Civilization = {
  id: "greece",
  name: "古希腊",
  emoji: "🏛️",
  color: "#2e86ab",
  startYear: -2700,
  endYear: -146,
  events: [
    { year: -2700, summary: "米诺斯文明在克里特岛兴起" },
    { year: -2000, summary: "克诺索斯宫殿群建造" },
    { year: -1600, summary: "迈锡尼文明兴起" },
    { year: -1450, summary: "迈锡尼人征服克里特" },
    { year: -1250, summary: "特洛伊战争（传统年代）" },
    { year: -1200, summary: "青铜时代崩溃，迈锡尼衰落", relation: "海上民族同期冲击埃及" },
    { year: -1100, summary: "希腊黑暗时代开始" },
    { year: -776, summary: "首届奥林匹克运动会" },
    { year: -750, summary: "荷马创作《伊利亚特》和《奥德赛》" },
    { year: -620, summary: "瑙克拉提斯：希腊人在埃及建立贸易殖民地", relation: "希腊与埃及直接贸易" },
    { year: -594, summary: "梭伦在雅典推行改革" },
    { year: -490, summary: "马拉松战役（希腊击败波斯）" },
    { year: -480, summary: "温泉关和萨拉米斯海战" },
    { year: -447, summary: "帕特农神庙开始建造" },
    { year: -338, summary: "腓力二世统一希腊" },
    { year: -332, summary: "亚历山大大帝征服埃及", relation: "开启埃及希腊化时代" },
    { year: -323, summary: "亚历山大去世，部将瓜分帝国", relation: "托勒密获得埃及" },
    { year: -305, summary: "托勒密一世在埃及建立王朝", relation: "希腊人直接统治埃及近300年" },
    { year: -197, summary: "罗塞塔石碑法令颁布", relation: "用希腊文和埃及文记录" },
    { year: -168, summary: "罗马击败马其顿" },
    { year: -146, summary: "罗马摧毁科林斯，希腊并入罗马" },
  ],
};

// ── 波斯 ──

const PERSIA: Civilization = {
  id: "persia",
  name: "波斯",
  emoji: "🦁",
  color: "#c0392b",
  startYear: -550,
  endYear: 651,
  events: [
    { year: -550, summary: "居鲁士大帝建立阿契美尼德帝国" },
    { year: -539, summary: "居鲁士征服巴比伦" },
    { year: -525, summary: "冈比西斯二世征服埃及", relation: "埃及第一次成为波斯行省" },
    { year: -522, summary: "大流士一世夺取王位" },
    { year: -518, summary: "大流士开通尼罗河-红海运河", relation: "在埃及境内完成苏伊士运河前身" },
    { year: -490, summary: "第一次波希战争（马拉松）" },
    { year: -480, summary: "薛西斯入侵希腊（温泉关）" },
    { year: -404, summary: "埃及起义，脱离波斯独立", relation: "埃及恢复本土王朝统治" },
    { year: -343, summary: "阿尔塔薛西斯三世重新征服埃及", relation: "埃及再次成为波斯行省" },
    { year: -334, summary: "亚历山大入侵波斯帝国" },
    { year: -330, summary: "阿契美尼德帝国灭亡" },
    { year: -247, summary: "帕提亚帝国建立" },
    { year: 224, summary: "萨珊帝国建立" },
    { year: 260, summary: "沙普尔一世俘虏罗马皇帝瓦勒良" },
    { year: 363, summary: "尤利安远征波斯失败" },
    { year: 531, summary: "库萨和一世统治（黄金时代）" },
    { year: 602, summary: "拜占庭-萨珊战争爆发" },
    { year: 619, summary: "萨珊波斯短暂征服埃及", relation: "波斯从拜占庭手中夺取埃及" },
    { year: 628, summary: "拜占庭收复埃及", relation: "波斯撤出埃及" },
    { year: 651, summary: "阿拉伯征服终结萨珊帝国" },
  ],
};

// ── 罗马 ──

const ROME: Civilization = {
  id: "rome",
  name: "罗马",
  emoji: "🐺",
  color: "#8b0000",
  startYear: -753,
  endYear: 641,
  events: [
    { year: -753, summary: "罗马建城（传统年代）" },
    { year: -509, summary: "罗马共和国建立" },
    { year: -264, summary: "第一次布匿战争开始" },
    { year: -146, summary: "罗马摧毁迦太基" },
    { year: -48, summary: "凯撒追击庞培到埃及", relation: "罗马内战扩展到埃及" },
    { year: -47, summary: "凯撒与克利奥帕特拉结盟", relation: "凯撒帮助克利奥夺回王位" },
    { year: -44, summary: "凯撒遇刺" },
    { year: -31, summary: "亚克兴海战（屋大维 vs 安东尼-克利奥）", relation: "决定埃及命运的最终战役" },
    { year: -30, summary: "埃及成为罗马行省", relation: "克利奥帕特拉自杀，埃及托勒密王朝终结" },
    { year: -27, summary: "奥古斯都成为首位罗马皇帝" },
    { year: 30, summary: "耶稣被钉十字架" },
    { year: 69, summary: "四帝之年" },
    { year: 70, summary: "提图斯摧毁耶路撒冷第二圣殿" },
    { year: 117, summary: "图拉真治下罗马帝国版图最大" },
    { year: 130, summary: "哈德良访问埃及，安提诺乌斯溺亡尼罗河", relation: "哈德良在尼罗河畔建城纪念" },
    { year: 212, summary: "卡拉卡拉授予全体自由民公民权" },
    { year: 284, summary: "戴克里先改革；迫害埃及基督徒", relation: "科普特历纪元起点" },
    { year: 313, summary: "米兰敕令：基督教合法化" },
    { year: 380, summary: "基督教成为罗马国教" },
    { year: 395, summary: "罗马帝国东西分裂" },
    { year: 476, summary: "西罗马帝国灭亡" },
    { year: 641, summary: "阿拉伯人从拜占庭手中夺取埃及", relation: "罗马/拜占庭对埃及近700年统治终结" },
  ],
};

// ── 努比亚 / 库什 ──

const NUBIA: Civilization = {
  id: "nubia",
  name: "努比亚/库什",
  emoji: "🌍",
  color: "#2d6a4f",
  startYear: -2500,
  endYear: 350,
  events: [
    { year: -2500, summary: "凯尔迈王国建立" },
    { year: -2300, summary: "凯尔迈发展为区域强国", relation: "与埃及古王国南部边境对峙" },
    { year: -1970, summary: "埃及中王国征服努比亚", relation: "埃及法老修建系列南方要塞" },
    { year: -1550, summary: "埃及新王国全面控制努比亚", relation: "努比亚黄金成为埃及帝国经济支柱" },
    { year: -1500, summary: "努比亚黄金为埃及帝国提供财富", relation: "埃及在努比亚建造神庙（阿布辛贝）" },
    { year: -1100, summary: "库什王国在埃及撤退后重新崛起" },
    { year: -850, summary: "库什首都迁至纳帕塔" },
    { year: -750, summary: "卡什塔征服上埃及", relation: "努比亚开始北上统治埃及" },
    { year: -713, summary: "沙巴卡统一埃及和库什（第二十五王朝）", relation: "努比亚法老统治整个埃及" },
    { year: -671, summary: "亚述将库什人逐出埃及", relation: "努比亚法老退回南方" },
    { year: -590, summary: "库什首都迁至麦罗埃" },
    { year: -530, summary: "麦罗埃文字发展" },
    { year: -23, summary: "罗马-库什战争；萨摩斯条约", relation: "罗马埃及与库什划定边界" },
    { year: 0, summary: "麦罗埃文明鼎盛时期" },
    { year: 100, summary: "麦罗埃冶铁工业达到顶峰" },
    { year: 250, summary: "麦罗埃开始衰落" },
    { year: 330, summary: "阿克苏姆王国入侵" },
    { year: 350, summary: "库什王国终结" },
  ],
};

/** 除埃及外的 6 个文明（埃及在运行时从 trip.json 构建） */
export const OTHER_CIVILIZATIONS: Civilization[] = [
  MESOPOTAMIA,
  HITTITE,
  GREECE,
  PERSIA,
  ROME,
  NUBIA,
];

/** 时间轴全局范围 */
export const MIN_YEAR = -3500;
export const MAX_YEAR = 2100;
export const BASE_WIDTH = 5600; // px at zoom=1 (≈1px per year)
