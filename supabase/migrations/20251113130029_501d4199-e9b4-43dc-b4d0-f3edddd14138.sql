-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos
CREATE POLICY "Anyone can view videos"
  ON public.videos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage videos"
  ON public.videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create video likes table
CREATE TABLE public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id),
  UNIQUE(video_id, ip_address)
);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for video likes
CREATE POLICY "Anyone can view likes"
  ON public.video_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON public.video_likes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND ip_address IS NOT NULL)
  );

CREATE POLICY "Users can delete their own likes"
  ON public.video_likes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND ip_address IS NOT NULL)
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true);

-- Storage policies for videos bucket
CREATE POLICY "Admins can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Admins can delete videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Storage policies for covers bucket
CREATE POLICY "Admins can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anyone can view covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Admins can delete covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Function to update video stats
CREATE OR REPLACE FUNCTION public.update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update likes count
CREATE TRIGGER on_video_like_change
  AFTER INSERT OR DELETE ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for videos updated_at
CREATE TRIGGER set_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();