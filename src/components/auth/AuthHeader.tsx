import { Fragment, type ReactNode } from "react";
import { Typography } from "@/components/ui";

/** Renders "Let's start with *you*" with the starred part in an <em>. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

type AuthHeaderProps = {
  eyebrow: string;
  /** May contain one *emphasised* part: italic wine in English, wine in Arabic. */
  title: string;
  subtitle?: ReactNode;
  /** Id of the <h1>, so the page can move focus to it when the step changes. */
  titleId?: string;
};

/** Eyebrow, title and subtitle at the top of every sign-in screen. The title is the page's <h1>. */
export default function AuthHeader({ eyebrow, title, subtitle, titleId }: AuthHeaderProps) {
  return (
    <header className="grid gap-2">
      <Typography variant="eyebrow" color="wine">
        {eyebrow}
      </Typography>
      <Typography
        variant="h1"
        color="burgundy"
        id={titleId}
        tabIndex={-1}
        className="text-balance outline-none [&_em]:text-wine rtl:[&_em]:not-italic"
      >
        <Emphasis text={title} />
      </Typography>
      {subtitle && <Typography color="muted">{subtitle}</Typography>}
    </header>
  );
}
