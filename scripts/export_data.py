#!/usr/bin/env python3
"""Export the wiki to a single JSON structure the explorer SPA consumes.

Writes `<trip>/data/trip.json`. The structure mirrors the `TripData` type in
web/src/lib/types.ts. Everything the front-end needs is bundled into one
file — entities (with full markdown body), events, session log and
recommendations (with bodies).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import (  # noqa: E402
    ensure_tree, now_iso, read_entity_md, read_json, split_frontmatter,
    trip_paths,
)

REC_KINDS = ("shots", "food", "itinerary", "spots")


def _camel(entity_fm: dict, body: str, file: str) -> dict:
    """Convert snake-ish frontmatter + body to the camelCase shape used by
    the front-end."""
    return {
        "id": entity_fm.get("id") or Path(file).stem,
        "type": entity_fm.get("type") or "concept",
        "aliases": list(entity_fm.get("aliases") or []),
        "coords": entity_fm.get("coords"),
        "coordsSource": entity_fm.get("coords_source"),
        "summary": entity_fm.get("summary") or "",
        "tags": list(entity_fm.get("tags") or []),
        "related": list(entity_fm.get("related") or []),
        "anchors": list(entity_fm.get("anchors") or []),
        "mentionedAt": list(entity_fm.get("mentioned_at") or []),
        "body": body or "",
        "file": file,
        "image": entity_fm.get("image"),
        "imageCredit": entity_fm.get("image_credit"),
        "imageSource": entity_fm.get("image_source"),
        "dynasty": entity_fm.get("dynasty"),
        "reign": entity_fm.get("reign"),
    }


def _read_session_log(log_path: Path) -> list[dict]:
    if not log_path.exists():
        return []
    out = []
    for line in log_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        out.append({"t": obj.get("t") or "",
                    "role": obj.get("role") or "",
                    "text": obj.get("text") or ""})
    return out


def _read_recommendations(root: Path) -> list[dict]:
    out = []
    rec_root = root / "recommendations"
    if not rec_root.exists():
        return out
    for kind in REC_KINDS:
        d = rec_root / kind
        if not d.exists():
            continue
        for f in sorted(d.glob("*.md")):
            try:
                fm, body = split_frontmatter(f.read_text(encoding="utf-8"))
            except Exception:
                continue
            out.append({
                "kind": kind,
                "place": fm.get("place") or f.stem,
                "file": str(f.relative_to(root)),
                "body": body,
            })
    return out


def _parse_events(timeline_path: Path, entities: list[dict] | None = None) -> list[dict]:
    """Timeline is maintained by ingest.py as `- **YEAR** — summary` lines.
    We also pick up structured events when a JSON sidecar exists.

    If `entities` is provided, we scan each event summary for entity ids and
    aliases, then auto-populate `places` and `actors` so the front-end can
    render clickable chips that jump to the entity drawer.
    """
    events_json = timeline_path.with_suffix(".json")
    raw: list[dict] = []
    if events_json.exists():
        try:
            raw = json.loads(events_json.read_text(encoding="utf-8"))
        except Exception:
            pass

    if not raw:
        if not timeline_path.exists():
            return []

        line_re = re.compile(r"^\s*-\s+\*\*([^*]+)\*\*\s*[—-]\s*(.+)$")
        for line in timeline_path.read_text(encoding="utf-8").splitlines():
            m = line_re.match(line)
            if not m:
                continue
            year_str = m.group(1).strip()
            summary = m.group(2).strip()
            try:
                year = int(year_str)
            except ValueError:
                year = None
            raw.append({
                "id": summary[:40],
                "year": year,
                "summary": summary,
                "places": [],
                "actors": [],
            })

    # If events already have populated places/actors, respect them.
    # Otherwise auto-match entities against the summary text.
    if entities:
        PLACE_LIKE = {
            "place", "city", "town", "village", "region", "district", "site",
            "ruin", "temple", "church", "mosque", "shrine", "palace", "museum",
            "gallery", "landmark", "monument", "tomb", "natural_feature",
            "mountain", "river", "lake", "sea", "desert", "island", "park",
        }
        PERSON_LIKE = {"pharaoh", "person", "ruler", "figure", "deity"}

        # Build lookup: all names → (entity_id, entity_type)
        name_map: dict[str, tuple[str, str]] = {}
        for e in entities:
            eid = e["id"]
            etype = (e.get("type") or "").lower()
            for name in [eid] + list(e.get("aliases") or []):
                if name and len(name) >= 2:
                    name_map[name] = (eid, etype)

        # Sort by length descending so longer names match before substrings
        sorted_names = sorted(name_map.keys(), key=len, reverse=True)

        for ev in raw:
            # Skip if already populated
            if ev.get("places") or ev.get("actors"):
                continue
            summary = ev.get("summary", "")
            found_places: list[str] = []
            found_actors: list[str] = []
            seen_ids: set[str] = set()
            for name in sorted_names:
                if name in summary:
                    eid, etype = name_map[name]
                    if eid in seen_ids:
                        continue
                    seen_ids.add(eid)
                    if etype in PERSON_LIKE:
                        found_actors.append(eid)
                    elif etype in PLACE_LIKE:
                        found_places.append(eid)
                    else:
                        # concept / unknown: treat as place if it has coords
                        e_obj = next((x for x in entities if x["id"] == eid), None)
                        if e_obj and e_obj.get("coords"):
                            found_places.append(eid)
                        else:
                            found_actors.append(eid)
            ev["places"] = found_places
            ev["actors"] = found_actors

    return raw


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--trip-root", required=True)
    args = parser.parse_args()

    p = ensure_tree(args.trip_root)
    root = p["root"]

    entities = []
    for f in sorted(p["entities"].glob("*.md")):
        try:
            fm, body = read_entity_md(f)
        except Exception as e:
            print(f"  ! skip {f.name}: {e}", file=sys.stderr)
            continue
        entities.append(_camel(fm, body, str(f.relative_to(root))))

    # Auto-populate `anchors` for geocoded entities (they anchor themselves).
    # And for non-geo entities that forgot to supply anchors, derive from
    # `related` entries that are themselves places.
    by_id = {e["id"]: e for e in entities}
    for e in entities:
        if e["coords"] and not e["anchors"]:
            e["anchors"] = [e["id"]]
        elif not e["coords"] and not e["anchors"]:
            derived = []
            for rid in e["related"]:
                r = by_id.get(rid)
                if r and r["coords"]:
                    derived.append(rid)
            e["anchors"] = derived[:4]

    # Try to pick a destination label: the biggest region/country in the trip.
    dest = None
    for preferred_type in ("country", "region"):
        candidates = [e for e in entities if e["type"] == preferred_type]
        if candidates:
            dest = candidates[0]["id"]
            break
    if not dest:
        # fall back: look at .trip/SCHEMA.md's sibling for a `destination.txt`
        d = root / ".trip" / "destination.txt"
        if d.exists():
            dest = d.read_text(encoding="utf-8").strip() or None

    trip_data = {
        "version": 1,
        "destination": dest,
        "countryHint": (read_json(p["state"]) or {}).get("country_hint"),
        "entities": entities,
        "events": _parse_events(p["timeline"], entities),
        "sessionLog": _read_session_log(p["log"]),
        "recommendations": _read_recommendations(root),
        "generatedAt": now_iso(),
    }

    out_dir = root / "data"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "trip.json"
    out_file.write_text(json.dumps(trip_data, ensure_ascii=False),
                        encoding="utf-8")

    print(json.dumps({
        "ok": True,
        "entities": len(entities),
        "events": len(trip_data["events"]),
        "turns": len(trip_data["sessionLog"]),
        "recs": len(trip_data["recommendations"]),
        "bytes": out_file.stat().st_size,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
