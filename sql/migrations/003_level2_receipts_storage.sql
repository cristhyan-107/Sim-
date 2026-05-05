-- Organiza MEI - Receipts storage bucket and policies

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

DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS receipts_select ON storage.objects;
    DROP POLICY IF EXISTS receipts_insert ON storage.objects;
    DROP POLICY IF EXISTS receipts_update ON storage.objects;
    DROP POLICY IF EXISTS receipts_delete ON storage.objects;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects not available in this environment';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY receipts_select
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'receipts'
        AND auth.uid() IS NOT NULL
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY receipts_insert
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'receipts'
        AND auth.uid() IS NOT NULL
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY receipts_update
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'receipts'
        AND auth.uid() IS NOT NULL
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'receipts'
        AND auth.uid() IS NOT NULL
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY receipts_delete
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'receipts'
        AND auth.uid() IS NOT NULL
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects not available in this environment';
  END;
END $$;
