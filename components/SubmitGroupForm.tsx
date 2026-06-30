"use client";

import { useState } from "react";

/**
 * Public submission form ("Add your group").
 *
 * Collects structured event/group data and submits it to Netlify Forms. Because
 * Next.js renders pages dynamically, Netlify cannot detect the form from the
 * React markup — a static `public/__forms.html` declares the same field names,
 * and this component POSTs to it (the documented Next.js + Netlify Forms
 * pattern). Field names here MUST match that file.
 *
 * Anti-spam: a hidden honeypot `bot-field` (declared via `netlify-honeypot`)
 * plus Netlify's built-in filtering. Nothing is published automatically —
 * submissions land in the Netlify dashboard for moderation.
 */

const FORM_NAME = "group-submission";

/**
 * Curated timezone list (IANA). Each group picks the LOCAL zone where it meets
 * so the map shows the correct local time. Extend as new centers join.
 */
const TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Chicago", label: "US — Central (Chicago, Minneapolis)" },
  { value: "America/New_York", label: "US/Canada — Eastern (New York, Montreal)" },
  { value: "America/Los_Angeles", label: "US — Pacific (Portland)" },
  { value: "America/Mexico_City", label: "Mexico (Mexico City)" },
  { value: "America/Sao_Paulo", label: "Brazil (São Paulo)" },
  { value: "Europe/London", label: "United Kingdom (London, Sussex)" },
  { value: "Europe/Lisbon", label: "Portugal (Lisbon)" },
  { value: "Europe/Madrid", label: "Spain (Madrid)" },
  { value: "Europe/Paris", label: "France (Paris)" },
  { value: "Europe/Berlin", label: "Germany (Munich, Berlin)" },
  { value: "Asia/Kolkata", label: "India (Kathmandu region — use Asia/Kolkata)" },
  { value: "Asia/Singapore", label: "Singapore / Malaysia" },
  { value: "Australia/Melbourne", label: "Australia (Melbourne)" },
];

type Format = "in-person" | "online" | "hybrid";
type Frequency = "one-time" | "weekly" | "monthly";
type Status = "idle" | "submitting" | "success" | "error";

const labelCls = "block text-sm font-semibold text-midnight";
const hintCls = "mt-1 text-xs text-muted";
const fieldCls =
  "mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-sm text-space-blue shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const sectionCls =
  "rounded-2xl border border-hairline bg-card p-5 shadow-soft sm:p-6";
const sectionTitleCls = "text-lg font-bold text-midnight";

export function SubmitGroupForm() {
  const [format, setFormat] = useState<Format>("in-person");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [status, setStatus] = useState<Status>("idle");

  const needsLocation = format !== "online";
  const needsOnlineLink = format !== "in-person";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const params = new URLSearchParams();
    params.append("form-name", FORM_NAME);
    data.forEach((value, key) => params.append(key, value.toString()));

    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      setStatus("success");
      formEl.reset();
    } catch (err) {
      console.error("[submit-group] form submission error:", err);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`${sectionCls} animate-fadeIn text-center`}>
        <h2 className="text-xl font-bold text-midnight">Thank you! 🙏</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-space-blue">
          Your group has been submitted. Our team will review it and, once
          approved, it will appear on the Global Sangha Map.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#15336b]"
        >
          Submit another group
        </button>
      </div>
    );
  }

  return (
    <form
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Honeypot: hidden from humans, catches bots. */}
      <p className="hidden">
        <label>
          Don&apos;t fill this out if you&apos;re human: <input name="bot-field" />
        </label>
      </p>

      {/* 1. About your group */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>About your group</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className={labelCls}>
              Group / event name <span className="text-primary">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Tergar Lisbon Practice Group"
              className={fieldCls}
            />
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>
              Short description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="One or two sentences about your gathering."
              className={fieldCls}
            />
          </div>
        </div>
      </section>

      {/* 2. Format */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>How do people attend?</h2>
        <fieldset className="mt-4">
          <legend className="sr-only">Format</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { v: "in-person", l: "In person" },
                { v: "online", l: "Online only" },
                { v: "hybrid", l: "Hybrid" },
              ] as { v: Format; l: string }[]
            ).map(({ v, l }) => (
              <label
                key={v}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  format === v
                    ? "border-primary bg-primary/5 text-midnight"
                    : "border-hairline text-space-blue hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={v}
                  checked={format === v}
                  onChange={() => setFormat(v)}
                  className="accent-primary"
                />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* 3. Location */}
      {needsLocation && (
        <section className={`${sectionCls} animate-fadeIn`}>
          <h2 className={sectionTitleCls}>Where you meet</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelCls}>
                City <span className="text-primary">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required={needsLocation}
                placeholder="e.g. Lisbon"
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelCls}>
                Country <span className="text-primary">*</span>
              </label>
              <input
                id="country"
                name="country"
                type="text"
                required={needsLocation}
                placeholder="e.g. Portugal"
                className={fieldCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="venue" className={labelCls}>
                Venue or address
              </label>
              <input
                id="venue"
                name="venue"
                type="text"
                placeholder="Helps place your marker accurately (optional)"
                className={fieldCls}
              />
            </div>
          </div>
        </section>
      )}

      {/* 4. When */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>When you meet</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="frequency" className={labelCls}>
              How often? <span className="text-primary">*</span>
            </label>
            <select
              id="frequency"
              name="frequency"
              required
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className={fieldCls}
            >
              <option value="one-time">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {frequency === "one-time" ? (
            <div>
              <label htmlFor="date" className={labelCls}>
                Date <span className="text-primary">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                className={fieldCls}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="day-of-week" className={labelCls}>
                  Day of the week <span className="text-primary">*</span>
                </label>
                <select
                  id="day-of-week"
                  name="day-of-week"
                  required
                  className={fieldCls}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a day
                  </option>
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              {frequency === "monthly" && (
                <div>
                  <label htmlFor="week-of-month" className={labelCls}>
                    Week of the month
                  </label>
                  <select
                    id="week-of-month"
                    name="week-of-month"
                    className={fieldCls}
                    defaultValue=""
                  >
                    <option value="">Any / every</option>
                    {["First", "Second", "Third", "Fourth", "Last"].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-time" className={labelCls}>
                Start time <span className="text-primary">*</span>
              </label>
              <input
                id="start-time"
                name="start-time"
                type="time"
                required
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="end-time" className={labelCls}>
                End time
              </label>
              <input
                id="end-time"
                name="end-time"
                type="time"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="timezone" className={labelCls}>
              Time zone <span className="text-primary">*</span>
            </label>
            <select
              id="timezone"
              name="timezone"
              required
              className={fieldCls}
              defaultValue=""
            >
              <option value="" disabled>
                Select your local time zone
              </option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className={hintCls}>
              ⚠️ Pick the local time zone where your group meets — not a central
              or office time zone. A 7:00 PM group in Lisbon picks
              &ldquo;Portugal (Lisbon)&rdquo; and enters 7:00 PM.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How to join */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>How people can join</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="online-link" className={labelCls}>
              Online join link (Zoom or video call)
              {needsOnlineLink && <span className="text-primary"> *</span>}
            </label>
            <input
              id="online-link"
              name="online-link"
              type="url"
              required={needsOnlineLink}
              placeholder="https://zoom.us/j/..."
              className={fieldCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="registration-link" className={labelCls}>
                Registration link
              </label>
              <input
                id="registration-link"
                name="registration-link"
                type="url"
                placeholder="Eventbrite, RSVP, form… (optional)"
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="website" className={labelCls}>
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="Your center's page (optional)"
                className={fieldCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-email" className={labelCls}>
              Contact email <span className="text-primary">*</span>
            </label>
            <input
              id="contact-email"
              name="contact-email"
              type="email"
              required
              placeholder="group@example.org"
              className={fieldCls}
            />
            <p className={hintCls}>
              Shown to visitors as &ldquo;Ask to Join&rdquo; when there&apos;s no
              online link.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Submitter */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>About you</h2>
        <p className="mt-1 text-sm text-muted">Not shown publicly.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="submitter-name" className={labelCls}>
              Your name
            </label>
            <input
              id="submitter-name"
              name="submitter-name"
              type="text"
              className={fieldCls}
            />
          </div>
          <div>
            <label htmlFor="submitter-email" className={labelCls}>
              Your email
            </label>
            <input
              id="submitter-email"
              name="submitter-email"
              type="email"
              placeholder="So we can confirm details if needed"
              className={fieldCls}
            />
          </div>
        </div>
      </section>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Something went wrong submitting the form. Please try again, or email us
          directly.
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-white shadow-soft transition-colors hover:bg-[#15336b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Submitting…" : "Submit my group"}
        </button>
        <p className="text-xs text-muted">
          Reviewed before appearing on the map.
        </p>
      </div>
    </form>
  );
}
