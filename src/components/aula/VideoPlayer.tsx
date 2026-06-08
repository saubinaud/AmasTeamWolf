interface VideoPlayerProps {
  youtubeId: string;
}

export function VideoPlayer({ youtubeId }: VideoPlayerProps) {
  if (!youtubeId) {
    return (
      <div className="w-full aspect-video rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
        <p className="text-white/40 text-sm">Video no disponible</p>
      </div>
    );
  }

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
