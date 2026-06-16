import { Event } from "@/types/Event";

/**
 * Call-to-action button (specs.md FR-007, FR-008, FR-009).
 *
 * CTA target priority is resolved upstream in the parser (Zoom → Registration →
 * Website → Email). Here we choose an honest label for what the link does, so
 * an in-person event's "More info" link is never confused with an online
 * "Join online" link:
 *   - Zoom link         → "Join online"
 *   - Registration link → "Register"
 *   - Website link      → "More info"
 *   - Email only        → "Ask to Join"
 * Returns null when the event provides no link at all (caller shows a note).
 */
function ctaLabel(event: Event): string {
  if (event.joinUrl) {
    switch (event.joinUrlKind) {
      case "zoom":
        return "Join online";
      case "registration":
        return "Register";
      default:
        return "More info";
    }
  }
  return "Ask to Join";
}

export function JoinButton({
  event,
  size = "md",
  className = "",
}: {
  event: Event;
  size?: "sm" | "md";
  className?: string;
}) {
  const href = event.joinUrl
    ? event.joinUrl
    : event.contactEmail
    ? `mailto:${event.contactEmail}`
    : undefined;

  if (!href) return null;

  const label = ctaLabel(event);
  const isExternal = Boolean(event.joinUrl);

  const sizing = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-base";

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={`${label}: ${event.title}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-primary font-semibold text-white shadow-soft transition-colors duration-200 hover:bg-[#15336b] focus-visible:bg-[#15336b] ${sizing} ${className}`}
    >
      {label}
      <span aria-hidden="true">→</span>
    </a>
  );
}
