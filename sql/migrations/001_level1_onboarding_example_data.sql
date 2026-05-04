-- Organiza MEI - Nivel 1: onboarding e dados de exemplo

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.installment_purchases ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.recurrences ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.monthly_closings ADD COLUMN IF NOT EXISTS example_data BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_accounts_example_data ON public.accounts(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_cards_example_data ON public.cards(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_categories_example_data ON public.categories(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_transactions_example_data ON public.transactions(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_installment_purchases_example_data ON public.installment_purchases(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_installments_example_data ON public.installments(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_invoices_example_data ON public.invoices(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_recurrences_example_data ON public.recurrences(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_budgets_example_data ON public.budgets(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_monthly_closings_example_data ON public.monthly_closings(user_id, example_data);
