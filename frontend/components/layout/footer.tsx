export function Footer() {
  return (
    <footer className="w-full bg-[var(--surface-container-lowest)]/90 backdrop-blur-md border-t border-white/[0.06] shadow-[0_-1px_8px_rgba(0,0,0,0.5)] z-40 mt-auto">
      <div className="w-full px-6 md:px-10 h-10 flex items-center justify-between text-[var(--on-surface-variant)] font-mono text-[11px]">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap text-ellipsis">
          <span className="flex items-center gap-1.5 text-[var(--primary)] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            LIVE TELEMETRY STREAM
          </span>
          <span className="text-[var(--outline-variant)]">|</span>
          <span>
            Station: <strong className="text-[var(--on-surface)]">EPA Downtown #4</strong>
          </span>
          <span className="text-[var(--outline-variant)]">•</span>
          <span>
            Sensor Freshness: <strong className="text-[var(--primary)]">99.8%</strong>
          </span>
          <span className="text-[var(--outline-variant)]">•</span>
          <span className="hidden sm:inline">
            Next Satellite Pass: <strong className="text-[var(--tertiary)]">in 24m</strong>
          </span>
          <span className="text-[var(--outline-variant)] hidden sm:inline">•</span>
          <span className="hidden md:inline">
            Wind: <strong className="text-[var(--on-surface)]">11 mph SW</strong>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0 font-mono text-[11px]">
          <span>BREATHEWISE ATMOSPHERIC ENGINE v2.4</span>
          <span className="text-[var(--outline-variant)]">•</span>
          <span className="text-[var(--primary)] font-semibold">ENVIRO-SYNCHRONIZED</span>
        </div>
      </div>
    </footer>
  );
}
