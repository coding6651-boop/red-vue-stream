import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Trash2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);

  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    checkAdminAccess();
    loadVideos();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in");
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    if (!roleData) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }
    
    setIsAdmin(true);
  };

  const loadVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    
    setVideos(data || []);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile || !coverFile) {
      toast.error("Please select both video and cover image");
      return;
    }

    setUploading(true);

    try {
      // Upload video
      const videoPath = `${Date.now()}-${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile);

      if (videoError) throw videoError;

      // Upload cover
      const coverPath = `${Date.now()}-${coverFile.name}`;
      const { error: coverError } = await supabase.storage
        .from("covers")
        .upload(coverPath, coverFile);

      if (coverError) throw coverError;

      // Get public URLs
      const { data: videoUrl } = supabase.storage
        .from("videos")
        .getPublicUrl(videoPath);

      const { data: coverUrl } = supabase.storage
        .from("covers")
        .getPublicUrl(coverPath);

      // Auto-generate title from video filename
      const autoTitle = videoFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      // Create video record
      const { error: dbError } = await supabase
        .from("videos")
        .insert({
          title: autoTitle,
          description,
          video_url: videoUrl.publicUrl,
          cover_url: coverUrl.publicUrl,
        });

      if (dbError) throw dbError;

      toast.success("Video uploaded successfully!");
      setDescription("");
      setVideoFile(null);
      setCoverFile(null);
      loadVideos();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Video deleted");
      loadVideos();
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Admin Panel
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle>Upload New Video</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-secondary border-border"
                    placeholder="Enter video description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video">Video File</Label>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">Cover Image</Label>
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    required
                    className="bg-secondary border-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 shadow-red"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Manage Videos</h2>
            {videos.length === 0 ? (
              <p className="text-muted-foreground">No videos uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {videos.map((video) => (
                  <Card key={video.id} className="border-border bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={video.cover_url}
                          alt={video.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {video.views_count} views • {video.likes_count} likes
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(video.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
