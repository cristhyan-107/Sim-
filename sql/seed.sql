-- ==========================================
-- SEED DE CATEGORIAS PADRÃO (Organiza MEI)
-- ==========================================
-- Este script localiza automaticamente o seu primeiro usuário cadastrado
-- no Supabase (auth.users) e cria as categorias padrão para ele.

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Busca o ID do primeiro usuário cadastrado
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum usuário encontrado! Por favor, crie um usuário na aba "Authentication" do Supabase antes de rodar este seed.';
    END IF;

    -- CATEGORIAS PESSOA FÍSICA (PF)
    INSERT INTO public.categories (user_id, name, scope, type) VALUES
    (v_user_id, 'Alimentação', 'PF', 'expense'),
    (v_user_id, 'Transporte', 'PF', 'expense'),
    (v_user_id, 'Moradia', 'PF', 'expense'),
    (v_user_id, 'Lazer', 'PF', 'expense'),
    (v_user_id, 'Saúde', 'PF', 'expense'),
    (v_user_id, 'Educação', 'PF', 'expense'),
    (v_user_id, 'Assinaturas pessoais', 'PF', 'expense'),
    (v_user_id, 'Cartão de crédito', 'PF', 'expense'),
    (v_user_id, 'Reserva pessoal', 'PF', 'expense'),
    (v_user_id, 'Salário/Receita', 'PF', 'income'),
    (v_user_id, 'Transferência PF', 'PF', 'transfer'),
    (v_user_id, 'Outros PF', 'PF', 'expense');

    -- CATEGORIAS PESSOA JURÍDICA (PJ)
    INSERT INTO public.categories (user_id, name, scope, type) VALUES
    (v_user_id, 'Receita de Vendas', 'PJ', 'income'),
    (v_user_id, 'Receita de Serviços', 'PJ', 'income'),
    (v_user_id, 'Tráfego pago', 'PJ', 'expense'),
    (v_user_id, 'Ferramentas de Software', 'PJ', 'expense'),
    (v_user_id, 'Impostos/DAS', 'PJ', 'expense'),
    (v_user_id, 'Fornecedores', 'PJ', 'expense'),
    (v_user_id, 'Cursos profissionais', 'PJ', 'expense'),
    (v_user_id, 'Equipamentos', 'PJ', 'expense'),
    (v_user_id, 'Retirada do dono (Pró-labore)', 'PJ', 'expense'),
    (v_user_id, 'Reserva da empresa', 'PJ', 'expense'),
    (v_user_id, 'Transferência PJ', 'PJ', 'transfer'),
    (v_user_id, 'Outros PJ', 'PJ', 'expense');

    RAISE NOTICE 'Categorias criadas com sucesso para o usuário %', v_user_id;
END $$;
