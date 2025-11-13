import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard } from "@/components/VideoCard";
import { Navbar } from "@/components/Navbar";
import { Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  cover_url: string;
  views_count: number;
  likes_count: number;
}

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Trending Videos
          </h1>
          <p className="text-muted-foreground">
            Discover the latest and most popular content
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No videos available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                coverUrl={video.cover_url}
                views={video.views_count}
                likes={video.likes_count}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
