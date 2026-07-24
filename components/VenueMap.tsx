"use client";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapVenue {
  id: string;
  name: string;
  ort?: string;
  lat: number;
  lng: number;
  teams: number;
  directionDeg: number | null;
}

export function VenueMap({ venues }: { venues: MapVenue[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !ref.current) return;
      map = new maplibregl.Map({
        container: ref.current,
        style: "https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json",
        center: [7.6, 46.98],
        zoom: 8.2,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      for (const v of venues) {
        const hasDir = v.directionDeg != null;
        const el = document.createElement("div");
        el.className = "venue-marker";
        el.style.cssText = `width:${hasDir ? 26 : 14}px;height:${hasDir ? 26 : 14}px;`;
        el.innerHTML = hasDir
          ? `<svg viewBox="0 0 26 26" width="26" height="26" style="transform:rotate(${v.directionDeg}deg)">
               <circle cx="13" cy="13" r="6" fill="#d1953c" stroke="#7f4b1c" stroke-width="1.5"/>
               <path d="M13 1 L16 7 L10 7 Z" fill="#2a78d6" stroke="#184f95" stroke-width="0.8"/>
             </svg>`
          : `<div style="width:12px;height:12px;border-radius:50%;background:#45762a;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;

        const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;font-size:13px;line-height:1.4">
             <strong>${escapeHtml(v.name)}</strong><br/>
             ${v.ort ? escapeHtml(v.ort) + "<br/>" : ""}
             <span style="color:#666">${v.teams} Mannschaft${v.teams === 1 ? "" : "en"}</span>
             ${hasDir ? `<br/><span style="color:#2a78d6;font-weight:600">Spielrichtung ${Math.round(v.directionDeg!)}°</span>` : ""}
           </div>`,
        );
        new maplibregl.Marker({ element: el }).setLngLat([v.lng, v.lat]).setPopup(popup).addTo(map);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [venues]);

  return <div ref={ref} className="h-[520px] w-full overflow-hidden rounded-2xl border border-[var(--border)]" />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
