"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

import { Event } from "@/types/Event";
import { markerColor } from "@/lib/category";
import { JoinButton } from "./JoinButton";
import { formatTimeInZone, timeZoneLabel } from "@/lib/datetime";

/**
 * Interactive world map (specs.md FR-001, FR-007).
 *   - Full-width, zoom + pan enabled, marker clustering, responsive.
 *   - OpenStreetMap tiles via Leaflet / React Leaflet.
 *   - Markers colored by category; selected marker uses the "selected" color.
 *   - Online-only events are excluded (handled by the caller).
 *   - Clicking a marker opens a popup: title, city, country, time, join button.
 */

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

/** Build a brand-colored circular pin as a Leaflet divIcon. */
function pinIcon(color: string, selected: boolean): L.DivIcon {
  const size = selected ? 22 : 18;
  return L.divIcon({
    className: "",
    html: `<span class="sangha-marker" style="display:block;width:${size}px;height:${size}px;background:${color};"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Cluster bubble styling (brand-aligned). */
function clusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div>${count}</div>`,
    className: "marker-cluster-sangha",
    iconSize: L.point(40, 40, true),
  });
}

/** Imperatively pans/zooms the map when the selected event changes (FR-008). */
function MapController({
  selectedEvent,
}: {
  selectedEvent: Event | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (
      selectedEvent &&
      typeof selectedEvent.latitude === "number" &&
      typeof selectedEvent.longitude === "number"
    ) {
      // Smooth, gentle pan — no aggressive animation (per brand guidelines).
      map.flyTo([selectedEvent.latitude, selectedEvent.longitude], Math.max(map.getZoom(), 6), {
        duration: 1.2,
      });
    }
  }, [selectedEvent, map]);
  return null;
}

export default function WorldMap({
  events,
  visitorTimeZone,
  selectedEventId,
  onSelect,
}: {
  events: Event[];
  visitorTimeZone: string;
  selectedEventId: string | null;
  onSelect: (event: Event) => void;
}) {
  // Only events with coordinates appear on the map.
  const mapped = useMemo(
    () =>
      events.filter(
        (e) =>
          !e.isOnlineOnly &&
          typeof e.latitude === "number" &&
          typeof e.longitude === "number"
      ),
    [events]
  );

  const selectedEvent = useMemo(
    () => mapped.find((e) => e.id === selectedEventId) ?? null,
    [mapped, selectedEventId]
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      worldCopyJump
      className="h-full w-full"
      aria-label="World map of Tergar community activities"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedEvent={selectedEvent} />

      <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon}>
        {mapped.map((event) => {
          const selected = event.id === selectedEventId;
          const time = formatTimeInZone(event.startDate, event.timezone);
          const tz = timeZoneLabel(event.startDate, event.timezone);
          return (
            <Marker
              key={event.id}
              position={[event.latitude as number, event.longitude as number]}
              icon={pinIcon(markerColor(event, selected), selected)}
              keyboard
              title={event.title}
              alt={`${event.title} — ${[event.city, event.country].filter(Boolean).join(", ")}`}
              eventHandlers={{ click: () => onSelect(event) }}
            >
              <Popup>
                <div className="min-w-[12rem] space-y-1.5">
                  <h3 className="text-base font-semibold text-midnight">{event.title}</h3>
                  <p className="text-sm text-space-blue/80">
                    📍 {[event.city, event.country].filter(Boolean).join(", ") || "—"}
                  </p>
                  <p className="text-sm text-space-blue/80">
                    🕑 {time} {tz}
                  </p>
                  <div className="pt-1">
                    <JoinButton event={event} size="sm" />
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
