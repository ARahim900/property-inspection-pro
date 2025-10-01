# Follow-up Maintenance Tasks

## 1. Correct typo in setup instructions
- **Issue**: The quick setup guide says "create one if you don't have it," which should read "create one if you don't have one." The current wording is grammatically incorrect and reads like a typo in the onboarding docs.
- **Proposed fix**: Update the sentence in `SETUP_INSTRUCTIONS.md` so it uses the proper pronoun.
- **Why it matters**: Polished documentation avoids confusing new contributors and keeps the instructions professional.

## 2. Refresh local inspection cache after updates
- **Issue**: `useInspections.saveInspection` only refreshes cached inspections when a new record is inserted. When an existing inspection is updated, the hook returns without refetching, so the UI continues to show stale data until the page reloads.
- **Proposed fix**: After a successful update, either call `fetchInspections()` or update the `inspections` state with the latest payload before returning.
- **Why it matters**: Users expect edits to appear immediately; without the refresh they see outdated information, which looks like their changes were lost.

## 3. Align environment setup docs with the repository
- **Issue**: Several onboarding instructions (banner copy and setup guides) tell developers to copy `.env.local.example`, but that file is not present in the repo.
- **Proposed fix**: Either add the missing template file or update the docs/UI copy to describe the real setup steps (for example, list the required variables directly).
- **Why it matters**: Following the published instructions currently fails, causing unnecessary setup friction.

## 4. Add unit coverage for invoice validation helpers
- **Issue**: `lib/invoice-validation.ts` contains the core validation logic for invoices, but there are no automated tests covering the different validation branches (e.g., property-based totals, email validation, amount constraints, and `suggestInvoiceStatus`).
- **Proposed fix**: Introduce Jest or Vitest specs that exercise `validateInvoice`, `canFinalizeInvoice`, and `suggestInvoiceStatus` across happy-path and failure scenarios.
- **Why it matters**: Test coverage will guard against regressions in billing logic and provide documentation for expected behaviors.
