# Feature Boundaries

The app currently runs with local mock state in `src/lib/finance/store.tsx`.

Supabase integration should replace this store with feature repositories while keeping:

- `src/lib/finance/types.ts` as the domain contract.
- `src/lib/finance/engine.ts` as pure calculation logic.
- `src/lib/validations/finance.ts` as shared validation primitives.
- `src/lib/csv.ts` as the CSV export layer.

Suggested future feature folders:

- `features/accounts`
- `features/cards`
- `features/categories`
- `features/transactions`
- `features/installments`
- `features/invoices`
- `features/recurrences`
- `features/budgets`
- `features/monthly-closing`
- `features/reports`
