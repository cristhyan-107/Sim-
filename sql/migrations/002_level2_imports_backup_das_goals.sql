-- Organiza MEI - Level 2 features

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
BEGIN
  BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('receipts', 'receipts', false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.buckets not available in this environment';
  END;
END $$;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.das_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_select ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_settings_insert ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_settings_update ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_settings_delete ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY category_rules_select ON public.category_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY category_rules_insert ON public.category_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY category_rules_update ON public.category_rules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY category_rules_delete ON public.category_rules FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY import_batches_select ON public.import_batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY import_batches_insert ON public.import_batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY import_batches_update ON public.import_batches FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY import_batches_delete ON public.import_batches FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY imported_transactions_select ON public.imported_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY imported_transactions_insert ON public.imported_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY imported_transactions_update ON public.imported_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY imported_transactions_delete ON public.imported_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY attachments_select ON public.attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY attachments_insert ON public.attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY attachments_update ON public.attachments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY attachments_delete ON public.attachments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY das_records_select ON public.das_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY das_records_insert ON public.das_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY das_records_update ON public.das_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY das_records_delete ON public.das_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY goals_select ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY goals_insert ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_update ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_delete ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_user_active ON public.category_rules(user_id, active);
CREATE INDEX IF NOT EXISTS idx_import_batches_user_status ON public.import_batches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_user_batch ON public.imported_transactions(user_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_date ON public.imported_transactions(date);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_status ON public.imported_transactions(status);
CREATE INDEX IF NOT EXISTS idx_imported_transactions_duplicate_hash ON public.imported_transactions(duplicate_hash);
CREATE INDEX IF NOT EXISTS idx_attachments_user_entity ON public.attachments(user_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_das_records_user_month ON public.das_records(user_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
