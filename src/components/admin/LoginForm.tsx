import { useState } from "react";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";

export default function LoginForm({ onSubmit }: { onSubmit: (email: string, password: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    try {
      await onSubmit(email.trim(), password);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {failed && <Alert severity="error">{t("admin.login.failed")}</Alert>}
      <TextField
        label={t("admin.login.email")}
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        slotProps={{ htmlInput: { dir: "ltr", inputMode: "email" } }}
      />
      <TextField
        label={t("admin.login.password")}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        slotProps={{ htmlInput: { dir: "ltr" } }}
      />
      <Button type="submit" fullWidth disabled={busy || !email || !password}>
        {t("admin.login.submit")}
      </Button>
    </form>
  );
}
