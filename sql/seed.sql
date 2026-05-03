-- ==========================================
-- SEED DE CATEGORIAS PADRÃO (Organiza MEI)
-- ==========================================
-- IMPORTANTE: Substitua 'COLOQUE-SEU-USER-ID-AQUI' pelo seu UUID real 
-- gerado na aba "Authentication" do Supabase.

-- CATEGORIAS PESSOA FÍSICA (PF)
INSERT INTO public.categories (user_id, name, scope, type) VALUES
('00000000-0000-0000-0000-000000000000', 'Alimentação', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Transporte', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Moradia', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Lazer', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Saúde', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Educação', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Assinaturas pessoais', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Cartão de crédito', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Reserva pessoal', 'PF', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Salário/Receita', 'PF', 'income'),
('00000000-0000-0000-0000-000000000000', 'Transferência PF', 'PF', 'transfer'),
('00000000-0000-0000-0000-000000000000', 'Outros PF', 'PF', 'expense');

-- CATEGORIAS PESSOA JURÍDICA (PJ)
INSERT INTO public.categories (user_id, name, scope, type) VALUES
('00000000-0000-0000-0000-000000000000', 'Receita de Vendas', 'PJ', 'income'),
('00000000-0000-0000-0000-000000000000', 'Receita de Serviços', 'PJ', 'income'),
('00000000-0000-0000-0000-000000000000', 'Tráfego pago', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Ferramentas de Software', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Impostos/DAS', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Fornecedores', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Cursos profissionais', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Equipamentos', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Retirada do dono (Pró-labore)', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Reserva da empresa', 'PJ', 'expense'),
('00000000-0000-0000-0000-000000000000', 'Transferência PJ', 'PJ', 'transfer'),
('00000000-0000-0000-0000-000000000000', 'Outros PJ', 'PJ', 'expense');
