import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Heart, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  views_count: number;
  likes_count: number;
}

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    if (id) {
      loadVideo();
    }
  }, [id]);

  const loadVideo = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setVideo(data);
      
      // Check if user has liked
      await checkLikeStatus();
    } catch (error) {
      console.error("Error loading video:", error);
      toast.error("Failed to load video");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from("video_likes")
        .select("*")
        .eq("video_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      setHasLiked(!!data);
    }
  };

  const handleVideoPlay = async () => {
    if (!viewCounted && id) {
      setViewCounted(true);
      await supabase
        .from("videos")
        .update({ views_count: (video?.views_count || 0) + 1 })
        .eq("id", id);
      
      if (video) {
        setVideo({ ...video, views_count: video.views_count + 1 });
      }
    }
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to like videos");
      return;
    }

    try {
      if (hasLiked) {
        await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", id)
          .eq("user_id", user.id);
        
        setHasLiked(false);
        if (video) {
          setVideo({ ...video, likes_count: video.likes_count - 1 });
        }
        toast.success("Removed like");
      } else {
        await supabase
          .from("video_likes")
          .insert({ video_id: id, user_id: user.id });
        
        setHasLiked(true);
        if (video) {
          setVideo({ ...video, likes_count: video.likes_count + 1 });
        }
        toast.success("Liked!");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6 border-border"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>

        <div className="max-w-5xl mx-auto space-y-6">
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-glow">
            <video
              src={video.video_url}
              controls
              className="w-full h-full"
              onPlay={handleVideoPlay}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h1 className="text-3xl font-bold mb-4 text-foreground">
              {video.title}
            </h1>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-5 h-5" />
                <span className="text-lg">{video.views_count.toLocaleString()} views</span>
              </div>

              <Button
                onClick={handleLike}
                variant={hasLiked ? "default" : "outline"}
                className={hasLiked ? "bg-primary shadow-red" : "border-border"}
              >
                <Heart className={`w-5 h-5 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                {video.likes_count.toLocaleString()}
              </Button>
            </div>

            {video.description && (
              <div className="border-t border-border pt-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoPlayer;
