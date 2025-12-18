# Jobs Authoring Guideline
## Schema
- Source: `src/data/jobs.json`
- Job: `{ "<job_id>": { "title": "...", "description": "...", "location_id": "<loc>", "supervisor_id": "<npc>", "pay_per_shift": <number>, "energy_cost": <number>, "late_pay_factor": <number>, "min_energy_to_start": <number>, "dismissal": { "max_missed": <number>, "max_late": <number>, "min_friendship": <number> }, "pay_schedule": "daily"|"weekly", "schedule": { "start_hour": <number>, "end_hour": <number>, "late_grace_period_hours": <number> } } }`

## Authoring Notes
- Daily jobs: Mon–Fri, shift window defined by `start_hour`→`end_hour`
- Weekly jobs: depart Monday `start_hour`, return Saturday `end_hour`; pay varies with performance and RNG
- Display: job action appears only at the job `location_id` when hired for that job

## Supervisor Gating
- Use dialogue actions to hire: `hire_job:<job_id>` or `try_hire_or_deny:<job_id>:<deny_node>`
- Gate by relationship in dialogue with `condition` like `relationship.<npc_id>>=10`

## Example
- `job_dockhand`: daily, 08:00–16:00, pay=20, energy=60
- `job_fisherman`: weekly, depart Monday 06:00, return Saturday 06:00, pay≈120, energy=80, supervisor Captain Elias
