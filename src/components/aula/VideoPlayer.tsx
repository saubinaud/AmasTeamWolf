interface VideoPlayerProps {
  youtubeId?: string | null;
  videoUrl?: string | null;
  orientacion?: string | null;
}

export function VideoPlayer({ youtubeId, videoUrl, orientacion }: VideoPlayerProps) {
  const isVertical = orientacion === 'vertical';

  // Direct video URL (uploaded file)
  if (videoUrl) {
    return (
      <div className={`rounded-xl overflow-hidden bg-black ${isVertical ? 'max-w-sm mx-auto' : ''}`}>
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className={isVertical
            ? 'w-full max-h-[75vh] object-contain mx-auto'
            : 'w-full aspect-video object-contain'
          }
        />
      </div>
    );
  }

  // YouTube embed
  if (youtubeId) {
    return (
      <div className={`rounded-xl overflow-hidden ${isVertical ? 'max-w-sm mx-auto' : ''}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1`}
          className={isVertical ? 'w-full aspect-[9/16]' : 'w-full aspect-video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
          loading="lazy"
          title="Clase de Taekwondo"
        />
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
      <p className="text-white/40 text-sm">Video no disponible</p>
    </div>
  );
}
