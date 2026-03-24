"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface PokemonImageProps extends Partial<Omit<ImageProps, "src" | "alt">> {
  fallbackSrc?: string;
  src?: string;
  alt: string;
}

export function PokemonImage({
  fallbackSrc = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
  src,
  alt,
  ...props
}: PokemonImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <Image
      {...props}
      src={imgSrc || fallbackSrc}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
