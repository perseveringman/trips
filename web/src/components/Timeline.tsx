import { useEffect, useMemo, useState } from "react";
import type { TripStore } from "../store";
import type { Entity, TripEvent } from "../lib/types";
import {
  iconForType,
  PERIODS,
  entityToPeriod,
  eventToPeriod,
  type HistoricalPeriod,
} from "../lib/constants";

interface PeriodBucket {
  period: HistoricalPeriod;
  events: (TripEvent & { year: number })[];
  entities: Entity[];
}

export default function Timeline({
  useStore,
  isMobile,
}: {
  useStore: TripStore;
  isMobile: boolean;
}) {
  const events = useStore((s) => s.data.events);
  const entities = useStore((s) => s.data.entities);
  const selectedId = useStore((s) => s.selectedId);
  const setSelected = useStore((s) => s.setSelected);
  const open = useStore((s) => s.timelineOpen);
  const setOpen = useStore((s) => s.setTimelineOpen);

  const [activePeriod, setActivePeriod] = useState<string | null>(null);

  // Auto-open timeline on mobile
  useEffect(() => {
    if (isMobile && events.length > 0) setOpen(true);
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build period buckets
  const buckets = useMemo(() => {
    const periodMap = new Map<string, { events: (TripEvent & { year: number })[]; entities: Entity[] }>();

    // Classify events
    for (const ev of events) {
      const pid = eventToPeriod(ev);
      if (!pid || ev.year == null) continue;
      if (!periodMap.has(pid)) periodMap.set(pid, { events: [], entities: [] });
      periodMap.get(pid)!.events.push(ev as TripEvent & { year: number });
    }

    // Classify entities
    for (const ent of entities) {
      const pid = entityToPeriod(ent, events);
      if (!pid) continue;
      if (!periodMap.has(pid)) periodMap.set(pid, { events: [], entities: [] });
      periodMap.get(pid)!.entities.push(ent);
    }

    // Build ordered buckets (only periods with content)
    const result: PeriodBucket[] = [];
    for (const p of PERIODS) {
      const data = periodMap.get(p.id);
      if (!data || (data.events.length === 0 && data.entities.length === 0)) continue;
      // Sort events by year ascending
      data.events.sort((a, b) => a.year - b.year);
      result.push({ period: p, events: data.events, entities: data.entities });
    }
    return result;
  }, [events, entities]);

  // Total count for the bar
  const totalCount = useMemo(
    () => buckets.reduce((sum, b) => sum + b.events.length + b.entities.length, 0),
    [buckets],
  );

  if (!events.length && !entities.length) return null;

  const formatYear = (y: number) => (y < 0 ? `前${-y}` : `${y}`);

  const formatRange = (p: HistoricalPeriod) => {
    const s = p.startYear < 0 ? `BC ${-p.startYear}` : `AD ${p.startYear}`;
    const e = p.endYear < 0 ? `BC ${-p.endYear}` : `AD ${p.endYear}`;
    return `${s} – ${e}`;
  };

  const activeBucket = activePeriod
    ? buckets.find((b) => b.period.id === activePeriod)
    : null;

  return (
    <div className={`timeline ${open ? "open" : "closed"}`}>
      {/* Title bar */}
      <div className="bar" onClick={() => setOpen(!open)}>
        <span>📅 历史时间轴</span>
        <span className="count">{totalCount}</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: "var(--muted)" }}>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <>
          {/* Period pill track */}
          <div className="period-track">
            {buckets.map((b) => {
              const count = b.events.length + b.entities.length;
              const isActive = activePeriod === b.period.id;
              return (
                <button
                  key={b.period.id}
                  className={`period-pill${isActive ? " active" : ""}${
                    selectedId &&
                    (b.entities.some((e) => e.id === selectedId))
                      ? " hit"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePeriod(isActive ? null : b.period.id)
                  }
                >
                  <span className="pill-emoji">{b.period.emoji}</span>
                  <span className="pill-name">{b.period.name}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Expanded panel for the active period */}
          {activeBucket && (
            <div className="period-panel">
              <div className="period-panel-head">
                <span className="period-panel-emoji">
                  {activeBucket.period.emoji}
                </span>
                <span className="period-panel-name">
                  {activeBucket.period.name}
                </span>
                <span className="period-panel-range">
                  {formatRange(activeBucket.period)}
                </span>
                <button
                  className="period-panel-close"
                  onClick={() => setActivePeriod(null)}
                >
                  ×
                </button>
              </div>

              <div className={`period-panel-body${isMobile ? " mobile" : ""}`}>
                {/* Events */}
                {activeBucket.events.length > 0 && (
                  <div className="period-events">
                    {activeBucket.events.map((ev) => (
                      <div key={ev.id} className="period-evt-row">
                        <span className="evt-year">
                          {formatYear(ev.year)}
                        </span>
                        <span className="evt-summary">{ev.summary}</span>
                        {/* Inline entity chips for event actors/places */}
                        {[...ev.places, ...ev.actors].length > 0 && (
                          <span className="evt-inline-chips">
                            {[...ev.places, ...ev.actors].map((ref) => {
                              const ent = entities.find(
                                (e) => e.id === ref,
                              );
                              if (!ent) return null;
                              const { emoji } = iconForType(ent.type);
                              return (
                                <button
                                  key={ref}
                                  className={`entity-chip mini${
                                    selectedId === ref ? " selected" : ""
                                  }`}
                                  onClick={() => setSelected(ref)}
                                  title={ent.summary}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Entities */}
                {activeBucket.entities.length > 0 && (
                  <div className="period-entities">
                    {activeBucket.entities.map((ent) => {
                      const { emoji } = iconForType(ent.type);
                      return (
                        <button
                          key={ent.id}
                          className={`entity-chip${
                            selectedId === ent.id ? " selected" : ""
                          }`}
                          onClick={() => setSelected(ent.id)}
                          title={ent.summary}
                        >
                          {emoji} {ent.id}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
