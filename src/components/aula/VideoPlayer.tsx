interface VideoPlayerProps {
  youtubeId?: string | null;
  videoUrl?: string | null;
  orientacion?: string | null; // 'vertical' | 'horizontal'
}

export function VideoPlayer({ youtubeId, videoUrl, orientacion }: VideoPlayerProps) {
  const isVertical = orientacion === 'vertical';
  // vertical = 9:16 aspect, horizontal = 16:9
  const aspectClass = isVertical ? 'aspect-[9/16] max-h-[80vh]' : 'aspect-video';

  // Direct video URL (uploaded file)
  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className={`w-full rounded-xl bg-black ${isVertical ? 'max-h-[80vh] object-contain' : 'aspect-video'}`}
      />
    );
  }

  // YouTube embed
  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1`}
        className={`w-full rounded-xl ${aspectClass}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        allowFullScreen
        loading="lazy"
        title="Clase de Taekwondo"
      />
    );
  }

  return (
    <div className={`w-full rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center ${aspectClass}`}>
      <p className="text-white/40 text-sm">Video no disponible</p>
    </div>
  );
}
