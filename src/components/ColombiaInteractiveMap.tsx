import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  COLOMBIA_DEPARTMENTS,
  COLOMBIA_MAP_HEIGHT,
  COLOMBIA_MAP_WIDTH,
  type ColombiaDepartment
} from '../data/colombiaDepartments';

interface ColombiaInteractiveMapProps {
  mapSrc: string;
}

export default function ColombiaInteractiveMap({ mapSrc }: ColombiaInteractiveMapProps) {
  const [imageError, setImageError] = useState(false);
  const [activeDept, setActiveDept] = useState<ColombiaDepartment | null>(null);

  if (imageError) {
    return (
      <div className="w-full max-w-sm aspect-[3/4] rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="w-10 h-10 text-blue-700 mb-3" />
        <p className="text-base font-bold text-blue-950">Presencia en toda Colombia</p>
        <p className="text-xs text-slate-600 mt-1">
          Desde Popayán, Cauca hacia todos los departamentos del país.
        </p>
      </div>
    );
  }

  const getTooltipPositionClasses = (dept: ColombiaDepartment) => {
    const horizontal =
      dept.cx < 270
        ? 'left-0 translate-x-0'
        : dept.cx > 610
        ? 'right-0 translate-x-0'
        : 'left-1/2 -translate-x-1/2';

    const showBelow = dept.cy < 300;
    return {
      isHorizontalAnchored: dept.cx < 270 || dept.cx > 610,
      horizontal,
      showBelow
    };
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className="relative w-full select-none"
        onMouseLeave={() => setActiveDept(null)}
      >
        <img
          src={mapSrc}
          alt="Mapa de Colombia representando el alcance educativo nacional de Fundación ULEP"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-auto block object-contain mix-blend-multiply"
        />

        {/* Pixel-aligned SVG department hotspots directly over the map image */}
        <svg
          viewBox={`0 0 ${COLOMBIA_MAP_WIDTH} ${COLOMBIA_MAP_HEIGHT}`}
          className="absolute inset-0 w-full h-full"
          aria-label="Mapa interactivo de los departamentos de Colombia"
          role="img"
        >
          {COLOMBIA_DEPARTMENTS.map((dept) => {
            const isActive = activeDept?.id === dept.id;
            return (
              <g
                key={dept.id}
                role="button"
                tabIndex={0}
                aria-label={`${dept.name}: ${dept.educationalMessage}`}
                onMouseEnter={() => setActiveDept(dept)}
                onFocus={() => setActiveDept(dept)}
                onBlur={() => setActiveDept((prev) => (prev?.id === dept.id ? null : prev))}
                onClick={() =>
                  setActiveDept((prev) => (prev?.id === dept.id ? null : dept))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveDept((prev) => (prev?.id === dept.id ? null : dept));
                  } else if (e.key === 'Escape') {
                    setActiveDept(null);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                {dept.paths.map((d, idx) => (
                  <path
                    key={idx}
                    d={d}
                    fill={isActive ? 'rgba(56, 189, 248, 0.34)' : 'rgba(255, 255, 255, 0.001)'}
                    stroke={isActive ? '#ffffff' : 'transparent'}
                    strokeWidth={isActive ? 3.5 : 0}
                    strokeLinejoin="round"
                    className="transition-all duration-150"
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Floating Educational Tooltip */}
        {activeDept && (() => {
          const pos = getTooltipPositionClasses(activeDept);
          const leftPct = (activeDept.cx / COLOMBIA_MAP_WIDTH) * 100;
          const topPct = (activeDept.cy / COLOMBIA_MAP_HEIGHT) * 100;

          return (
            <div
              role="status"
              aria-live="polite"
              className={`pointer-events-none absolute z-30 w-64 max-w-[92%] rounded-xl bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg p-3.5 transition-opacity duration-150 ${
                pos.isHorizontalAnchored ? pos.horizontal : '-translate-x-1/2'
              } ${pos.showBelow ? 'mt-3' : '-translate-y-full -mt-3'}`}
              style={{
                top: `${topPct}%`,
                ...(pos.isHorizontalAnchored ? {} : { left: `${leftPct}%` })
              }}
            >
              <p className="text-[11px] font-medium text-blue-600">
                {activeDept.capital} <span aria-hidden="true">·</span> Colombia
              </p>
              <p className="text-sm font-bold text-blue-950 mt-0.5 leading-snug">
                {activeDept.name}
              </p>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {activeDept.educationalMessage}
              </p>
            </div>
          );
        })()}
      </div>

      <p className="text-xs text-slate-500 text-center mt-3">
        {activeDept
          ? `${activeDept.name} · ${activeDept.capital}`
          : 'Acerca el puntero a cada departamento para conocer nuestro mensaje educativo'}
      </p>
    </div>
  );
}
