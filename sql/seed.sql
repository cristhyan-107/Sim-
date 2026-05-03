-- Default Categories Seed
-- IMPORTANT: Replace 'YOUR-USER-ID-UUID' with the actual user UUID before running, or adapt for application level insertion.

-- PF Categories
INSERT INTO public.categories (user_id, name, scope, type) VALUES
('YOUR-USER-ID-UUID', 'Alimentação', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Transporte', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Moradia', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Lazer', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Saúde', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Educação', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Assinaturas pessoais', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Cartão de crédito', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Reserva pessoal', 'PF', 'expense'),
('YOUR-USER-ID-UUID', 'Receita PF', 'PF', 'income'),
('YOUR-USER-ID-UUID', 'Outros PF', 'PF', 'expense');

-- PJ Categories
INSERT INTO public.categories (user_id, name, scope, type) VALUES
('YOUR-USER-ID-UUID', 'Receita', 'PJ', 'income'),
('YOUR-USER-ID-UUID', 'Tráfego pago', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Ferramentas', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Impostos/DAS', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Fornecedores', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Cursos profissionais', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Equipamentos', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Retirada do dono', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Reserva da empresa', 'PJ', 'expense'),
('YOUR-USER-ID-UUID', 'Outros PJ', 'PJ', 'expense');
