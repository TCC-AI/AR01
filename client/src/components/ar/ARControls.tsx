interface ARControlsProps {
  isARSupported: boolean;
  isARActive: boolean;
  onToggleAR: () => void;
}

export function ARControls({
  isARSupported,
  isARActive,
  onToggleAR,
}: ARControlsProps) {
  return (
    <div className="ar-controls">
      <div className="glass rounded-2xl p-2 flex items-center gap-2">
        {/* Screenshot button */}
        <button
          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20
            flex items-center justify-center transition-colors"
          title="Screenshot"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* AR toggle button */}
        {isARSupported && (
          <button
            onClick={onToggleAR}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
              ${
                isARActive
                  ? 'bg-primary-600 shadow-lg shadow-primary-600/50 scale-110'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            title={isARActive ? 'Exit AR' : 'Start AR'}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}

        {/* Model list button */}
        <button
          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20
            flex items-center justify-center transition-colors"
          title="Models"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
