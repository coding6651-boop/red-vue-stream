-- Create video_views table to track views
CREATE TABLE IF NOT EXISTS public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_views
CREATE POLICY "Anyone can insert views"
ON public.video_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view views"
ON public.video_views
FOR SELECT
USING (true);

-- Function to update video views count
CREATE OR REPLACE FUNCTION public.update_video_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.videos 
  SET views_count = views_count + 1 
  WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update views count automatically
CREATE TRIGGER on_video_view_created
  AFTER INSERT ON public.video_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_video_views_count();

-- Instructions: First sign up at /auth with email: ntwari@gmail.com and password: ntwari
-- Then run this SQL in the backend to grant admin role:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role
-- FROM auth.users
-- WHERE email = 'ntwari@gmail.com'
-- ON CONFLICT DO NOTHING;