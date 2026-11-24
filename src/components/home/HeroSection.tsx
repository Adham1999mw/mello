import Image from "next/image";
import Link from "next/link";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import { asset, useLocalePath } from "@/i18n/static";
import LeatherLabel from "./LeatherLabel";

// Homepage hero (spec: src/docs/hero-section.md, design: version A).
// Phone: one centered column. Desktop (md+): logo and copy on the start side, label on the end side.
// Unprefixed classes are the phone layout; `md:` classes add the desktop layout.

// Shared button styles. English: small uppercase with wide spacing. Arabic: 14px, no spacing.
const button =
  "inline-flex min-h-12 items-center justify-center rounded-brand border px-[26px] text-xs leading-none font-medium tracking-[0.24em] uppercase " +
  "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-champagne " +
  "md:min-h-[52px] md:px-8 rtl:text-sm rtl:tracking-normal rtl:normal-case";

const notes: MessageKey[] = ["home.hero.noteDelivery", "home.hero.noteReturns", "home.hero.noteCod"];

export default function HeroSection() {
  const { t } = useTranslation();
  const localePath = useLocalePath();

  return (
    // Top padding leaves room for the header that floats on top (Header `overlay`):
    // 48px + 25px monogram on phones, 30px + 30px on desktop.
    // `id="hero"`: the BottomNav stays hidden while this section is on screen.
    <section id="hero" className="hero-bg relative isolate overflow-hidden pt-[73px] text-champagne md:pt-[60px]">
      <div
        className="grid justify-items-center gap-[26px] px-5 pt-6 pb-10 text-center
                   md:min-h-[560px] md:grid-cols-[1.05fr_.95fr] md:items-center md:justify-items-start
                   md:gap-10 md:px-14 md:pt-[30px] md:pb-[52px] md:text-start"
      >
        {/* Start side: logo, then the copy */}
        <div className="grid justify-items-center gap-[18px] md:justify-items-start md:gap-[30px]">
          <Image
            src={asset("/brand/needle-logo-cream.webp")}
            alt={t("home.hero.logoAlt")}
            width={807}
            height={606}
            priority
            sizes="(min-width: 768px) 440px, min(78vw, 290px)"
            className="block h-auto w-[min(78%,290px)] md:-ms-3.5 md:w-[440px]"
          />

          <div className="grid justify-items-center gap-3.5 md:justify-items-start">
            <p className="text-[11px] leading-none tracking-[0.32em] text-champagne/62 uppercase md:text-xs rtl:text-[13px] rtl:tracking-normal">
              {t("home.hero.eyebrow")}
            </p>

            <h1 className="max-w-[15ch] font-display text-[30px] leading-[1.12] text-balance md:text-[52px] rtl:leading-[1.5] md:rtl:text-[48px]">
              {t("home.hero.headlineStart")}
              <em>{t("home.hero.headlineEm")}</em>
              {t("home.hero.headlineEnd")}
            </h1>

            <div className="grid w-full max-w-80 gap-2.5 md:w-auto md:max-w-none md:grid-flow-col">
              <Link href={localePath("/shop")} className={`${button} border-champagne bg-champagne text-burgundy-deep`}>
                {t("home.hero.shop")}
              </Link>
              <Link href={localePath("/shop?sort=new")} className={`${button} border-champagne/45 text-champagne`}>
                {t("home.hero.newArrivals")}
              </Link>
            </div>
          </div>
        </div>

        {/* End side: the hanging leather label */}
        <LeatherLabel alt={t("home.hero.labelAlt")} />
      </div>

      {/* Stitched seam and the service notes */}
      <div className="mx-5 mb-[22px] border-t-[1.5px] border-dashed border-champagne/40 md:mx-14" />
      <ul
        className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 px-5 pb-[26px] text-[10px] leading-[1.4] tracking-[0.2em] text-champagne/62 uppercase
                   md:justify-start md:gap-[34px] md:px-14 md:pb-7 rtl:text-sm rtl:tracking-normal"
      >
        {notes.map((note) => (
          <li key={note} className="whitespace-nowrap">
            {t(note)}
          </li>
        ))}
      </ul>
    </section>
  );
}
