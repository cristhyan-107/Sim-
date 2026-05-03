-- ==========================================
-- SEED DE CATEGORIAS PADRÃO (Organiza MEI)
-- ==========================================
-- IMPORTANTE: Substitua 'COLOQUE-SEU-USER-ID-AQUI' pelo seu UUID real 
-- gerado na aba "Authentication" do Supabase.

-- CATEGORIAS PESSOA FÍSICA (PF)
INSERT INTO public.categories (user_id, name, scope, type) VALUES
('COLOQUE-SEU-USER-ID-AQUI', 'Alimentação', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Transporte', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Moradia', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Lazer', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Saúde', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Educação', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Assinaturas pessoais', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Cartão de crédito', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Reserva pessoal', 'PF', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Salário/Receita', 'PF', 'income'),
('COLOQUE-SEU-USER-ID-AQUI', 'Transferência PF', 'PF', 'transfer'),
('COLOQUE-SEU-USER-ID-AQUI', 'Outros PF', 'PF', 'expense');

-- CATEGORIAS PESSOA JURÍDICA (PJ)
INSERT INTO public.categories (user_id, name, scope, type) VALUES
('COLOQUE-SEU-USER-ID-AQUI', 'Receita de Vendas', 'PJ', 'income'),
('COLOQUE-SEU-USER-ID-AQUI', 'Receita de Serviços', 'PJ', 'income'),
('COLOQUE-SEU-USER-ID-AQUI', 'Tráfego pago', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Ferramentas de Software', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Impostos/DAS', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Fornecedores', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Cursos profissionais', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Equipamentos', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Retirada do dono (Pró-labore)', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Reserva da empresa', 'PJ', 'expense'),
('COLOQUE-SEU-USER-ID-AQUI', 'Transferência PJ', 'PJ', 'transfer'),
('COLOQUE-SEU-USER-ID-AQUI', 'Outros PJ', 'PJ', 'expense');
