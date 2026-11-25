import Image from "next/image";
import { Button, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import { assetPath } from "@/lib/assetPath";
import LeatherLabel from "./LeatherLabel";

// Homepage hero (spec: src/docs/hero-section.md, design: version A).
// Phone: one centered column. Desktop (md+): logo and copy on the start side, label on the end side.
// Unprefixed classes are the phone layout; `md:` classes add the desktop layout.

const notes: MessageKey[] = ["home.hero.noteDelivery", "home.hero.noteReturns", "home.hero.noteCod"];

export default function HeroSection() {
  const { t, locale } = useTranslation();

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
            src={assetPath("/brand/needle-logo-cream.webp")}
            alt={t("home.hero.logoAlt")}
            width={807}
            height={606}
            priority
            sizes="(min-width: 768px) 440px, min(78vw, 290px)"
            className="block h-auto w-[min(78%,290px)] md:-ms-3.5 md:w-[440px]"
          />

          <div className="grid justify-items-center gap-3.5 md:justify-items-start">
            <Typography variant="eyebrow" className="text-champagne/62">
              {t("home.hero.eyebrow")}
            </Typography>

            <Typography variant="display" className="max-w-[15ch] rtl:[&_em]:text-leather">
              {t("home.hero.headlineStart")}
              {/* Markazi Text has no italic, so in Arabic the phrase is set off by color instead. */}
              <em>{t("home.hero.headlineEm")}</em>
              {t("home.hero.headlineEnd")}
            </Typography>

            <div className="grid w-full max-w-80 gap-2.5 md:w-auto md:max-w-none md:grid-flow-col">
              <Button href={localePath(locale, "/shop")} tone="champagne" size="lg">
                {t("home.hero.shop")}
              </Button>
              <Button href={localePath(locale, "/shop?sort=new")} variant="outline" tone="champagne" size="lg">
                {t("home.hero.newArrivals")}
              </Button>
            </div>
          </div>
        </div>

        {/* End side: the hanging leather label */}
        <LeatherLabel alt={t("home.hero.labelAlt")} />
      </div>

      {/* Stitched seam and the service notes */}
      <div className="mx-5 mb-[22px] border-t-[1.5px] border-dashed border-champagne/40 md:mx-14" />
      <ul
        className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 px-5 pb-[26px] text-champagne/62
                   md:justify-start md:gap-[34px] md:px-14 md:pb-7"
      >
        {notes.map((note) => (
          <Typography key={note} as="li" variant="note" className="whitespace-nowrap">
            {t(note)}
          </Typography>
        ))}
      </ul>
    </section>
  );
}
