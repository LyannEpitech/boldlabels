import Papa from 'papaparse';

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

export function parseCSV(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = Object.keys(results.data[0] as Record<string, string>);
          const rows = results.data.map((row: any) => 
            headers.map((h) => row[h] || '')
          );
          resolve({
            headers,
            rows,
            errors: results.errors,
            meta: results.meta,
          });
        } else {
          resolve({
            headers: [],
            rows: [],
            errors: results.errors,
            meta: results.meta,
          });
        }
      },
      error: (error) => reject(error),
    });
  });
}

export function validateCSV(
  headers: string[],
  requiredColumns: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredColumns.filter(
    (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase())
  );
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function downloadCSV(headers: string[], rows: string[][]): void {
  const csv = Papa.unparse({
    fields: headers,
    data: rows,
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'export.csv';
  link.click();
}
