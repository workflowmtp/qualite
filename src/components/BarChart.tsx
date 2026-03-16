'use client';

interface BarItem {
  label: string;
  value: number;
  color: string;
  extra?: string;
}

interface BarChartProps {
  title: string;
  items: BarItem[];
}

export default function BarChart({ title, items }: BarChartProps) {
  const maxVal = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="chart-wrap">
      <div className="chart-title">{title}</div>
      <div className="bar-chart">
        {items.map((item, idx) => {
          const height = Math.max((item.value / maxVal) * 140, 4);
          return (
            <div className="bar-col" key={idx}>
              <div className="bar-val">
                {item.value}
                {item.extra ? ` ${item.extra}` : ''}
              </div>
              <div
                className="bar-fill"
                style={{ height: `${height}px`, background: item.color }}
              />
              <div className="bar-lbl">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
