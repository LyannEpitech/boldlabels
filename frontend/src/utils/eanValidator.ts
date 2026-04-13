export interface EANError {
  type: 'INVALID_CHARS' | 'WRONG_LENGTH' | 'INVALID_CHECKSUM' | 'EMPTY';
  message: string;
  expected: string;
  received: string;
}

export interface EANWarning {
  type: string;
  message: string;
}

export interface EANValidationResult {
  valid: boolean;
  format: 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'unknown';
  value: string;
  lineNumber: number;
  productName?: string;
  errors: EANError[];
  warnings: EANWarning[];
}

export function validateEAN(value: string, format: string, lineNumber = 0, productName = ''): EANValidationResult {
  const result: EANValidationResult = {
    valid: true,
    format: format as any,
    value,
    lineNumber,
    productName,
    errors: [],
    warnings: []
  };

  // Vider les espaces
  const cleanValue = value.trim();
  
  if (!cleanValue) {
    result.errors.push({
      type: 'EMPTY',
      message: 'Valeur vide',
      expected: getExpectedFormat(format),
      received: '(vide)'
    });
    result.valid = false;
    return result;
  }

  switch (format.toUpperCase()) {
    case 'EAN13':
      validateEAN13(cleanValue, result);
      break;
    case 'EAN8':
      validateEAN8(cleanValue, result);
      break;
    case 'UPC':
    case 'UPC-A':
      validateUPC(cleanValue, result);
      break;
    case 'CODE128':
      // CODE128 accepte tout ASCII, pas de validation stricte
      break;
    default:
      result.warnings.push({
        type: 'UNKNOWN_FORMAT',
        message: `Format non reconnu: ${format}`
      });
  }

  result.valid = result.errors.length === 0;
  return result;
}

function getExpectedFormat(format: string): string {
  switch (format.toUpperCase()) {
    case 'EAN13':
      return '13 chiffres (0-9)';
    case 'EAN8':
      return '8 chiffres (0-9)';
    case 'UPC':
    case 'UPC-A':
      return '12 chiffres (0-9)';
    case 'CODE128':
      return 'Texte ASCII';
    default:
      return 'Format inconnu';
  }
}

function validateEAN13(value: string, result: EANValidationResult): void {
  // Vérifier que ce sont des chiffres
  if (!/^\d+$/.test(value)) {
    const invalidChars = value.split('').filter(c => !/\d/.test(c)).join('');
    result.errors.push({
      type: 'INVALID_CHARS',
      message: `Contient des caractères non numériques: "${invalidChars}"`,
      expected: '13 chiffres (0-9)',
      received: value
    });
    return;
  }

  // Vérifier la longueur
  if (value.length !== 13) {
    result.errors.push({
      type: 'WRONG_LENGTH',
      message: `Longueur incorrecte: ${value.length} chiffres`,
      expected: '13 chiffres',
      received: `${value.length} chiffres`
    });
    return;
  }

  // Vérifier la clé de contrôle
  const checksum = calculateEAN13Checksum(value.slice(0, 12));
  const actualChecksum = parseInt(value.slice(-1));
  
  if (checksum !== actualChecksum) {
    result.errors.push({
      type: 'INVALID_CHECKSUM',
      message: 'Clé de contrôle invalide',
      expected: `${value.slice(0, 12)}${checksum}`,
      received: value
    });
  }
}

function validateEAN8(value: string, result: EANValidationResult): void {
  if (!/^\d+$/.test(value)) {
    const invalidChars = value.split('').filter(c => !/\d/.test(c)).join('');
    result.errors.push({
      type: 'INVALID_CHARS',
      message: `Contient des caractères non numériques: "${invalidChars}"`,
      expected: '8 chiffres (0-9)',
      received: value
    });
    return;
  }

  if (value.length !== 8) {
    result.errors.push({
      type: 'WRONG_LENGTH',
      message: `Longueur incorrecte: ${value.length} chiffres`,
      expected: '8 chiffres',
      received: `${value.length} chiffres`
    });
    return;
  }

  const checksum = calculateEAN8Checksum(value.slice(0, 7));
  const actualChecksum = parseInt(value.slice(-1));
  
  if (checksum !== actualChecksum) {
    result.errors.push({
      type: 'INVALID_CHECKSUM',
      message: 'Clé de contrôle invalide',
      expected: `${value.slice(0, 7)}${checksum}`,
      received: value
    });
  }
}

function validateUPC(value: string, result: EANValidationResult): void {
  if (!/^\d+$/.test(value)) {
    const invalidChars = value.split('').filter(c => !/\d/.test(c)).join('');
    result.errors.push({
      type: 'INVALID_CHARS',
      message: `Contient des caractères non numériques: "${invalidChars}"`,
      expected: '12 chiffres (0-9)',
      received: value
    });
    return;
  }

  if (value.length !== 12) {
    result.errors.push({
      type: 'WRONG_LENGTH',
      message: `Longueur incorrecte: ${value.length} chiffres`,
      expected: '12 chiffres',
      received: `${value.length} chiffres`
    });
    return;
  }

  const checksum = calculateUPCChecksum(value.slice(0, 11));
  const actualChecksum = parseInt(value.slice(-1));
  
  if (checksum !== actualChecksum) {
    result.errors.push({
      type: 'INVALID_CHECKSUM',
      message: 'Clé de contrôle invalide',
      expected: `${value.slice(0, 11)}${checksum}`,
      received: value
    });
  }
}

// Calcul de la clé de contrôle EAN-13
export function calculateEAN13Checksum(digits: string): number {
  if (digits.length !== 12) return -1;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

// Calcul de la clé de contrôle EAN-8
export function calculateEAN8Checksum(digits: string): number {
  if (digits.length !== 7) return -1;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

// Calcul de la clé de contrôle UPC-A
export function calculateUPCChecksum(digits: string): number {
  if (digits.length !== 11) return -1;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

// Valider tous les EAN d'un CSV
export function validateAllEANs(
  csvData: string[][],
  csvHeaders: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: { elements: any[] },
  mapping: Record<string, string>
): EANValidationResult[] {
  const results: EANValidationResult[] = [];
  
  // Trouver la colonne du nom du produit (heuristique)
  const productNameCol = csvHeaders.findIndex(h => 
    h.toLowerCase().includes('name') || 
    h.toLowerCase().includes('nom') || 
    h.toLowerCase().includes('produit')
  );

  for (let rowIndex = 0; rowIndex < csvData.length; rowIndex++) {
    const row = csvData[rowIndex];
    
    template.elements
      .filter(el => el.type === 'barcode')
      .forEach(element => {
        const columnName = mapping[element.variableName];
        if (!columnName) return;
        
        const colIndex = csvHeaders.indexOf(columnName);
        if (colIndex === -1) return;
        
        const value = row[colIndex] || '';
        const format = (element.properties?.format as string) || 'EAN13';
        const productName = productNameCol !== -1 ? row[productNameCol] : '';
        
        const result = validateEAN(value, format, rowIndex + 2, productName); // +2 pour ligne 1-indexed avec header
        results.push(result);
      });
  }
  
  return results;
}
