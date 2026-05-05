-- Organiza MEI - Supabase/PostgreSQL schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  role TEXT,
  initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'secondary', 'closed')),
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  nickname TEXT NOT NULL,
  bank TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  last_four_digits TEXT CHECK (last_four_digits IS NULL OR last_four_digits ~ '^[0-9]{0,4}$'),
  closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scope, name)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'owner_withdrawal', 'card_payment', 'invoice_payment', 'das_payment')),
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'debit', 'credit_card', 'cash', 'bank_slip', 'transfer', 'other')),
  card_id UUID REFERENCES public.cards(id) ON DELETE RESTRICT,
  invoice_id UUID,
  recurrence_id UUID,
  related_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.installment_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
  installments_count INTEGER NOT NULL CHECK (installments_count > 0),
  installment_amount NUMERIC(15, 2) NOT NULL CHECK (installment_amount > 0),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  purchase_date DATE NOT NULL,
  first_invoice_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'finished')),
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE RESTRICT,
  invoice_month DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'future', 'closed', 'paid')),
  paid_at TIMESTAMPTZ,
  paid_from_account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
  payment_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, card_id, invoice_month)
);

CREATE TABLE IF NOT EXISTS public.installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.installment_purchases(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  total_installments INTEGER NOT NULL CHECK (total_installments > 0),
  due_month DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'debit', 'credit_card', 'cash', 'bank_slip', 'transfer', 'other')),
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  month DATE NOT NULL,
  limit_amount NUMERIC(15, 2) NOT NULL CHECK (limit_amount >= 0),
  alert_percentage INTEGER NOT NULL DEFAULT 80 CHECK (alert_percentage BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

CREATE TABLE IF NOT EXISTS public.monthly_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  notes TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mei_annual_limit NUMERIC(15, 2) NOT NULL DEFAULT 81260,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.category_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'any')),
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'ofx')),
  source_bank TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'completed')),
  imported_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  ignored_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.imported_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  raw_date TEXT NOT NULL,
  date DATE NOT NULL,
  raw_description TEXT NOT NULL,
  description TEXT NOT NULL,
  raw_amount TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'owner_withdrawal', 'invoice_payment', 'das_payment')),
  suggested_scope TEXT NOT NULL CHECK (suggested_scope IN ('PF', 'PJ')),
  suggested_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  selected_scope TEXT NOT NULL CHECK (selected_scope IN ('PF', 'PJ')),
  selected_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  selected_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  selected_card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  matched_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  duplicate_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ignored', 'duplicate')),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('transaction', 'invoice', 'das', 'monthly_closing')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  public_url TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.das_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMPTZ,
  payment_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  attachment_id UUID REFERENCES public.attachments(id) ON DELETE SET NULL,
  notes TEXT,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  scope TEXT NOT NULL CHECK (scope IN ('PF', 'PJ')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  example_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','accounts','cards','categories','transactions','installment_purchases',
    'installments','invoices','recurrences','budgets','monthly_closings','audit_logs',
    'user_settings','category_rules','import_batches','imported_transactions','attachments','das_records','goals'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_modtime ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_modtime BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_scope_status ON public.accounts(scope, status);
CREATE INDEX IF NOT EXISTS idx_accounts_example_data ON public.accounts(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON public.cards(account_id);
CREATE INDEX IF NOT EXISTS idx_cards_scope_status ON public.cards(scope, status);
CREATE INDEX IF NOT EXISTS idx_cards_example_data ON public.cards(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_categories_user_scope_status ON public.categories(user_id, scope, status);
CREATE INDEX IF NOT EXISTS idx_categories_example_data ON public.categories(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_scope_type ON public.transactions(scope, type);
CREATE INDEX IF NOT EXISTS idx_transactions_example_data ON public.transactions(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_installment_purchases_user_status ON public.installment_purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_installment_purchases_example_data ON public.installment_purchases(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_installments_card_id ON public.installments(card_id);
CREATE INDEX IF NOT EXISTS idx_installments_category_id ON public.installments(category_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_month ON public.installments(due_month);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_example_data ON public.installments(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_invoices_card_id ON public.invoices(card_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month_status ON public.invoices(invoice_month, status);
CREATE INDEX IF NOT EXISTS idx_invoices_example_data ON public.invoices(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_recurrences_user_status ON public.recurrences(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recurrences_example_data ON public.recurrences(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_recurrences_next_due_date ON public.recurrences(next_due_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id_month ON public.budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_example_data ON public.budgets(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_monthly_closings_user_month ON public.monthly_closings(user_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_closings_example_data ON public.monthly_closings(user_id, example_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_user_active ON public.category_rules(user_id, active);
CREATE INDEX IF NOT EXISTS idx_category_rules_category_id ON public.category_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_user_status ON public.import_batches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_user_batch ON public.imported_transactions(user_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_date ON public.imported_transactions(date);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_status ON public.imported_transactions(status);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_duplicate_hash ON public.imported_transactions(duplicate_hash);
CREATE INDEX IF NOT EXISTS idx_attachments_user_entity ON public.attachments(user_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_das_records_user_month ON public.das_records(user_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_das_records_status ON public.das_records(status);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
