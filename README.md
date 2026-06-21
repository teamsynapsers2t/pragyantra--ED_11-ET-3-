# PAPER — AI-Powered JEE Prep Platform

A Next.js 15 application that helps JEE students identify **why** they lose marks, not just where.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, ShadCN, Framer Motion
- **Backend**: Supabase (PostgreSQL), Clerk (Auth)
- **Engine**: PL/pgSQL functions + DB triggers (deterministic, no external AI in the pipeline)

## Architecture: Micro-Weakness Engine

```
Student answers question
        ↓
  INSERT INTO attempts (is_correct, time_taken_ms, ...)
        ↓
  DB Trigger: attempts_after_insert
        ↓
  fn_apply_attempt()
    ├── Updates concept_mastery (EWMA score)
    ├── Fires/clears weak_concept signals
    └── Fires/clears time_trap signals
        ↓
  Session ends → fn_generate_weakness_report()
    ├── Calls fn_detect_root_flaws() (prerequisite graph analysis)
    └── Writes narrative report to weakness_reports
```

### Key Design Principle

> The app layer **never** calls mastery/weakness functions directly.
> It only INSERTs into `attempts` — the DB trigger does everything else.
> This prevents double-counting and keeps the engine deterministic.

## Numerical Answer Tolerance

For JEE numerical questions, answers are considered correct if within:
- **Absolute tolerance**: ±0.01
- **Relative tolerance**: 0.1% of the correct value
- Whichever is **larger** is used

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Main dashboard with practice mode, stats, root flaws |
| `/quiz` | Subject-specific quiz with session tracking |
| `/weakness-report` | Full weakness report: Root Causes → Weak Concepts → Time Traps |
| `/admin/error-tags` | Admin tool to tag `error_type` on wrong options |
| `/audit` | Engine pipeline auditor (diagnostic panel) |

## SQL Scripts

Located in `/sql/`:

| Script | Purpose |
|---|---|
| `refresh_question_stats.sql` | pg_cron nightly job for question_stats |
| `rls_policies.sql` | Row Level Security policies |
| `verify_engine.sql` | End-to-end engine verification |

## Running the Verification Script

```bash
# In Supabase SQL Editor, run:
sql/verify_engine.sql

# Check for PASS/FAIL/WARN messages in the output
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # Required for trigger writes
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
ADMIN_CLERK_IDS=user_xxx,user_yyy   # Comma-separated Clerk user IDs for admin access
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Engine Tunables

These are configured in the PL/pgSQL functions:

| Parameter | Where | Default | Purpose |
|---|---|---|---|
| EWMA alpha | `fn_apply_attempt` | 0.3 | How fast mastery reacts to new attempts |
| Weak threshold | `fn_apply_attempt` | 40% | Below this mastery → weak_concept signal |
| Time trap ratio | `fn_apply_attempt` | 1.5× | Student/global avg ratio to flag time_trap |
| Min attempts | `fn_apply_attempt` | 5 | Minimum attempts before signals fire |
