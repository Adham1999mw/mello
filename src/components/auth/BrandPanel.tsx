import Image from "next/image";
import Link from "next/link";
import { IconButton, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { assetPath } from "@/lib/assetPath";
import { BackIcon, CloseIcon } from "./AuthIcons";
import { Emphasis } from "./AuthHeader";

// The burgundy side of the sign-in pages: the leather label over a fine weave, with a stitched
// thread running across. Phones: a short band above the form sheet, with back and close buttons.
// From md: the full-height half of the page with the brand line at the bottom.

type BrandPanelProps = {
  /** Back button target on phones. Leave out to go back in history. */
  onBack?: () => void;
  /** Where the close button goes on phones (the page she came from, or home). */
  closeHref: string;
};

export default function BrandPanel({ onBack, closeHref }: BrandPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="auth-panel-bg relative h-[calc(236px+env(safe-area-inset-top,0px))] overflow-hidden pt-[env(safe-area-inset-top,0px)] text-champagne md:h-auto md:min-h-dvh md:pt-0">
      <svg
        viewBox="0 0 600 800"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="auth-thread pointer-events-none absolute inset-0 size-full"
      >
        <path d="M-20 140 C 140 60, 220 300, 330 250 S 520 120, 640 220" />
        <path d="M-20 640 C 160 560, 260 720, 380 660 S 540 560, 640 600" opacity="0.3" />
      </svg>

      <div className="relative z-10 flex justify-between px-2 pt-1 md:hidden">
        <IconButton label={t("auth.brand.back")} tone="current" onClick={onBack ?? (() => history.back())}>
          <BackIcon />
        </IconButton>
        <Link
          href={closeHref}
          aria-label={t("auth.brand.close")}
          className="flex size-11 items-center justify-center hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <CloseIcon />
        </Link>
      </div>

      <div className="absolute inset-x-0 top-[calc(50%+env(safe-area-inset-top,0px)/2-6px)] flex -translate-y-1/2 justify-center md:top-[44%]">
        <Image
          src={assetPath("/brand/needle-label.webp")}
          alt=""
          width={900}
          height={635}
          priority
          sizes="(min-width: 768px) 330px, 168px"
          className="h-auto w-[168px] -rotate-[5deg] drop-shadow-[0_18px_22px_rgb(0_0_0/0.45)] md:w-[min(330px,60%)]"
        />
      </div>

      <div className="absolute inset-x-14 bottom-12 hidden gap-5 text-center md:grid">
        <Typography variant="h2" as="p" className="text-balance rtl:[&_em]:not-italic">
          <Emphasis text={t("auth.brand.quote")} />
        </Typography>
        <Typography
          variant="note"
          className="flex items-center justify-center gap-3.5 opacity-75 before:h-px before:w-10 before:bg-current after:h-px after:w-10 after:bg-current"
        >
          {t("auth.brand.made")}
        </Typography>
      </div>
    </aside>
  );
}
