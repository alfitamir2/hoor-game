CREATE TABLE public.game_saves (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO authenticated;
GRANT ALL ON public.game_saves TO service_role;
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own save read" ON public.game_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own save insert" ON public.game_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own save update" ON public.game_saves FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own save delete" ON public.game_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);