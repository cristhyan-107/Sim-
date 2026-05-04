-- Organiza MEI - Seed de categorias padrao para o primeiro usuario Auth.

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  SELECT id, email INTO v_user_id, v_email
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuario encontrado. Crie um usuario em Authentication antes de executar o seed.';
  END IF;

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (v_user_id, COALESCE(split_part(v_email, '@', 1), 'Organiza MEI'), v_email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.categories (user_id, name, scope, type) VALUES
    (v_user_id, 'Alimentacao', 'PF', 'expense'),
    (v_user_id, 'Transporte', 'PF', 'expense'),
    (v_user_id, 'Moradia', 'PF', 'expense'),
    (v_user_id, 'Lazer', 'PF', 'expense'),
    (v_user_id, 'Saude', 'PF', 'expense'),
    (v_user_id, 'Educacao', 'PF', 'expense'),
    (v_user_id, 'Assinaturas pessoais', 'PF', 'expense'),
    (v_user_id, 'Cartao de credito', 'PF', 'expense'),
    (v_user_id, 'Reserva pessoal', 'PF', 'expense'),
    (v_user_id, 'Outros PF', 'PF', 'expense'),
    (v_user_id, 'Receita', 'PJ', 'income'),
    (v_user_id, 'Trafego pago', 'PJ', 'expense'),
    (v_user_id, 'Ferramentas', 'PJ', 'expense'),
    (v_user_id, 'Impostos/DAS', 'PJ', 'expense'),
    (v_user_id, 'Fornecedores', 'PJ', 'expense'),
    (v_user_id, 'Cursos profissionais', 'PJ', 'expense'),
    (v_user_id, 'Equipamentos', 'PJ', 'expense'),
    (v_user_id, 'Retirada do dono', 'PJ', 'expense'),
    (v_user_id, 'Reserva da empresa', 'PJ', 'expense'),
    (v_user_id, 'Outros PJ', 'PJ', 'expense')
  ON CONFLICT (user_id, scope, name) DO NOTHING;

  RAISE NOTICE 'Seed concluido para usuario %', v_user_id;
END $$;
