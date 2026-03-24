import locations from '../data/locations.json';
import npcs from '../data/npcs.json';
import dialogue from '../data/dialogues/index';
import shops from '../data/shops.json';
import quests from '../data/quests.json';
import items from '../data/items.json';

const VALID_INTERACTION_ROOTS = new Set(['ask', 'friendly', 'flirt', 'coerce', 'quest']);
const VALID_DIALOGUE_ACTIONS = new Set([
  'trigger_confirmation',
  'trigger_event',
  'set_flag',
  'add_money',
  'remove_money',
  'start_quest',
  'hire_job',
  'try_hire_or_deny',
  'recruit_companion',
  'advance_quest_stage',
  'set_quest_stage',
  'complete_quest',
  'pass_time',
  'trigger_game_over',
  'start_finn_betrayal_combat',
  'grant_item',
  'add_item',
  'remove_item',
  'open_shop',
  'convert_logs_to_planks',
  'offer_debt_payment',
  'start_debt_collection',
  'collect_debt_from',
  'turn_in_debt',
  'turn_in_debt_or_rebuke',
  'start_brawl',
  'enter_temporal_instance',
  'add_xp',
  'social_action',
  'update_relationship',
  'set_relationship',
  'add_known_npc',
]);

function parseAction(action: string): { type: string; params: string[] } {
  const parts = action.split(':');
  const type = parts[0];
  const params = parts.slice(1);
  return { type, params };
}

export class DataValidator {
  static run(): string[] {
    const issues: string[] = [];

    const locationIds = new Set(Object.keys(locations as any));
    const npcIds = new Set(Object.keys(npcs as any));
    const dialogueIds = new Set(Object.keys(dialogue as any));
    const itemIds = new Set(Object.keys(items as any));
    const shopIds = new Set<string>(((shops as any) as Array<any>).map(s => s.shop_id));

    Object.entries((locations as any)).forEach(([locId, loc]: any) => {
      const actions = Array.isArray(loc.actions) ? loc.actions : [];
      actions.forEach((a: any, idx: number) => {
        if (a.type === 'navigate') {
          if (!locationIds.has(String(a.target))) {
            issues.push(`locations.json:${locId}.actions[${idx}] navigate target '${a.target}' missing`);
          }
        } else if (a.type === 'dialogue') {
          if (!npcIds.has(String(a.target))) {
            issues.push(`locations.json:${locId}.actions[${idx}] dialogue target '${a.target}' missing`);
          }
        } else if (a.type === 'shop') {
          const sid = String(a.shopId || a.target || '');
          if (!sid || !shopIds.has(sid)) {
            issues.push(`locations.json:${locId}.actions[${idx}] shop id '${sid}' missing`);
          }
        }
        const cond = String(a.condition || '');
        if (cond) {
          cond.split('&&').map(s => s.trim()).forEach(expr => {
            const [lhs, rhsRaw] = expr.split('==').map(s => s.trim());
            if (lhs.startsWith('quest.')) {
              const [, qid] = lhs.split('.');
              if (!Object.prototype.hasOwnProperty.call((quests as any), qid)) {
                issues.push(`locations.json:${locId}.actions[${idx}] condition quest '${qid}' missing`);
              }
            } else if (lhs.startsWith('world_flags.') || lhs.startsWith('time.')) {
            } else {
              issues.push(`locations.json:${locId}.actions[${idx}] condition '${expr}' unknown lhs '${lhs}'`);
            }
          });
        }
      });
    });

    Object.entries((dialogue as any)).forEach(([dlgId, entry]: any) => {
      const nodes = entry.nodes || {};
      const interactionRoots = entry.interaction_roots || {};
      const entryNodeCandidates = [entry.first_meet_node, entry.repeat_meet_node, Object.prototype.hasOwnProperty.call(nodes, '0') ? '0' : null]
        .filter((value): value is string => Boolean(value));

      if (entry.interaction_roots) {
        const rootKeys = Object.keys(interactionRoots);
        rootKeys.forEach((key) => {
          if (!VALID_INTERACTION_ROOTS.has(key)) {
            issues.push(`dialogue:${dlgId}.interaction_roots['${key}'] is invalid; trade belongs in the entry menu`);
          }
        });

        if (entryNodeCandidates.length === 0) {
          issues.push(`dialogue:${dlgId} has interaction_roots but no valid entry node (first_meet_node, repeat_meet_node, or node '0')`);
        }

        Object.entries(interactionRoots).forEach(([category, nodeId]) => {
          if (!Object.prototype.hasOwnProperty.call(nodes, String(nodeId))) {
            issues.push(`dialogue:${dlgId}.interaction_roots.${category} points to missing node '${nodeId}'`);
          }
        });
      }

      Object.entries(nodes).forEach(([nodeId, node]: any) => {
        const choices = Array.isArray(node.player_choices) ? node.player_choices : [];
        choices.forEach((c: any, idx: number) => {
          const next = String(c.next_node || '');
          const isGeneratedSocialNode = next === '__social_root__' || next === '__social_return__';
          if (next && !isGeneratedSocialNode && !Object.prototype.hasOwnProperty.call(nodes, next)) {
            issues.push(`dialogue:${dlgId}.nodes[${nodeId}].choices[${idx}] next_node '${next}' missing`);
          }

          if (next === '__social_root__' && entry.interaction_roots) {
            const isEntryNode =
              nodeId === entry.first_meet_node ||
              nodeId === entry.repeat_meet_node ||
              nodeId === '0';
            const isCategoryRoot = Object.values(interactionRoots).includes(nodeId);
            if (!isEntryNode && !isCategoryRoot) {
              issues.push(`dialogue:${dlgId}.nodes[${nodeId}].choices[${idx}] points to __social_root__ from a content node; return to a category root instead`);
            }
          }

          const cond = String(c.condition || '');
          if (cond) {
            cond.split('&&').map((s: string) => s.trim()).forEach((expr: string) => {
              // Handle operators: >=, <=, >, <, ==
              let op = '==';
              if (expr.includes('>=')) op = '>=';
              else if (expr.includes('<=')) op = '<=';
              else if (expr.includes('>')) op = '>';
              else if (expr.includes('<')) op = '<';
              
              const [lhs] = expr.split(op).map((s: string) => s.trim());
              
              if (lhs.startsWith('quest.')) {
                const [, qid] = lhs.split('.');
                if (!Object.prototype.hasOwnProperty.call((quests as any), qid)) {
                  issues.push(`dialogue:${dlgId}.nodes[${nodeId}].choices[${idx}] condition quest '${qid}' missing`);
                }
              } else if (lhs.startsWith('world_flags.') || lhs.startsWith('time.') || lhs.startsWith('job.') || lhs.startsWith('relationship.') || lhs.startsWith('inventory.')) {
                // Known valid prefixes
              } else {
                issues.push(`dialogue:${dlgId}.nodes[${nodeId}].choices[${idx}] condition lhs '${lhs}' unknown`);
              }
            });
          }
          const action = String(c.action || '');
          if (action) {
            action.split('|').map((segment: string) => segment.trim()).filter(Boolean).forEach((segment: string, actionIndex: number) => {
              const parsed = parseAction(segment);
              const t = parsed.type;
              const p = parsed.params;

              if (!VALID_DIALOGUE_ACTIONS.has(t)) {
                issues.push(`dialogue:${dlgId}.nodes[${nodeId}].choices[${idx}] action[${actionIndex}] '${segment}' uses unknown action type '${t}'`);
                return;
              }

              if (t === 'open_shop') {
                const sid = String(p[0] || '');
                if (!shopIds.has(sid)) {
                  issues.push(`dialogue.json:${dlgId}.nodes[${nodeId}].choices[${idx}] open_shop '${sid}' missing`);
                }
              } else if (t === 'start_quest' || t === 'advance_quest_stage' || t === 'complete_quest') {
                const qid = String(p[0] || '');
                if (!Object.prototype.hasOwnProperty.call((quests as any), qid)) {
                  issues.push(`dialogue.json:${dlgId}.nodes[${nodeId}].choices[${idx}] quest '${qid}' missing`);
                }
              } else if (t === 'grant_item' || t === 'add_item') {
                const it = String(p[0] || '');
                if (!itemIds.has(it)) {
                  issues.push(`dialogue.json:${dlgId}.nodes[${nodeId}].choices[${idx}] item '${it}' missing`);
                }
              } else if (t === 'add_known_npc' || t === 'update_relationship' || t === 'set_relationship' || t === 'collect_debt_from' || t === 'social_action') {
                const nid = String(p[0] || '');
                if (!npcIds.has(nid)) {
                  issues.push(`dialogue.json:${dlgId}.nodes[${nodeId}].choices[${idx}] npc '${nid}' missing`);
                }
              } else if (t === 'enter_temporal_instance') {
                const locId = String(p[0] || '');
                if (locId && !locationIds.has(locId)) {
                  issues.push(`dialogue.json:${dlgId}.nodes[${nodeId}].choices[${idx}] location '${locId}' missing`);
                }
              }
            });
          }
        });
      });

      const startingNodes = new Set<string>(entryNodeCandidates);
      if (entry.interaction_roots) {
        startingNodes.add('__social_root__');
      }

      const visited = new Set<string>();
      const queue = Array.from(startingNodes);
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const node = current === '__social_root__'
          ? { player_choices: Object.values(interactionRoots).map((nodeId: any) => ({ next_node: nodeId })) }
          : nodes[current];

        if (!node) continue;

        const choices = Array.isArray(node.player_choices) ? node.player_choices : [];
        choices.forEach((choice: any) => {
          const next = String(choice.next_node || '');
          if (!next) return;
          if (next === '__social_return__') return;
          if (next === '__social_root__') {
            queue.push('__social_root__');
            return;
          }
          if (Object.prototype.hasOwnProperty.call(nodes, next)) {
            queue.push(next);
          }
        });
      }

      Object.keys(nodes).forEach((nodeId) => {
        if (!visited.has(nodeId)) {
          issues.push(`dialogue:${dlgId}.nodes[${nodeId}] is unreachable`);
        }
      });
    });

    ((shops as any) as Array<any>).forEach((shop: any, sidx: number) => {
      const sid = String(shop.shop_id);
      const inv = Array.isArray(shop.inventory) ? shop.inventory : [];
      inv.forEach((it: any, iidx: number) => {
        const iid = String(it.item_id || '');
        if (!itemIds.has(iid)) {
          issues.push(`shops.json[${sidx}].inventory[${iidx}] item '${iid}' missing`);
        }
      });
      const lid = String(shop.location_id || '');
      if (lid && !locationIds.has(lid)) {
        issues.push(`shops.json[${sidx}] location_id '${lid}' missing`);
      }
    });

    Object.entries((quests as any)).forEach(([qid, q]: any) => {
      const stages = Array.isArray(q.stages) ? q.stages : [];
      stages.forEach((st: any, idx: number) => {
        const type = String(st.type || '');
        const target = String(st.target || '');
        if (type === 'talk') {
          if (!npcIds.has(target)) {
            issues.push(`quests.json:${qid}.stages[${idx}] talk target '${target}' missing`);
          }
        } else if (type === 'use') {
          if (!locationIds.has(target)) {
            issues.push(`quests.json:${qid}.stages[${idx}] use target '${target}' missing`);
          }
        } else if (type === 'gather') {
          if (!itemIds.has(target)) {
            issues.push(`quests.json:${qid}.stages[${idx}] gather item '${target}' missing`);
          }
        }
      });
    });

    return issues;
  }
}
