import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <Typography variant="h2" component="h1" className="font-bold tracking-tight">
        Mello
      </Typography>
      <Typography variant="body1" className="max-w-md text-foreground/70">
        Our store is coming soon.
      </Typography>
      {/* MUI component styled further with Tailwind utilities */}
      <Button variant="contained" size="large" className="rounded-full px-8">
        Shop now
      </Button>
    </main>
  );
}
