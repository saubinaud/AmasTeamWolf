interface VideoPlayerProps {
  youtubeId?: string | null;
  videoUrl?: string | null;
}

export function VideoPlayer({ youtubeId, videoUrl }: VideoPlayerProps) {
  // Direct video URL (uploaded file)
  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full aspect-video rounded-xl bg-black"
      />
    );
  }

  // YouTube embed
  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1`}
        className="w-full aspect-video rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        allowFullScreen
        loading="lazy"
        title="Clase de Taekwondo"
      />
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
      <p className="text-white/40 text-sm">Video no disponible</p>
    </div>
  );
}
