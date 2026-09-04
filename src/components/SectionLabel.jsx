export default function SectionLabel({ index, label }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-mute">
      <span className="text-acid">{index}</span>
      <span className="h-px w-8 bg-line" aria-hidden="true" />
      {label}
    </p>
  );
}
