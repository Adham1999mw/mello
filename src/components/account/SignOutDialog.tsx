import { useEffect, useRef, useState } from "react";
import { Button, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";

// "Are you sure you want to sign out?" Uses the native <dialog> (focus stays inside, Esc closes).
// Phones: a sheet from the bottom with the buttons in thumb reach. From md: a card in the middle.
//
//   <SignOutDialog open={open} onClose={() => setOpen(false)} onConfirm={signOutNow} />

type SignOutDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function SignOutDialog({ open, onClose, onConfirm }: SignOutDialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="sign-out-title"
      aria-describedby="sign-out-body"
      onClose={onClose}
      // A tap on the dimmed backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="signout-dialog m-0 mt-auto max-h-none w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/45 md:m-auto md:w-[440px]"
    >
      <div className="grid gap-5 rounded-t-sheet bg-ivory px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] md:rounded-sheet md:p-8">
        <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-ink/[0.14] md:hidden" />
        <div className="grid gap-2">
          <Typography variant="h2" id="sign-out-title">
            {t("account.signOutDialog.title")}
          </Typography>
          <Typography variant="bodySm" color="muted" id="sign-out-body">
            {t("account.signOutDialog.body")}
          </Typography>
        </div>
        <div className="grid gap-2">
          <Button shape="field" fullWidth onClick={confirm} disabled={busy}>
            {t("account.signOutDialog.confirm")}
          </Button>
          <Button variant="text" shape="field" fullWidth onClick={onClose} autoFocus>
            {t("account.signOutDialog.cancel")}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
