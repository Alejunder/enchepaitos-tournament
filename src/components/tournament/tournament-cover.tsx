import Image from "next/image";

import { cn } from "@/lib/utils";

export function TournamentCover({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return null;
  }

  return (
    <div className={cn("relative overflow-hidden bg-black/40", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        className="object-cover"
      />
    </div>
  );
}
