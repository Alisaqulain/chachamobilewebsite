/**
 * Shared layout for interior marketing pages: readable width, glass card, safe-area padding.
 */
export default function SiteContentPage({ kicker, title, subtitle, children, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,102,0,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,102,0,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px] dark:bg-indigo-500/15" />
      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
        <article className="page-3d-enter rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 sm:p-9 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">{kicker}</p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-white/72 sm:text-lg">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </article>
      </div>
    </div>
  );
}
