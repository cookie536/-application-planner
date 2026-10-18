# Demo empty state verification

Verified on 2026-10-18 against `c6bd9bd` on `main`.

## Finding

The demo empty state is already implemented and committed in `c6bd9bd`.
The production Dashboard JavaScript includes the empty-state copy and sample actions.
The reported browser already contains application cards, as confirmed by the owner.
That is why the sample action is hidden: it intentionally appears only after local
storage has hydrated and `applications.length === 0`.

No product code or deployment settings were changed during this verification.
Use a private/incognito window to inspect the first-visit experience without
removing existing applications from the regular browser.

## Existing implementation

- `app/dashboard/page.tsx`: requested Chinese copy, existing `openAdd` flow,
  empty-only sample action, sample labels, and clear-samples action.
- `app/sample-applications.ts`: three normal Application records with different
  schools, programs, deadlines, statuses, and material completion states.
- `app/applications-context.tsx`: guards sample loading against nonempty current
  state; uses existing applications storage and persistence; clearing samples
  removes only records with `isDemo === true`.
- Timeline derives events from the same applications; application material pages
  read their checklists through the same provider.

## Checks

- `npm run build`: PASS, including TypeScript and route generation.
- ESLint for Dashboard, sample factory, Checklist, and ApplicationMaterials: PASS.
- `npm run lint`: FAIL on pre-existing findings: two
  `react-hooks/set-state-in-effect` errors in the local-storage hydration effects
  of applications/common-documents providers and one unused `_nested` warning.
  These were not changed to keep this task scoped to the demo visibility report.

Earlier local browser verification covered sample loading, refresh persistence,
Timeline, material toggles/details, and adding a normal application followed by
clearing only samples. The current repository files exactly match that version.
The online browser automation was unavailable during this verification, so the
owner's regular-browser data state and production asset inspection were used to
diagnose visibility; no claim of a fresh online interactive test is made.
