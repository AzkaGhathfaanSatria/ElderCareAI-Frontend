import Image from "next/image";

interface BrandMarkProps {
  /** Sisi kotak logo dalam piksel. */
  size?: number;
  /** Warna latar kotak: cokelat tua (default) atau aksen. */
  tone?: "ink" | "accent";
  /** Kelas radius, mis. "rounded-lg". */
  rounded?: string;
  className?: string;
}

/** Logo ElderCare AI (hati dengan dua orang berpelukan) di dalam kotak berwarna. */
function BrandMark({
  size = 40,
  tone = "ink",
  rounded = "rounded-xl",
  className = "",
}: BrandMarkProps) {
  const background = tone === "accent" ? "bg-accent" : "bg-ink";
  const inner = Math.round(size * 0.74);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center shadow-sm ${background} ${rounded} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image src="/logo-mark.png" alt="" width={inner} height={inner} priority />
    </span>
  );
}

export default BrandMark;
