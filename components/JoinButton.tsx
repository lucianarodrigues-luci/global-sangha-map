import { Event } from "@/types/Event";

/**
 * Call-to-action (specs.md FR-007, FR-008, FR-009).
 *
 * Two shapes, depending on what the event offers:
 *
 *  1. A link (Zoom → Registration → Website, resolved upstream) renders a pill
 *     button with an honest label so an in-person "More info" link is never
 *     confused with an online "Join online" link:
 *       - Zoom link         → "Join online"
 *       - Registration link → "Register"
 *       - Website link      → "More info"
 *
 *  2. Only a contact email renders the address *visibly* as a mailto link. A
 *     bare "Ask to Join" button looked broken when the visitor had no mail
 *     client configured (the click appeared to do nothing) and never showed the
 *     address to copy. Now the email is on screen, selectable, and clickable.
 *
 * Returns null when the event provides neither (caller shows a note).
 */
function linkLabel(kind: Event["joinUrlKind"]): string {
  switch (kind) {
    case "zoom":
      return "Join online";
    case "registration":
      return "Register";
    default:
      return "More info";
  }
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
  // 1. Direct link → pill button.
  if (event.joinUrl) {
    const label = linkLabel(event.joinUrlKind);
    const sizing = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-base";
    return (
      <a
        href={event.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}: ${event.title}`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-primary font-semibold text-white shadow-soft transition-colors duration-200 hover:bg-[#15336b] focus-visible:bg-[#15336b] ${sizing} ${className}`}
      >
        {label}
        <span aria-hidden="true">→</span>
      </a>
    );
  }

  // 2. Email only → the "Ask to Join" pill (opens the visitor's mail app) AND
  //    the address shown in plain text, so it still works / is copyable when no
  //    mail client is configured.
  if (event.contactEmail) {
    const subject = encodeURIComponent(`Joining: ${event.title}`);
    const mailto = `mailto:${event.contactEmail}?subject=${subject}`;
    const sizing = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-base";
    return (
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
        <a
          href={mailto}
          aria-label={`Ask to Join: ${event.title}`}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-primary font-semibold text-white shadow-soft transition-colors duration-200 hover:bg-[#15336b] focus-visible:bg-[#15336b] ${sizing}`}
        >
          Ask to Join
          <span aria-hidden="true">→</span>
        </a>
        <a
          href={mailto}
          className="text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
          {event.contactEmail}
        </a>
      </div>
    );
  }

  return null;
}
