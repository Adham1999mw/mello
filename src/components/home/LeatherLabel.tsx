import Image from "next/image";
import { asset } from "@/i18n/static";

// The leather "Made in Egypt" label with its size tab, hanging from a dashed thread.
// Thread and label swing together as one pendulum around the top of the thread
// (the `.hero-label` class in globals.css).
export default function LeatherLabel({ alt }: { alt: string }) {
  return (
    <div className="w-[min(84%,300px)] md:w-full md:max-w-[500px] md:justify-self-center">
      <div className="hero-label relative pt-[54px] md:pt-[70px]">
        {/* Thread: dashed line from the pivot down to the label */}
        <svg
          viewBox="0 0 2 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-x-0 top-0 mx-auto h-[58px] w-0.5 md:h-[76px]"
        >
          <line x1="1" y1="0" x2="1" y2="80" className="stroke-champagne" strokeWidth="1.4" strokeDasharray="5 5" />
        </svg>

        <Image
          src={asset("/brand/needle-label.webp")}
          alt={alt}
          width={900}
          height={635}
          sizes="(min-width: 768px) 500px, min(84vw, 300px)"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}
