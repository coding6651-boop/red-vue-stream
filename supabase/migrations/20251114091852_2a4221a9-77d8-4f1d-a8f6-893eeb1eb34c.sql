-- Fix search_path for update_video_views_count function
CREATE OR REPLACE FUNCTION public.update_video_views_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.videos 
  SET views_count = views_count + 1 
  WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$;