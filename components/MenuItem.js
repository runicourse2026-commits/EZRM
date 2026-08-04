import { useRouter } from 'next/router';

export default function MenuItem({ icon, label, hint, href, onClick }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="menu-item"
      onClick={onClick ?? (() => router.push(href))}
    >
      <span className="icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className="label" style={{ display: 'block' }}>
          {label}
        </span>
        {hint && <span className="hint">{hint}</span>}
      </span>
      <span className="chev" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
