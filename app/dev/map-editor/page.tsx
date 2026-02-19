'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ROOM_CONFIG } from '@/app/lib/roomUtils';

// ── Types ──────────────────────────────────────────────────────────────────
type Point = { x: number; y: number };

interface ShapeData {
  roomName: string;
  floor: number;
  points: Point[];    // polygon vertices in SVG viewBox coordinates
}

// ── SVG dimensions per floor (mirrors FloorMap.tsx) ────────────────────────
const SVG_VIEWBOX: Record<number, { w: number; h: number }> = {
  0: { w: 1137, h: 627 },
  1: { w: 1290, h: 764 },
  2: { w: 1255, h: 764 },
  3: { w: 750,  h: 432 },
};

const FLOORS = [0, 1, 2, 3] as const;

// ── Helpers ────────────────────────────────────────────────────────────────
function ptOnSegment(
  p: Point,
  a: Point,
  b: Point,
  threshold = 8
): number | null {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const len2 = ab.x * ab.x + ab.y * ab.y;
  if (len2 === 0) return null;
  let t = ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * ab.x, y: a.y + t * ab.y };
  const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
  return dist <= threshold ? t : null;
}

// Returns the index AFTER which to insert the new point (or null)
function findEdgeInsertIndex(
  poly: Point[],
  p: Point,
  threshold = 8
): number | null {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (ptOnSegment(p, a, b, threshold) !== null) return i;
  }
  return null;
}

function toBoundingRect(pts: Point[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function MapEditorPage() {
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [placingRoom, setPlacingRoom] = useState<string | null>(null);

  // drag state for moving points
  const [dragging, setDragging] = useState<{
    shapeIdx: number;
    ptIdx: number;
  } | null>(null);

  // magnifier
  const [shift, setShift] = useState(false);
  const [cursorSvg, setCursorSvg] = useState<Point>({ x: 0, y: 0 });

  // export modal
  const [copied, setCopied] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // ── Current floor metadata ──────────────────────────────────────────────
  const { w: vbW, h: vbH } = SVG_VIEWBOX[selectedFloor] ?? { w: 1137, h: 627 };

  // ── Keyboard listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(true);
      if (e.key === 'Escape') setPlacingRoom(null);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ── Client → SVG coordinate conversion ─────────────────────────────────
  const toSvgPt = useCallback(
    (clientX: number, clientY: number): Point => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    []
  );

  // ── Mouse move – track cursor for magnifier ─────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const pt = toSvgPt(e.clientX, e.clientY);
      setCursorSvg(pt);

      if (!dragging) return;
      setShapes((prev) =>
        prev.map((s, si) => {
          if (si !== dragging.shapeIdx) return s;
          const newPts = s.points.map((p, pi) =>
            pi === dragging.ptIdx ? pt : p
          );
          return { ...s, points: newPts };
        })
      );
    },
    [dragging, toSvgPt]
  );

  // ── Click on canvas ─────────────────────────────────────────────────────
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!placingRoom) return;
      e.stopPropagation();
      const pt = toSvgPt(e.clientX, e.clientY);
      // Drop a default 120×80 rectangle centred on the click
      const hw = 60;
      const hh = 40;
      const newShape: ShapeData = {
        roomName: placingRoom,
        floor: selectedFloor,
        points: [
          { x: pt.x - hw, y: pt.y - hh },
          { x: pt.x + hw, y: pt.y - hh },
          { x: pt.x + hw, y: pt.y + hh },
          { x: pt.x - hw, y: pt.y + hh },
        ],
      };
      setShapes((prev) => {
        // Replace existing shape for same room on same floor
        const filtered = prev.filter(
          (s) => !(s.roomName === placingRoom && s.floor === selectedFloor)
        );
        return [...filtered, newShape];
      });
      setPlacingRoom(null);
    },
    [placingRoom, selectedFloor, toSvgPt]
  );

  // ── Double-click on a polygon edge → insert point ───────────────────────
  const handlePolyDblClick = useCallback(
    (
      e: React.MouseEvent<SVGPolygonElement>,
      shapeIdx: number
    ) => {
      e.stopPropagation();
      const pt = toSvgPt(e.clientX, e.clientY);
      const poly = shapes[shapeIdx].points;
      const insertAfter = findEdgeInsertIndex(poly, pt, 12);
      if (insertAfter === null) return;
      const newPts = [
        ...poly.slice(0, insertAfter + 1),
        pt,
        ...poly.slice(insertAfter + 1),
      ];
      setShapes((prev) =>
        prev.map((s, i) => (i === shapeIdx ? { ...s, points: newPts } : s))
      );
    },
    [shapes, toSvgPt]
  );

  // ── Mouse down on a vertex → start drag ────────────────────────────────
  const handleVertexMouseDown = useCallback(
    (
      e: React.MouseEvent<SVGCircleElement>,
      shapeIdx: number,
      ptIdx: number
    ) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging({ shapeIdx, ptIdx });
    },
    []
  );

  // ── Mouse up → stop drag ────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ── Right-click on vertex → delete it (min 3 pts) ───────────────────────
  const handleVertexCtxMenu = useCallback(
    (
      e: React.MouseEvent<SVGCircleElement>,
      shapeIdx: number,
      ptIdx: number
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setShapes((prev) =>
        prev.map((s, i) => {
          if (i !== shapeIdx || s.points.length <= 3) return s;
          return {
            ...s,
            points: s.points.filter((_, j) => j !== ptIdx),
          };
        })
      );
    },
    []
  );

  // ── Delete a whole shape ────────────────────────────────────────────────
  const deleteShape = useCallback((idx: number) => {
    setShapes((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Export ─────────────────────────────────────────────────────────────
  const exportJson = useCallback(() => {
    // Build a roomRects-compatible object (bounding boxes + full polygon)
    const result: Record<
      string,
      { floor: number; points: Point[]; x: number; y: number; w: number; h: number }
    > = {};
    shapes.forEach((s) => {
      const bb = toBoundingRect(s.points);
      result[s.roomName] = {
        floor: s.floor,
        points: s.points,
        ...bb,
      };
    });
    return JSON.stringify(result, null, 2);
  }, [shapes]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(exportJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportJson]);

  // ── Shapes visible on current floor ────────────────────────────────────
  const floorShapes = shapes.filter((s) => s.floor === selectedFloor);

  // ── Room list for current floor ─────────────────────────────────────────
  const roomList =
    ROOM_CONFIG[selectedFloor as keyof typeof ROOM_CONFIG] ?? [];

  // ── Cursor style ────────────────────────────────────────────────────────
  const svgCursor = placingRoom ? 'crosshair' : dragging ? 'grabbing' : 'default';

  // ── Magnifier zoom ──────────────────────────────────────────────────────
  const MAG_ZOOM = 4;
  const MAG_RADIUS = 80; // px in screen space
  const MAG_SVG_RADIUS = MAG_RADIUS / MAG_ZOOM; // half-size in SVG coords

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden select-none">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-1">
            Map Editor
          </h1>
          <p className="text-xs text-gray-500">
            Internal tool · /dev/map-editor
          </p>
        </div>

        {/* Floor selector */}
        <div className="p-4 border-b border-gray-800">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Floor
          </label>
          <select
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(Number(e.target.value));
              setPlacingRoom(null);
            }}
            className="w-full rounded bg-gray-800 border border-gray-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {FLOORS.map((f) => (
              <option key={f} value={f}>
                Floor {f}
              </option>
            ))}
          </select>
        </div>

        {/* Room list */}
        <div className="p-4 flex-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Rooms
          </label>
          <ul className="space-y-1">
            {roomList.map((room) => {
              const hasMapped = shapes.some(
                (s) => s.roomName === room.name && s.floor === selectedFloor
              );
              const isPlacing = placingRoom === room.name;
              return (
                <li key={room.name}>
                  <button
                    onClick={() =>
                      setPlacingRoom(isPlacing ? null : room.name)
                    }
                    className={[
                      'w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between',
                      isPlacing
                        ? 'bg-indigo-600 text-white'
                        : hasMapped
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
                    ].join(' ')}
                  >
                    <span className="truncate">{room.name}</span>
                    {hasMapped && (
                      <span className="ml-2 shrink-0 text-emerald-400 text-xs">
                        ✓
                      </span>
                    )}
                    {isPlacing && (
                      <span className="ml-2 shrink-0 text-yellow-300 text-xs">
                        click map
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 space-y-1">
          <p>· Click a room, then click the map to place a rectangle</p>
          <p>· Drag vertices to reshape</p>
          <p>· Double-click an edge to add a point</p>
          <p>· Right-click a vertex to delete it</p>
          <p>· Hold <kbd className="bg-gray-700 px-1 rounded">Shift</kbd> for magnifier</p>
          <p>· <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> cancels placement</p>
        </div>

        {/* Export */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleCopy}
            className="w-full rounded bg-indigo-700 hover:bg-indigo-600 text-sm font-medium py-2 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
              Preview JSON
            </summary>
            <pre className="mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-48 text-gray-300 text-[10px]">
              {exportJson()}
            </pre>
          </details>
        </div>
      </aside>

      {/* ── Main canvas ────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {placingRoom && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-indigo-700 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none">
            Click on the map to place <strong>{placingRoom}</strong>
            <span className="ml-3 text-indigo-200 text-xs">Esc to cancel</span>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="w-full h-full"
          style={{ cursor: svgCursor, display: 'block' }}
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Floor plan background */}
          <image
            href={`/svg/Z${selectedFloor}-Floor.svg`}
            x={0}
            y={0}
            width={vbW}
            height={vbH}
            preserveAspectRatio="none"
          />

          {/* Shapes */}
          {floorShapes.map((shape, si) => {
            const polyPts = shape.points.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <g key={`${shape.roomName}-${si}`}>
                {/* Fill */}
                <polygon
                  points={polyPts}
                  fill="rgba(99,102,241,0.25)"
                  stroke="rgba(99,102,241,0.9)"
                  strokeWidth={2}
                  onDoubleClick={(e) => handlePolyDblClick(e, si)}
                  style={{ cursor: 'default' }}
                />

                {/* Label */}
                {(() => {
                  const cx =
                    shape.points.reduce((s, p) => s + p.x, 0) /
                    shape.points.length;
                  const cy =
                    shape.points.reduce((s, p) => s + p.y, 0) /
                    shape.points.length;
                  return (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={14}
                      fill="white"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {shape.roomName}
                    </text>
                  );
                })()}

                {/* Delete button (top-right of bbox) */}
                {(() => {
                  const xs = shape.points.map((p) => p.x);
                  const ys = shape.points.map((p) => p.y);
                  const bx = Math.max(...xs);
                  const by = Math.min(...ys);
                  return (
                    <g
                      transform={`translate(${bx + 2},${by - 2})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteShape(si);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle r={9} fill="rgba(239,68,68,0.85)" />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fill="white"
                        style={{ userSelect: 'none' }}
                      >
                        ×
                      </text>
                    </g>
                  );
                })()}

                {/* Vertices */}
                {shape.points.map((pt, pi) => (
                  <circle
                    key={pi}
                    cx={pt.x}
                    cy={pt.y}
                    r={dragging?.shapeIdx === si && dragging.ptIdx === pi ? 8 : 6}
                    fill="rgba(99,102,241,0.9)"
                    stroke="white"
                    strokeWidth={1.5}
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => handleVertexMouseDown(e, si, pi)}
                    onContextMenu={(e) => handleVertexCtxMenu(e, si, pi)}
                  />
                ))}
              </g>
            );
          })}

          {/* ── Magnifier (Shift held) ── */}
          {shift && (() => {
            const cx = cursorSvg.x;
            const cy = cursorSvg.y;
            const clipId = 'mag-clip';
            // Magnifier frame in SVG units – we want it to appear as a circle
            // of roughly MAG_RADIUS screen pixels. We work purely in SVG coords
            // so we use a fixed SVG-unit radius and scale with a nested <g>.
            const svgR = MAG_SVG_RADIUS * MAG_ZOOM; // display radius in SVG coords
            return (
              <g style={{ pointerEvents: 'none' }}>
                <defs>
                  <clipPath id={clipId}>
                    <circle cx={cx} cy={cy} r={svgR} />
                  </clipPath>
                </defs>
                {/* zoomed content */}
                <g clipPath={`url(#${clipId})`}>
                  <g
                    transform={`translate(${cx},${cy}) scale(${MAG_ZOOM}) translate(${-cx},${-cy})`}
                  >
                    <image
                      href={`/svg/Z${selectedFloor}-Floor.svg`}
                      x={0}
                      y={0}
                      width={vbW}
                      height={vbH}
                      preserveAspectRatio="none"
                    />
                    {floorShapes.map((shape, si) => {
                      const polyPts = shape.points
                        .map((p) => `${p.x},${p.y}`)
                        .join(' ');
                      return (
                        <g key={si}>
                          <polygon
                            points={polyPts}
                            fill="rgba(99,102,241,0.25)"
                            stroke="rgba(99,102,241,0.9)"
                            strokeWidth={1}
                          />
                          {shape.points.map((pt, pi) => (
                            <circle
                              key={pi}
                              cx={pt.x}
                              cy={pt.y}
                              r={4}
                              fill="rgba(99,102,241,0.9)"
                              stroke="white"
                              strokeWidth={1}
                            />
                          ))}
                        </g>
                      );
                    })}
                  </g>
                </g>
                {/* border + crosshair */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={svgR}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                />
                <line
                  x1={cx - svgR}
                  y1={cy}
                  x2={cx + svgR}
                  y2={cy}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={0.5}
                />
                <line
                  x1={cx}
                  y1={cy - svgR}
                  x2={cx}
                  y2={cy + svgR}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={0.5}
                />
              </g>
            );
          })()}
        </svg>

        {/* Coordinates readout */}
        <div className="absolute bottom-3 right-3 bg-gray-900/80 text-gray-400 text-xs px-3 py-1 rounded font-mono pointer-events-none">
          {cursorSvg.x.toFixed(1)}, {cursorSvg.y.toFixed(1)}
        </div>
      </main>
    </div>
  );
}
