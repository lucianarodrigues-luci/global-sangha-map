import { Event } from "@/types/Event";

/**
 * Call-to-action button (specs.md FR-007, FR-008, FR-009).
 *
 * CTA target priority is resolved upstream in the parser (Zoom → Registration →
 * Website → Email). Here we only choose the label:
 *   - "Join" when there is a direct join/registration/website URL.
 *   - "Ask to Join" when we only have a contact email.
 */
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

  const label = event.joinUrl ? "Join" : "Ask to Join";
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
