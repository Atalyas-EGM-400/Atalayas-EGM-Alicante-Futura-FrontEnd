'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cleanZoneLabel = (text: string) =>
  text.replace(/^(zona_?|cap_?|drop_?)/i, '').replace(/_/g, ' ').trim().toUpperCase();

const cleanItemName = (name: string) =>
  name ? name.split('[')[0].trim() : '';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Paletas de zona ──────────────────────────────────────────────────────────

const ZONE_PALETTES = [
  {
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    border: '#3b82f6',
    badgeBg: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    dot: '#60a5fa',
    glow: '#3b82f620',
    labelColor: '#93c5fd',
  },
  {
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
    border: '#10b981',
    badgeBg: 'linear-gradient(135deg, #059669, #047857)',
    dot: '#34d399',
    glow: '#10b98120',
    labelColor: '#6ee7b7',
  },
  {
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    border: '#a78bfa',
    badgeBg: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    dot: '#c4b5fd',
    glow: '#7c3aed20',
    labelColor: '#c4b5fd',
  },
  {
    gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
    border: '#f59e0b',
    badgeBg: 'linear-gradient(135deg, #d97706, #b45309)',
    dot: '#fcd34d',
    glow: '#f59e0b20',
    labelColor: '#fde68a',
  },
  {
    gradient: 'linear-gradient(135deg, #881337 0%, #e11d48 100%)',
    border: '#fb7185',
    badgeBg: 'linear-gradient(135deg, #e11d48, #be123c)',
    dot: '#fda4af',
    glow: '#e11d4820',
    labelColor: '#fda4af',
  },
  {
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
    border: '#38bdf8',
    badgeBg: 'linear-gradient(135deg, #0284c7, #0369a1)',
    dot: '#7dd3fc',
    glow: '#0284c720',
    labelColor: '#bae6fd',
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DragItem { id: string; nombre: string }
interface DropZone { id: string; nombre: string }
interface LabData {
  scenarioTitle?: string;
  instruction?: string;
  draggables?: DragItem[];
  dropZones?: DropZone[];
  validation?: Record<string, string>;
}
interface InteractiveLabProps {
  data: LabData;
  onCompleted?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function InteractiveLab({
  data,
  onCompleted,
}: InteractiveLabProps) {
  const [items, setItems]       = useState<DragItem[]>([]);
  const [placed, setPlaced]     = useState<Record<string, string>>({});
  const [errorId, setErrorId]   = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (data?.draggables) {
      setItems(shuffle(data.draggables));
      setPlaced({});
      setShowSuccess(false);
    }
  }, [data]);

  const total   = items.length;
  const done    = Object.keys(placed).length;
  const allDone = total > 0 && done === total;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

useEffect(() => {
  if (allDone) {
    setTimeout(() => {
      setShowSuccess(true);

      // avisar al componente padre
      onCompleted?.();
    }, 400);
  }
}, [allDone, onCompleted]);


  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('draggableId', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('draggableId');
    if (!id || placed[id]) return;

    if (data?.validation?.[id] === zoneId) {
      setPlaced(prev => ({ ...prev, [id]: zoneId }));
      setErrorId(null);
    } else {
      setErrorId(id);
      setTimeout(() => setErrorId(null), 600);
    }
  }, [data, placed]);

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (!data?.draggables?.length) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0f172a' }}>
        <p style={{ color: '#64748b', fontSize: 11 }}>Generando ejercicio…</p>
      </div>
    );
  }

  // ── Pantalla de éxito ───────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        {/* Ícono animado */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669, #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px #10b98160',
          animation: 'popIn 0.4s cubic-bezier(.34,1.56,.64,1)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div>
          <p style={{ color: 'white', fontWeight: 800, fontSize: 20, fontStyle: 'italic', letterSpacing: '-0.03em' }}>
            ¡Ejercicio completado!
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
            Has clasificado los {total} conceptos correctamente.
          </p>
        </div>

        <button
          onClick={() => { setPlaced({}); setShowSuccess(false); setItems(shuffle(data.draggables!)); }}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 24px #7c3aed50',
          }}
        >
          Repetir ejercicio
        </button>
      </div>
    );
  }

  const unplaced = items.filter(it => !placed[it.id]);

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20% { transform: translateX(-7px) }
          40% { transform: translateX(7px) }
          60% { transform: translateX(-4px) }
          80% { transform: translateX(4px) }
        }
        @keyframes popIn {
          from { transform: scale(0.6); opacity: 0 }
          to   { transform: scale(1);   opacity: 1 }
        }
        @keyframes slideIn {
          from { transform: translateY(6px); opacity: 0 }
          to   { transform: translateY(0);   opacity: 1 }
        }
        .lab-item {
          transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
        }
        .lab-item:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(37,99,235,0.4);
        }
        .lab-item:active { transform: scale(0.97); }
        .lab-item.shaking { animation: shake 0.55s ease-in-out; }
        .placed-item {
          animation: slideIn 0.22s cubic-bezier(.34,1.56,.64,1);
        }
        .zone-card {
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .drop-hint {
          transition: all 0.15s ease;
        }
        /* Scrollbar custom */
        .lab-scroll::-webkit-scrollbar { width: 4px }
        .lab-scroll::-webkit-scrollbar-track { background: transparent }
        .lab-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px }
      `}</style>

      <div
        className="flex flex-col h-full w-full overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)' }}
      >
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0, padding: '10px 16px',
          background: 'rgba(15,23,42,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              color: 'white', fontWeight: 900, fontSize: 11,
              fontStyle: 'italic', textTransform: 'uppercase',
              letterSpacing: '0.04em', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {data.scenarioTitle || 'Simulador de clasificación'}
            </h2>
            {data.instruction && (
              <p style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{data.instruction}</p>
            )}
          </div>

          {/* Progress */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              height: 6, width: 80, borderRadius: 3,
              background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                transition: 'width 0.5s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: pct > 0 ? '0 0 8px #7c3aed80' : 'none',
              }} />
            </div>
            <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {done}/{total}
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* ── Sidebar ── */}
          <div style={{
            width: 188, flexShrink: 0,
            background: 'rgba(15,23,42,0.6)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '8px 12px', flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Por clasificar
              </span>
              <span style={{
                fontSize: 10, fontWeight: 800, color: 'white',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                borderRadius: 20, padding: '1px 7px',
              }}>
                {unplaced.length}
              </span>
            </div>

            {/* Items */}
            <div className="lab-scroll" style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {unplaced.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => onDragStart(e, item.id)}
                  className={`lab-item${errorId === item.id ? ' shaking' : ''}`}
                  style={{
                    padding: '9px 10px',
                    borderRadius: 10,
                    cursor: 'grab',
                    userSelect: 'none',
                    background: errorId === item.id
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                      : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)',
                    border: errorId === item.id
                      ? '1px solid #f87171'
                      : '1px solid rgba(96,165,250,0.3)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'white',
                    textAlign: 'center',
                    lineHeight: '1.35',
                    boxShadow: '0 2px 12px rgba(37,99,235,0.3)',
                  }}
                >
                  {cleanItemName(item.nombre)}
                </div>
              ))}

              {unplaced.length === 0 && (
                <p style={{ fontSize: 9, color: '#334155', textAlign: 'center', paddingTop: 16 }}>
                  Todos clasificados ✓
                </p>
              )}
            </div>
          </div>

          {/* ── Área de trabajo ── */}
          <div
            className="lab-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: 14, background: 'transparent' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
              maxWidth: 860,
              margin: '0 auto',
              alignItems: 'start',   // ← clave: no estirar las celdas
              paddingBottom: 16,
            }}>
              {data.dropZones?.map((zone, idx) => {
                const palette = ZONE_PALETTES[idx % ZONE_PALETTES.length];
                const inZone  = Object.entries(placed)
                  .filter(([, zId]) => zId === zone.id)
                  .map(([id]) => id);
                const expected = Object.values(data.validation ?? {})
                  .filter(v => v === zone.id).length;
                const full   = inZone.length >= expected;
                const isOver = dragOver === zone.id;

                return (
                  <div
                    key={zone.id}
                    className="zone-card"
                    onDragOver={e => { allowDrop(e); setDragOver(zone.id); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => onDrop(e, zone.id)}
                    style={{
                      borderRadius: 14,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      background: full
                        ? palette.gradient
                        : isOver
                        ? `linear-gradient(135deg, ${palette.glow}, ${palette.glow})`
                        : 'rgba(15,23,42,0.7)',
                      border: `1.5px ${full ? 'solid' : isOver ? 'solid' : 'dashed'} ${
                        full || isOver ? palette.border : 'rgba(51,65,85,0.6)'
                      }`,
                      boxShadow: full
                        ? `0 4px 24px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                        : isOver
                        ? `0 0 0 3px ${palette.border}30, 0 4px 20px ${palette.glow}`
                        : 'none',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {/* Cabecera de zona */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: full ? palette.dot : palette.border,
                        boxShadow: full ? `0 0 8px ${palette.dot}` : 'none',
                        transition: 'all 0.3s ease',
                      }} />
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: palette.labelColor,
                        flex: 1,
                      }}>
                        {cleanZoneLabel(zone.nombre ?? zone.id)}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
                        color: full ? palette.dot : '#475569',
                        background: full ? `${palette.dot}20` : 'rgba(255,255,255,0.04)',
                        borderRadius: 6, padding: '1px 6px',
                      }}>
                        {inZone.length}/{expected}
                      </span>
                    </div>

                    {/* Items colocados */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {inZone.map(id => {
                        const item = items.find(i => i.id === id);
                        return (
                          <div
                            key={id}
                            className="placed-item"
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'white',
                              textAlign: 'center',
                              lineHeight: '1.35',
                              background: palette.badgeBg,
                              border: `1px solid ${palette.border}50`,
                              boxShadow: `0 2px 12px ${palette.glow}`,
                            }}
                          >
                            {cleanItemName(item?.nombre ?? '')}
                          </div>
                        );
                      })}

                      {/* Drop hint — solo si la zona no está llena */}
                      {!full && (
                        <div
                          className="drop-hint"
                          style={{
                            minHeight: inZone.length === 0 ? 52 : 30,
                            borderRadius: 8,
                            border: `1.5px dashed ${isOver ? palette.border : `${palette.border}30`}`,
                            background: isOver ? `${palette.border}12` : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {inZone.length === 0 && (
                            <span style={{ fontSize: 9, color: `${palette.labelColor}60` }}>
                              {isOver ? '¡Suelta aquí!' : 'Arrastra aquí'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}