import { useState } from "react";
import { Eye, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VideoCardProps {
  id: string;
  title: string;
  coverUrl: string;
  views: number;
  likes: number;
}

export const VideoCard = ({ id, title, coverUrl, views, likes }: VideoCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-card cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/video/${id}`)}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-70"
          }`}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-primary" />
            <span>{likes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-0 border-2 border-primary rounded-xl transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
