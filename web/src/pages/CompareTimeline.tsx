import { useCallback, useMemo, useRef, useState } from "react";
import type { TripData, TripEvent } from "../lib/types";
import { PERIODS } from "../lib/constants";
import {
  OTHER_CIVILIZATIONS,
  MIN_YEAR,
  MAX_YEAR,
  BASE_WIDTH,
  type Civilization,
  type CivEvent,
} from "../lib/civilizations";

/* ── Helpers ── */

const formatYear = (y: number) =>
  y < 0 ? `前${-y}年` : y === 0 ? "公元元年" : `${y}年`;

const formatYearShort = (y: number) =>
  y < 0 ? `BC${-y}` : y === 0 ? "0" : `AD${y}`;

/* ── Build Egypt row from trip.json ── */

function buildEgyptCiv(data: TripData): Civilization {
  const events: CivEvent[] = data.events
    .filter((e): e is TripEvent & { year: number } => typeof e.year === "number")
    .map((e) => ({ year: e.year, summary: e.summary }));
  return {
    id: "egypt",
    name: "埃及",
    emoji: "🏛️",
    color: "#d4a017",
    startYear: -3100,
    endYear: 2025,
    events,
  };
}

/* ── Time ruler ticks ── */

function generateTicks(zoom: number): number[] {
  let step: number;
  if (zoom >= 3) step = 100;
  else if (zoom >= 1.5) step = 200;
  else if (zoom >= 0.6) step = 500;
  else step = 1000;

  const ticks: number[] = [];
  const start = Math.ceil(MIN_YEAR / step) * step;
  for (let y = start; y <= MAX_YEAR; y += step) {
    ticks.push(y);
  }
  return ticks;
}

/* ── Sub-components ── */

function Header({ slug }: { slug: string }) {
  return (
    <div className="compare-header">
      <a className="compare-back" href={`#/t/${encodeURIComponent(slug)}`}>
        ← 返回旅行
      </a>
      <h1 className="compare-title">⏳ 跨文明历史对比</h1>
    </div>
  );
}

function Toolbar({
  zoom,
  setZoom,
  onScrollToPeriod,
}: {
  zoom: number;
  setZoom: (z: number) => void;
  onScrollToPeriod: (startYear: number) => void;
}) {
  return (
    <div className="compare-toolbar">
      <div className="compare-zoom">
        <button onClick={() => setZoom(Math.max(0.3, +(zoom - 0.2).toFixed(1)))}>−</button>
        <input
          type="range"
          min="0.3"
          max="5"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <button onClick={() => setZoom(Math.min(5, +(zoom + 0.2).toFixed(1)))}>+</button>
        <span className="compare-zoom-label">{zoom.toFixed(1)}x</span>
      </div>
      <div className="compare-period-nav">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            className="compare-period-btn"
            onClick={() => onScrollToPeriod(p.startYear)}
            title={`${p.name} (${formatYearShort(p.startYear)})`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeRuler({
  yearToX,
  zoom,
  totalWidth,
}: {
  yearToX: (y: number) => number;
  zoom: number;
  totalWidth: number;
}) {
  const ticks = useMemo(() => generateTicks(zoom), [zoom]);
  return (
    <div className="compare-ruler" style={{ width: totalWidth }}>
      {ticks.map((y) => (
        <div
          key={y}
          className="compare-tick"
          style={{ left: yearToX(y) }}
        >
          <div className="compare-tick-line" />
          <span className="compare-tick-label">{formatYearShort(y)}</span>
        </div>
      ))}
    </div>
  );
}

function PeriodBands({
  yearToX,
  totalWidth,
}: {
  yearToX: (y: number) => number;
  totalWidth: number;
}) {
  return (
    <div className="compare-bands" style={{ width: totalWidth }}>
      {PERIODS.map((p, i) => {
        const left = yearToX(p.startYear);
        const right = yearToX(p.endYear);
        return (
          <div
            key={p.id}
            className={`compare-band ${i % 2 === 0 ? "even" : "odd"}`}
            style={{ left, width: right - left }}
          >
            <span className="compare-band-label">{p.emoji} {p.name}</span>
          </div>
        );
      })}
      {PERIODS.map((p) => (
        <div
          key={`line-${p.id}`}
          className="compare-period-line"
          style={{ left: yearToX(p.startYear) }}
        />
      ))}
    </div>
  );
}

function CivRow({
  civ,
  yearToX,
  totalWidth,
  onSelect,
  selectedEvent,
}: {
  civ: Civilization;
  yearToX: (y: number) => number;
  totalWidth: number;
  onSelect: (civ: Civilization, ev: CivEvent) => void;
  selectedEvent: { civId: string; year: number } | null;
}) {
  const spanLeft = yearToX(civ.startYear);
  const spanWidth = yearToX(civ.endYear) - spanLeft;

  return (
    <div className="compare-row">
      <div className="compare-row-label" style={{ borderLeftColor: civ.color }}>
        <span className="compare-row-emoji">{civ.emoji}</span>
        <span className="compare-row-name">{civ.name}</span>
      </div>
      <div className="compare-row-track" style={{ width: totalWidth }}>
        <div
          className="compare-span-bar"
          style={{
            left: spanLeft,
            width: spanWidth,
            backgroundColor: civ.color,
          }}
        />
        {civ.events.map((ev, i) => {
          const x = yearToX(ev.year);
          const isSelected =
            selectedEvent?.civId === civ.id && selectedEvent.year === ev.year;
          return (
            <button
              key={`${ev.year}-${i}`}
              className={`compare-event-dot${isSelected ? " selected" : ""}${ev.relation ? " has-relation" : ""}`}
              style={{ left: x, backgroundColor: civ.color }}
              onClick={() => onSelect(civ, ev)}
              title={`${formatYear(ev.year)} — ${ev.summary}`}
            >
              <span className="compare-dot-tooltip">
                <strong>{formatYear(ev.year)}</strong>
                <br />
                {ev.summary}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventDetail({
  civ,
  event,
  onClose,
}: {
  civ: Civilization;
  event: CivEvent;
  onClose: () => void;
}) {
  return (
    <div className="compare-detail">
      <div className="compare-detail-head">
        <span className="compare-detail-civ" style={{ color: civ.color }}>
          {civ.emoji} {civ.name}
        </span>
        <span className="compare-detail-year">{formatYear(event.year)}</span>
        <span className="compare-detail-summary">{event.summary}</span>
        <button className="compare-detail-close" onClick={onClose}>×</button>
      </div>
      {event.relation && (
        <div className="compare-detail-relation">
          🔗 <strong>与埃及的关联：</strong>{event.relation}
        </div>
      )}
    </div>
  );
}

/* ── Main Page Component ── */

interface Props {
  data: TripData;
  slug: string;
}

export default function CompareTimeline({ data, slug }: Props) {
  const [zoom, setZoom] = useState(0.8);
  const [selected, setSelected] = useState<{
    civ: Civilization;
    event: CivEvent;
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const egyptCiv = useMemo(() => buildEgyptCiv(data), [data]);
  const allCivs = useMemo(
    () => [egyptCiv, ...OTHER_CIVILIZATIONS],
    [egyptCiv],
  );

  const totalWidth = BASE_WIDTH * zoom;

  const yearToX = useCallback(
    (y: number) => ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * totalWidth,
    [totalWidth],
  );

  const handleScrollToPeriod = useCallback(
    (startYear: number) => {
      if (!viewportRef.current) return;
      const x = ((startYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * totalWidth;
      viewportRef.current.scrollTo({ left: Math.max(0, x - 60), behavior: "smooth" });
    },
    [totalWidth],
  );

  const handleSelect = useCallback((civ: Civilization, ev: CivEvent) => {
    setSelected((prev) =>
      prev && prev.civ.id === civ.id && prev.event.year === ev.year
        ? null
        : { civ, event: ev },
    );
  }, []);

  const selectedRef = selected
    ? { civId: selected.civ.id, year: selected.event.year }
    : null;

  return (
    <div className="compare-page">
      <Header slug={slug} />
      <Toolbar
        zoom={zoom}
        setZoom={setZoom}
        onScrollToPeriod={handleScrollToPeriod}
      />

      <div className="compare-viewport" ref={viewportRef}>
        <div className="compare-canvas" style={{ width: totalWidth }}>
          <PeriodBands yearToX={yearToX} totalWidth={totalWidth} />
          <TimeRuler yearToX={yearToX} zoom={zoom} totalWidth={totalWidth} />
          <div className="compare-rows">
            {allCivs.map((civ) => (
              <CivRow
                key={civ.id}
                civ={civ}
                yearToX={yearToX}
                totalWidth={totalWidth}
                onSelect={handleSelect}
                selectedEvent={selectedRef}
              />
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <EventDetail
          civ={selected.civ}
          event={selected.event}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
