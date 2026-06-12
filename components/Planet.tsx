import { mediaUrl } from "@/lib/media";
import type { CSSProperties } from "react";

export default function Planet({
  src,
  alt,
  size,
  color,
  sticker,
  rotation = "-3deg",
  withOrbit = false,
}: {
  src: string;
  alt: string;
  size: number;
  color: string;
  sticker?: string;
  rotation?: string;
  withOrbit?: boolean;
}) {
  const style = {
    "--planet-glow": `${color}59`, // ~35% Alpha
    "--sticker-shadow": `${color}8C`, // ~55% Alpha
    "--rot": rotation,
  } as CSSProperties;

  return (
    <span className="planet-wrap" style={style}>
      {withOrbit && <span className="orbit" />}
      <img className="planet" src={mediaUrl(src)} alt={alt} width={size} height={size} />
      {sticker && (
        <span className="sticker" style={{ position: "absolute", top: -10, right: -18 }}>
          {sticker}
        </span>
      )}
    </span>
  );
}
