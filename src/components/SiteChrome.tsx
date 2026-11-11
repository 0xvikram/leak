import Link from "next/link";

export const REPO = "https://github.com/0xvikram/leak";
export const OTARI = "https://otari.ai";

/** Mozilla's Otari mark as a plain badge, so "powered by" is visible on every page. */
export function PoweredByOtari({ className = "" }: { className?: string }) {
  return (
    <a
      href={OTARI}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" />
      Powered by <span className="font-medium text-foreground">Mozilla Otari</span>
    </a>
  );
}

export function SiteNav() {
  const links = [
    ["/how-it-works", "How it works"],
    ["/#privacy", "Privacy"],
    ["/otari", "Powered by Otari"],
    ["/app?sample=1", "Try the sample"],
  ];
  return (
    <nav className="sticky top-0 z-40 bg-background/70 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-medium tracking-tight">
          leak<span className="grad-text">.</span>
        </Link>
        <div className="hidden justify-self-center rounded-full border border-line bg-surface/80 p-1 text-[13px] md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full px-4 py-1.5 text-muted transition-colors hover:bg-raised hover:text-foreground">
              {label}
            </Link>
          ))}
        </div>
        <Link href="/app" className="pill-white col-start-3 px-4 py-2 text-[13px] font-medium">
          Open the app
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <div className="text-xl font-medium tracking-tight">
            leak<span className="grad-text">.</span>
          </div>
          <p className="mt-2 max-w-xs text-muted">
            Find the money leaking out of your bank account. Open-weight models only, and your account numbers never reach one.
          </p>
          <PoweredByOtari className="mt-4" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted">Product</span>
          <Link href="/app" className="hover:text-accent">
            Open the app
          </Link>
          <Link href="/app?sample=1" className="hover:text-accent">
            Try the sample
          </Link>
          <Link href="/how-it-works" className="hover:text-accent">
            How it works
          </Link>
          <Link href="/#privacy" className="hover:text-accent">
            Privacy
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted">Built on</span>
          <Link href="/otari" className="hover:text-accent">
            Powered by Otari
          </Link>
          <a href={OTARI} target="_blank" rel="noreferrer" className="hover:text-accent">
            otari.ai
          </a>
          <a href={REPO} target="_blank" rel="noreferrer" className="hover:text-accent">
            Source on GitHub
          </a>
          <a href="https://otari.ai/devs-wilding" target="_blank" rel="noreferrer" className="hover:text-accent">
            MozFest Developers Wilding
          </a>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        Built for MozFest Developers Wilding 2026 · Powered by Mozilla Otari · MIT licensed · The sample statement is fictional
      </div>
    </footer>
  );
}
