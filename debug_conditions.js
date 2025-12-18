
// Mocking the store state for reproduction
const mockState = {
    worldFlags: {},
    relationships: { npc_boric: { friendship: { value: 0 } } },
    activeJob: null, // No job
    firedJobs: {}, // None fired
    inventory: {},
    quests: {}
};

function checkCondition(condition) {
    if (!condition) return true;
    const parts = String(condition).split('&&').map(s => s.trim());
    
    console.log(`\nEvaluating: "${condition}"`);

    for (const expr of parts) {
        let op = '==';
        let lhs = expr;
        let rhsRaw = '';
        // Order matters! >= before >
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
        
        console.log(`  Part: "${expr}" -> LHS: "${lhs}", OP: "${op}", RHS: "${rhsRaw}" (Bool: ${rhsBool}, Num: ${rhsNum})`);

        let result = true; // Does this part pass?

        if (lhs.startsWith('job.')) {
            const jobId = lhs.replace('job.', '').replace('.active', '').replace('.fired', '');
            let val = false;
            if (lhs.endsWith('.fired')) {
                val = !!mockState.firedJobs[jobId];
            } else {
                val = mockState.activeJob?.jobId === jobId;
            }
            console.log(`    [JOB CHECK] JobId: "${jobId}", IsFiredCheck: ${lhs.endsWith('.fired')}, Val: ${val}`);
            
            if (op === '==') { 
                if (val !== rhsBool) {
                    console.log(`    FAIL: ${val} !== ${rhsBool}`);
                    return false; 
                }
            }
        }
        // ... other checks omitted for this test as we focus on job ...
        
        // Mock relationship check for Boric
        else if (lhs.startsWith('relationship.')) {
             const npcId = lhs.replace('relationship.', '');
             const val = mockState.relationships[npcId]?.friendship?.value ?? 0;
             console.log(`    [REL CHECK] NpcId: "${npcId}", Val: ${val}`);
             
             if (op === '>=') { if (!(val >= rhsNum)) return false; }
             if (op === '<') { if (!(val < rhsNum)) return false; }
        }
    }
    return true;
}

// Test Cases from Boric's Dialogue
const cases = [
    "relationship.npc_boric>=-50 && job.job_dockhand.active==false && job.job_dockhand.fired==false", // I'm looking for work
    "job.job_dockhand.fired==true", // Can I have my job back?
    "job.job_dockhand.active==true", // About the job...
];

cases.forEach(c => {
    const visible = checkCondition(c);
    console.log(`Result: ${visible ? "VISIBLE" : "HIDDEN"}`);
});
