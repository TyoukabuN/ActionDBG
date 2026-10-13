import type { CardId } from './combat';

export const CARD_NAMES: Record<CardId, string> = { quick: '快斩', heavy: '重斩', guard: '格挡', counter: '反击' };
export const CARD_DESCRIPTIONS: Record<CardId, string> = {
  quick: '造成 1 点伤害。', heavy: '造成 3 点伤害，下一回合冷却。',
  guard: '本回合下次受击减伤 2 点。', counter: '取消敌方攻击并造成 2 点伤害，下一回合冷却。',
};
export const SHOT_NAMES: Record<string, string> = {
  overview: '开场镜头', 'enemy-windup': '敌方起手', decision: '应对时刻',
  'quick-strike': '快斩', 'heavy-strike': '重斩', guard: '格挡',
  'counter-window': '反击时刻', parry: '反击成功', 'enemy-strike': '敌方出招',
  impact: '命中', victory: '胜利', defeat: '失败',
};

/** Translate presentation text while preserving the simulation's event format. */
export function chineseText(text: string): string {
  const exact: Record<string, string> = {
    'Quick Strike': '快斩', 'Heavy Strike': '重斩', Counter: '反击', Guard: '格挡', 'Enemy attack': '敌方攻击',
    'Encounter started. Light attack incoming for 2 damage.': '对决开始，敌方轻攻击将造成 2 点伤害。',
    'Planning skipped.': '已结束普通选牌。', 'Planning window expired.': '选牌时间结束。',
    'Counter window open.': '反击时机开启。', 'Counter window expired.': '反击时间结束。',
    'Counter skipped.': '已放弃反击。', 'Counter cancels the incoming attack.': '反击成功，敌方攻击已取消。',
    'Incoming attack cancelled.': '敌方攻击已取消。',
    'Guard is ready to reduce the next hit by 2.': '已架起格挡，下次受击减伤 2 点。',
    'Guard absorbs the full attack · 0 damage taken.': '格挡完全抵御攻击 · 未受伤。',
    'Victory.': '胜利。', 'Defeat.': '失败。', 'Unknown card.': '未知卡牌。',
    'Combat has ended.': '对战已结束。', 'Combat is paused.': '对战已暂停。',
    'Card selection is unavailable in this phase.': '当前阶段无法出牌。',
    'Only Counter is available during the counter phase.': '反击阶段只能使用反击。',
    'Counter is only available during the counter phase.': '仅在反击阶段可用。',
    'Not enough action points.': '行动点不足。',
  };
  if (exact[text]) return exact[text];
  let match = text.match(/^On cooldown until round (\d+)\.$/);
  if (match) return `冷却中，第 ${match[1]} 回合可用。`;
  match = text.match(/^Committed: (.+)\.$/);
  if (match) return `已出牌：${match[1].split(', ').map(chineseText).join('、')}。`;
  match = text.match(/^(?:Round (\d+)\. |Enemy )(light|heavy) attack incoming for (\d+) damage\.$/);
  if (match) return `${match[1] ? `第 ${match[1]} 回合，` : ''}敌方${match[2] === 'light' ? '轻攻击' : '重攻击'}将造成 ${match[3]} 点伤害。`;
  match = text.match(/^(.+) deals (\d+) damage to the (enemy|player) \((\d+) HP left\)\.$/);
  if (match) return `${chineseText(match[1])}对${match[3] === 'enemy' ? '敌人' : '你'}造成 ${match[2]} 点伤害（剩余生命 ${match[4]}）。`;
  match = text.match(/^Enemy attack: (\d+) damage guarded\.$/);
  if (match) return `格挡抵御了 ${match[1]} 点敌方伤害。`;
  return text;
}
