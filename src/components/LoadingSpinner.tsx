'use client';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="relative mb-6">
        {/* Spinning red cross */}
        <svg
          className="animate-spin"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
        >
          <rect x="8" y="22" width="48" height="20" rx="4" fill="#dc2626" />
          <rect x="22" y="8" width="20" height="48" rx="4" fill="#dc2626" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">Đang tải...</p>
    </div>
  );
}
