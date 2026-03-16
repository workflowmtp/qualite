export function generateId(): string {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

export function formatDate(d: number | null | undefined): string {
  if (!d) return '-';
  const t = new Date(d);
  return (
    String(t.getDate()).padStart(2, '0') +
    '/' +
    String(t.getMonth() + 1).padStart(2, '0') +
    '/' +
    t.getFullYear() +
    ' ' +
    String(t.getHours()).padStart(2, '0') +
    ':' +
    String(t.getMinutes()).padStart(2, '0')
  );
}

export function formatDateShort(d: number | null | undefined): string {
  if (!d) return '-';
  const t = new Date(d);
  return (
    String(t.getDate()).padStart(2, '0') +
    '/' +
    String(t.getMonth() + 1).padStart(2, '0') +
    '/' +
    t.getFullYear()
  );
}

export function escHtml(s: string | null | undefined): string {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function getStatusLabel(s: string): string {
  const m: Record<string, string> = {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    valide_chef: 'Validé Chef',
    libere: 'Libéré',
    reserve: 'Réserve',
    bloque: 'Bloqué',
  };
  return m[s] || s;
}

export function getStatusClass(s: string): string {
  return 'st-' + s.replace(/_/g, '-');
}

export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function computeMeasureVerdict(
  values: number[],
  target: number,
  tolerance: number
): { avg: number; delta: number; verdict: 'OK' | 'WARN' | 'NOK' } {
  if (values.length === 0) {
    return { avg: 0, delta: 0, verdict: 'OK' };
  }
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const delta = avg - target;
  const ad = Math.abs(delta);
  let verdict: 'OK' | 'WARN' | 'NOK' = 'OK';
  if (tolerance > 0) {
    if (ad > tolerance) verdict = 'NOK';
    else if (ad > tolerance * 0.8) verdict = 'WARN';
  }
  return { avg, delta, verdict };
}
