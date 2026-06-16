/**
 * Site header (specs.md Layout "Header" + Homepage Content + Logo Usage).
 *
 * The official Tergar logo (symbol + wordmark, bicolor) is served from
 * /public/images/tergar-logo.png. Per brand guidelines it is shown at its
 * original proportions, with clear space, and is never recolored or given
 * shadow effects.
 */
export function Header() {
  return (
    <header className="w-full border-b border-hairline bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:gap-6 sm:py-8">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/tergar-logo.png"
            alt="Tergar"
            width={192}
            height={100}
            className="h-12 w-auto shrink-0 sm:h-14"
          />
          <div className="hidden h-10 w-px bg-hairline sm:block" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold leading-tight text-midnight sm:text-3xl md:text-4xl">
            Global Sangha Map
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-space-blue/80 sm:text-base">
            Discover meditation practice groups, community gatherings, and
            events happening around the world today.
          </p>
        </div>
      </div>
    </header>
  );
}
