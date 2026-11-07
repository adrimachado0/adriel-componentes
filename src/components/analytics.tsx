"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check } from "lucide-react";
import {
  excludeThisBrowser,
  flushPendingEvents,
  includeThisBrowser,
  track,
  UMAMI_SCRIPT_URL,
  UMAMI_WEBSITE_ID,
  type AnalyticsEvent,
  type EventData,
} from "@/lib/analytics";

const NOTICE_MS = 5000;

/**
 * Loads Umami (production only) and handles the owner's switches:
 *   ?no-contar → this browser is no longer counted,
 *   ?contar    → it is counted again.
 * The switch is applied before the script loads, so not even that visit counts.
 */
export function Analytics({ enabled }: { enabled: boolean }) {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    let message: string | null = null;
    if (url.searchParams.has("no-contar")) {
      excludeThisBrowser();
      message = "Listo: tus visitas desde este navegador ya no se cuentan.";
    } else if (url.searchParams.has("contar")) {
      includeThisBrowser();
      message = "Listo: este navegador vuelve a contar en las estadísticas.";
    }
    if (message) {
      url.searchParams.delete("no-contar");
      url.searchParams.delete("contar");
      window.history.replaceState(window.history.state, "", url);
      // Shown after the first paint, so it slides in like the other notices.
      const shown = message;
      requestAnimationFrame(() => setNotice(shown));
    }

    if (enabled) loadUmami();
  }, [enabled]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+var(--bottom-bar-h))] z-50 flex justify-center px-4 sm:bottom-6 sm:px-24"
    >
      <AnimatePresence>
        {notice ? (
          <m.div
            key="notice"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-card-sm bg-ink py-2.5 pr-4 pl-3 text-white shadow-dialog"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
              <Check className="size-4" strokeWidth={2.6} aria-hidden />
            </span>
            <span className="text-sm font-bold">{notice}</span>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function loadUmami() {
  if (document.querySelector(`script[src="${UMAMI_SCRIPT_URL}"]`)) return;
  const script = document.createElement("script");
  script.src = UMAMI_SCRIPT_URL;
  script.defer = true;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.addEventListener("load", flushPendingEvents);
  document.head.appendChild(script);
}

/** Admin panel: the owner's browser is never counted, without remembering ?no-contar. */
export function ExcludeFromAnalytics() {
  useEffect(excludeThisBrowser, []);
  return null;
}

/**
 * Sends one event when it mounts and whenever the data changes (e.g. the
 * product viewed or the brand chosen). Renders nothing.
 */
export function TrackEvent({
  event,
  data,
}: {
  event: AnalyticsEvent;
  data: EventData;
}) {
  const key = JSON.stringify(data);
  useEffect(() => {
    track(event, JSON.parse(key) as EventData);
  }, [event, key]);
  return null;
}
