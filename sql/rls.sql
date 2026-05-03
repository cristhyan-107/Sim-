-- ==========================================
-- HABILITANDO RLS EM TODAS AS TABELAS
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES (Garantindo acesso exclusivo ao usuário dono)
-- ==========================================

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- ACCOUNTS
CREATE POLICY "accounts_select" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- CARDS
CREATE POLICY "cards_select" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cards_insert" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cards_update" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cards_delete" ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- INSTALLMENT_PURCHASES
CREATE POLICY "installment_purchases_select" ON public.installment_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "installment_purchases_insert" ON public.installment_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "installment_purchases_update" ON public.installment_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "installment_purchases_delete" ON public.installment_purchases FOR DELETE USING (auth.uid() = user_id);

-- INSTALLMENTS
CREATE POLICY "installments_select" ON public.installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "installments_insert" ON public.installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "installments_update" ON public.installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "installments_delete" ON public.installments FOR DELETE USING (auth.uid() = user_id);

-- INVOICES
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- RECURRENCES
CREATE POLICY "recurrences_select" ON public.recurrences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurrences_insert" ON public.recurrences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurrences_update" ON public.recurrences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurrences_delete" ON public.recurrences FOR DELETE USING (auth.uid() = user_id);

-- BUDGETS
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- MONTHLY_CLOSINGS
CREATE POLICY "monthly_closings_select" ON public.monthly_closings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monthly_closings_insert" ON public.monthly_closings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_closings_update" ON public.monthly_closings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "monthly_closings_delete" ON public.monthly_closings FOR DELETE USING (auth.uid() = user_id);

-- AUDIT_LOGS
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "audit_logs_update" ON public.audit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "audit_logs_delete" ON public.audit_logs FOR DELETE USING (auth.uid() = user_id);
