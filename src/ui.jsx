// Küçük ortak parçalar: ikonlar, fiyat etiketi, fiyat biçimi.

export const usd = (n) => (n == null ? "—" : n === 0 ? "Ücretsiz" : `$${n.toFixed(2)}`);

export function dateTr(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function agoTr(ms) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return "az önce";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} dk önce`;
  return `${Math.round(m / 60)} saat önce`;
}

/** Eğik sarı indirim etiketi: uygulamanın imzası. */
export function Sticker({ value, size = "md" }) {
  if (!value) return null;
  return (
    <span className={`sticker sticker-${size}`} aria-label={`yüzde ${value} indirim`}>
      -%{value}
    </span>
  );
}

const paths = {
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm5-4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  heart: "M12 20s-7-4.4-9.2-8.7C1.3 8.4 3 5 6.4 5c2 0 3.3 1.1 4.1 2.3h3C14.3 6.1 15.6 5 17.6 5 21 5 22.7 8.4 21.2 11.3 19 15.6 12 20 12 20Z",
  cube: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3L18.7 8 12 11.7 5.3 8 12 4.3ZM5 9.7l6 3.3v6.6l-6-3.3V9.7Zm8 9.9V13l6-3.3v6.6l-6 3.3Z",
  search: "M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.2 4.2-1.4 1.4-4.2-4.2A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z",
  refresh: "M12 4a8 8 0 0 1 7.4 5H17v2h6V5h-2v2.3A10 10 0 1 0 22 13h-2a8 8 0 1 1-8-9Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
  close: "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z",
  bell: "M12 3a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V9a6 6 0 0 0-6-6Zm-2 16a2 2 0 0 0 4 0h-4Z",
};

export function Icon({ name, size = 22, filled = true, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? 0 : 2}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          Tekrar dene
        </button>
      )}
    </div>
  );
}
