# novique.ai — Contract (STRICT)

## Inheritance
This file inherits the IDE constitution at `~/IDE/CLAUDE.md` (STRICT MODE).
If any instruction here conflicts with the constitution, the constitution wins.

The global file defines:
- Structural rules
- Execution workflow
- Validation requirements
- DEFECT mode (AUTONOMOUS_DEEP_DEBUG)

These rules are authoritative and MUST NOT be overridden.

This file may define:
- Project-specific logic
- Service behavior
- Local development workflows

---

## DEFECT MODE AWARENESS

This repository participates in global DEFECT mode.

If the prompt contains "defect":

- Switch to AUTONOMOUS_DEEP_DEBUG
- Perform full system analysis before coding
- Execute ≥5 test scenarios
- Do NOT deploy without validation
- Do NOT stop at first fix

---

## Scope
`novique.ai` is the public website project deployed via Vercel.

## Allowed Writes
- Inside this project directory only
- `data/` for generated outputs (reports, screenshots, build artifacts if needed)

## Execution Interface
- Do NOT assume absolute IDE paths; prefer repo-relative commands.
- If a script needs IDE paths, source `config/paths.env`.
- After structural changes, run `bin/doctor` (STRICT).

---

# Claude Code Instructions for Novique.AI Project

This file contains permanent instructions for Claude Code when working on this project.

---

## ⚠️ CRITICAL: Development Workflow

**NEVER push directly to the `main` branch!**

### Standard Development Process

All feature development, bug fixes, and changes MUST follow this workflow:

1. **Create a feature branch**
2. **Develop and test locally**
3. **Push to feature branch** (creates Vercel preview deployment)
4. **Test preview deployment thoroughly**
5. **Merge to main ONLY after preview is verified**

### Why This Matters

- The production site (`novique.ai`) deploys automatically from the `main` branch
- Pushing broken code to `main` causes production downtime
- Preview deployments allow safe testing before production
- This prevents customer-facing outages

---

## 🚀 Preferred Workflow Commands

### Using the Helper Script (Recommended)

```bash
# From IDE root (no hard-coded paths)
cd ~/IDE
set -a
source config/paths.env
set +a
cd "$IDE_ROOT/projects/novique.ai"

# Start new feature
./scripts/git-workflow.sh new-feature <feature-name>

# Save work
./scripts/git-workflow.sh save "Commit message"

# Push to GitHub (creates preview)
./scripts/git-workflow.sh push

# After testing preview, merge to production
./scripts/git-workflow.sh merge
```

### Manual Git Commands (Alternative)

```bash
# Start feature
git checkout main && git pull
git checkout -b feature/<name>

# Make changes, then commit
git add .
git commit -m "Description"

# Push to create preview
git push origin feature/<name>

# Test preview URL from Vercel

# Merge to production (only after testing!)
git checkout main
git merge feature/<name>
git push origin main
```

---

## 📦 Vercel Preview Deployments

### How They Work

- **Every branch push** → Automatic preview deployment
- **Preview URL pattern:** `https://novique-ai-git-{branch-name}-mark-howells-projects.vercel.app`
- **Production URL:** `https://novique.ai` (only from `main` branch)

### Environment Variables

All environment variables are configured at the **project level** in Vercel:
- Location: Vercel → Project Settings → Environment Variables
- Preview deployments use variables marked with ☑️ Preview
- Production uses variables marked with ☑️ Production

**IMPORTANT:** Never add environment variables at the team/account level - they won't work!

---

## 🛡️ Branch Protection

The `main` branch may have protection rules enabled:
- Requires pull requests for merging
- Prevents accidental direct pushes
- Ensures preview builds succeed before merge

If you encounter "protected branch" errors, this is intentional - use the feature branch workflow.

---

## 📂 Project Structure

**Location:** `projects/novique.ai/` (authoritative relative path; do not assume `/home/...`)

```
projects/novique.ai/
├── .planning/              # Planning files (git-ignored, local only)
│   ├── plans/             # Claude Code session plans (EnterPlanMode)
│   ├── design/            # Design documents
│   ├── status/            # Session status files
│   └── notes/             # Planning notes and ideas
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
│   └── supabase/          # Supabase client configurations
```

---

## Open Brain Integration

> Inherits Section 10 of the IDE constitution (`~/IDE/CLAUDE.md`).

Agents MUST search Open Brain at session start for prior context (`search_thoughts`), capture durable project knowledge during work (`capture_thought`), and review for uncaptured insights at session end. Only store knowledge useful across sessions — not transient task state. Open Brain informs decisions but does not override CLAUDE.md authority.
