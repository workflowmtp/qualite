'use client';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}

export default function KpiCard({ label, value, sub, color }: KpiCardProps) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-stripe" />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
