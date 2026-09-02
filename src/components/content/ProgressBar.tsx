interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
}

export default function ProgressBar({ label, value, max }: ProgressBarProps) {
  const percent = Math.round((value / max) * 100);

  return (
    <div className="progress-bar">
      <div className="progress-bar-heading">
        <span>{label}</span>
        <strong>{percent}%</strong>
      </div>
      <progress aria-label={`${label} progress`} max={max} value={value} />
      <span className="field-hint">{value} of {max} complete</span>
    </div>
  );
}
