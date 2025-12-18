
// Mock Stores
const mockJobStore = {
    activeJob: null, // Default: no job
    firedJobs: {},
    jobs: {}
};

const mockWorldStore = {
    flags: {},
    getFlag: (f) => mockWorldStore.flags[f] || false
};

const mockJournalStore = {
    quests: {}
};

const mockDiaryStore = {
    relationships: { npc_boric: { friendship: { value: 0 } } }
};

const mockInventoryStore = {
    getItemQuantity: () => 0
};

// Logic extracted EXACTLY from DialogueService.ts (current state)
function applyConditionsToNode(node) {
    const choices = node.player_choices || [];
    const filtered = choices.filter((choice) => {
      const condition = choice.condition;
      if (!condition) return true;
      
      const parts = String(condition).split('&&').map(s => s.trim());
      
      // Mocked state access
      const journal = mockJournalStore;
      const world = mockWorldStore;
      const diary = mockDiaryStore;
      const inventory = mockInventoryStore;
      const jobStore = mockJobStore;

      for (const expr of parts) {
        let op = '==';
        let lhs = expr;
        let rhsRaw = '';
        for (const candidate of ['>=','<=','==','>','<']) {
          const idx = expr.indexOf(candidate);
          if (idx >= 0) {
            op = candidate;
            lhs = expr.slice(0, idx).trim();
            rhsRaw = expr.slice(idx + candidate.length).trim();
            break;
          }
        }
        const rhsBool = rhsRaw === 'true' ? true : rhsRaw === 'false' ? false : undefined;
        const rhsNum = rhsBool === undefined && rhsRaw !== '' && !isNaN(Number(rhsRaw)) ? Number(rhsRaw) : undefined;

        console.log(`Evaluating: "${expr}" | LHS: "${lhs}" | OP: "${op}" | RHS: "${rhsRaw}"`);

        if (lhs.startsWith('quest.')) {
            // ... (omitted for brevity, focusing on job)
        } else if (lhs.startsWith('world_flags.')) {
             // ...
        } else if (lhs.startsWith('relationship.')) {
          const npcId = lhs.replace('relationship.', '');
          const val = diary.relationships[npcId]?.friendship?.value ?? 0;
          if (op === '==') { if (val !== (rhsNum)) return false; }
          if (op === '>') { if (!(val > (rhsNum))) return false; }
          if (op === '<') { if (!(val < (rhsNum))) return false; }
          if (op === '>=') { if (!(val >= (rhsNum))) return false; }
          if (op === '<=') { if (!(val <= (rhsNum))) return false; }
        } else if (lhs.startsWith('job.')) {
           const parts = lhs.split('.'); // e.g. ['job', 'job_dockhand', 'active']
           const jobId = parts[1];
           const property = parts[2];
           let val = false;
           
           if (property === 'fired') {
             val = !!jobStore.firedJobs[jobId];
           } else {
             val = jobStore.activeJob?.jobId === jobId;
           }
           
           console.log(`  [JOB] ID: ${jobId} Prop: ${property} Val: ${val} RHS: ${rhsBool}`);
           if (op === '==') { if (val !== (rhsBool)) return false; }
        }
      }
      return true;
    });
    return { ...node, player_choices: filtered };
}

// Test Data
const boricNode = {
    npc_text: "Test",
    player_choices: [
        { text: "Looking for work", condition: "relationship.npc_boric>=-50 && job.job_dockhand.active==false && job.job_dockhand.fired==false" },
        { text: "Can I have job back?", condition: "job.job_dockhand.fired==true" },
        { text: "About the job...", condition: "job.job_dockhand.active==true" }
    ]
};

console.log("--- SCENARIO 1: New Player (No Job, Not Fired) ---");
mockJobStore.activeJob = null;
mockJobStore.firedJobs = {};
const result1 = applyConditionsToNode(boricNode);
result1.player_choices.forEach(c => console.log(`[VISIBLE] ${c.text}`));

console.log("\n--- SCENARIO 2: Hired Player (Job Active) ---");
mockJobStore.activeJob = { jobId: 'job_dockhand' };
mockJobStore.firedJobs = {};
const result2 = applyConditionsToNode(boricNode);
result2.player_choices.forEach(c => console.log(`[VISIBLE] ${c.text}`));

console.log("\n--- SCENARIO 3: Fired Player ---");
mockJobStore.activeJob = null;
mockJobStore.firedJobs = { 'job_dockhand': true };
const result3 = applyConditionsToNode(boricNode);
result3.player_choices.forEach(c => console.log(`[VISIBLE] ${c.text}`));
