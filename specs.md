# Global Sangha Map MVP - Complete Specification

## Project Overview

Build a production-quality MVP web application that visualizes Tergar community activities happening around the world.

The application must automatically read events from a public Google Calendar, determine where activities are taking place, and display them on an interactive world map.

The purpose is to create a public-facing experience that reinforces the feeling of a global sangha and allows visitors to discover and join community activities happening today or on future dates.

The MVP should be deployable on Vercel and require minimal ongoing maintenance.

---

# Project Goals

## Primary Goals

* Display Tergar community activities happening around the world.
* Visualize activities on an interactive world map.
* Promote awareness of the global Tergar sangha.
* Allow users to discover events occurring today.
* Allow users to navigate future dates.
* Provide a direct way to join or contact each event.
* Automatically update from Google Calendar.

## Secondary Goals

* Create a visually compelling public experience.
* Demonstrate the worldwide reach of Tergar communities.
* Provide a foundation for future integration with events.tergar.org.

---

# Technology Stack (Mandatory)

## Frontend

* Next.js 15 (App Router)
* React 19
* TypeScript
* TailwindCSS

## Mapping

* Leaflet
* React Leaflet
* OpenStreetMap tiles

## Data Sources

### Phase 1

Public Google Calendar

Calendar ID:

[tergar.org_m5aemau76dov0it82j05fun6hg@group.calendar.google.com](mailto:tergar.org_m5aemau76dov0it82j05fun6hg@group.calendar.google.com)

### Future Phase

events.tergar.org integration

---

# Hosting

## MVP

* Vercel Free Tier

## Future Production

* Vercel Pro
* Tergar infrastructure
* WordPress integration if required

---

# Functional Requirements

## FR-001 World Map

Display a full-width interactive world map.

Requirements:

* Zoom enabled
* Pan enabled
* Marker clustering enabled
* Mobile responsive
* Desktop responsive

---

## FR-002 Calendar Integration

Read events automatically from Google Calendar.

Requirements:

* Fetch future events
* Fetch recurring events
* Parse title
* Parse description
* Parse location
* Parse start date
* Parse end date

No manual event entry should be required.

---

## FR-003 Date Navigation

Users must be able to:

* View today's events
* View future events
* View previous dates
* Select dates from a calendar picker

Default selected date:

Current day

---

## FR-004 Location Detection

Determine where events occur.

Priority order:

### Method 1

Use Google Calendar Location field.

### Method 2

Extract location from title.

Examples:

* Hosted by Tergar Madrid
* Tergar São Paulo Practice Group
* Vancouver Community Meditation

### Method 3

Extract location from description.

The system should attempt to determine:

* City
* Country

---

## FR-005 Geocoding

Convert event locations into coordinates.

Requirements:

* Use OpenStreetMap Nominatim API
* Cache results permanently
* Never geocode the same location twice

Output:

* Latitude
* Longitude

---

## FR-006 Online Events

Events without a valid location must be classified as:

onlineOnly = true

Online events must:

* Not appear on the map
* Appear inside a dedicated section

Section title:

Online Global Activities

---

## FR-007 Marker Interaction

Clicking a marker opens a popup.

Popup displays:

* Event title
* City
* Country
* Event time
* Join button

---

## FR-008 Event Sidebar

Display all events for the selected date.

Each event card displays:

* Title
* Time
* Location
* Join button

Clicking a card:

* Centers map
* Highlights corresponding marker

---

## FR-009 Join Link Detection

Parse event descriptions.

Detect:

* Zoom links
* Registration links
* Websites
* Email addresses

CTA Priority:

1. Zoom URL
2. Registration URL
3. Website URL
4. Email

Button label:

Join / Ask to Join

---

## FR-010 User Timezone Conversion

Display event times in:

* Original timezone
* Visitor's local timezone

Automatically detect visitor timezone.

---

# Data Model

```typescript
export interface Event {
  id: string;

  title: string;
  description: string;

  startDate: string;
  endDate: string;

  city?: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  joinUrl?: string;
  contactEmail?: string;

  timezone?: string;

  isOnlineOnly: boolean;
}
```

---

# Application Structure

```text
/app
  page.tsx

/components
  Header.tsx
  WorldMap.tsx
  EventSidebar.tsx
  EventCard.tsx
  DateSelector.tsx
  OnlineEvents.tsx
  StatisticsBar.tsx

/lib
  calendar.ts
  parser.ts
  geocoder.ts
  cache.ts

/types
  Event.ts

/public
  images
```

---

# Layout Requirements

## Desktop

Header

Statistics Bar

Date Navigation

Online Activities

Event Sidebar | World Map

---

## Mobile

Header

Statistics Bar

Date Navigation

Online Activities

World Map

Event List

---

# Homepage Content

## Title

Global Sangha Map

## Subtitle

Discover meditation practice groups, community gatherings, and events happening around the world today.

---

# Statistics Bar

Display:

* Activities Today
* Countries Represented
* Online Activities

Example:

🌍 24 Activities Today

🌎 18 Countries Represented

💻 8 Online Activities

---

# Branding Requirements

## Mandatory Brand References

Follow:

https://tergar.org/aam-brand-guidelines

https://tergar.org/tergar-brand-guidelines

All design decisions must align with Tergar branding.

---

## Design Principles

The interface should feel:

* Calm
* Spacious
* Welcoming
* Global
* Contemporary
* Meditation-oriented

Avoid:

* SaaS dashboard appearance
* Corporate styling
* Visual clutter
* Aggressive animations

---

## Typography

Preferred fonts:

* Nunito Sans
* Source Serif Pro

Fallback:

* System fonts

---

## Color Palette

Primary Green

#77B254

Zen Dawn

#F5DDB2

Bamboo

#9DC884

Space Blue

#424A58

Midnight

#292B33

White

#FFFFFF

Use only colors from brand guidelines.

---

## Color Usage

Primary CTA

#77B254

Body Text

#424A58

Cards

#FFFFFF

Background

#F9F9FB

Borders

#C1C7D1

---

## Map Marker Colors

Online Events

#77B254

Community Activities

#9DC884

Special Events

#F5DDB2

Selected Event

#424A58

---

## UI Style

Use:

* Rounded corners
* Soft shadows
* Generous spacing
* Large typography
* Minimal visual noise

Avoid:

* Sharp corners
* Dense layouts
* Heavy borders
* Excessive gradients

---

## Logo Usage

Use official Tergar logo.

Requirements:

* Maintain proportions
* Respect clear space
* No recoloring
* No shadow effects

---

## Animation Guidelines

Allowed:

* Fade in
* Smooth transitions
* Gentle hover states

Avoid:

* Bounce effects
* Flashing effects
* Fast movement
* Gamification elements

---

# Accessibility Requirements

Must support:

* Keyboard navigation
* WCAG AA contrast standards
* Screen reader labels
* Accessible buttons
* Accessible map markers

---

# Caching Requirements

## Calendar Cache

Refresh every 6 hours.

## Geocoding Cache

Permanent cache.

Store as local JSON files.

Database is not required for MVP.

---

# Performance Requirements

Initial page load:

Less than 3 seconds

Map rendering:

Less than 1 second after data load

Lighthouse score target:

90+

---

# Nice-to-Have Features

Implement if straightforward:

* Marker clustering
* Country counter
* Activity counter
* User timezone conversion
* Smooth map animations

---

# Explicitly Out of Scope

Do not implement:

* Authentication
* User accounts
* Event editing
* Admin dashboard
* Database
* Event submission
* Multi-language UI
* events.tergar.org integration

These belong to future phases.

---

# Deliverables

The final solution must include:

1. Complete Next.js application
2. TypeScript codebase
3. TailwindCSS styling
4. Responsive design
5. Google Calendar integration
6. Geocoding implementation
7. Interactive world map
8. Online events section
9. Statistics bar
10. README.md
11. .env.example
12. Vercel deployment configuration

---

# Success Criteria

The MVP is successful when:

* Events automatically populate from Google Calendar.
* Activities appear correctly on a world map.
* Online events appear in a dedicated section.
* Users can navigate future dates.
* Users can join activities from a single click.
* The experience clearly communicates the existence of a global Tergar sangha.
* No daily manual maintenance is required.
* The application can later be embedded into Tergar websites.
