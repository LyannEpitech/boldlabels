import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { EANValidationResult } from '../utils/eanValidator';

interface EANDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  results: EANValidationResult[];
}

export function EANDebugger({ isOpen, onClose, onContinue, results }: EANDebuggerProps) {
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.length - validCount;
  const hasErrors = invalidCount > 0;

  // Grouper par ligne pour éviter les doublons
  const groupedByLine = results.reduce((acc, result) => {
    const key = `${result.lineNumber}-${result.value}`;
    if (!acc[key]) {
      acc[key] = result;
    }
    return acc;
  }, {} as Record<string, EANValidationResult>);
  
  const uniqueResults = Object.values(groupedByLine);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔍 Validation des Codes-Barres">
      <div className="space-y-4">
        {/* Résumé */}
        <div className={`p-4 rounded-lg ${hasErrors ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <AlertTriangle className="text-red-500" size={24} />
            ) : (
              <CheckCircle className="text-green-500" size={24} />
            )}
            <div>
              <div className="font-semibold">
                {hasErrors 
                  ? `${invalidCount} code${invalidCount > 1 ? 's' : ''} invalide${invalidCount > 1 ? 's' : ''} détecté${invalidCount > 1 ? 's' : ''}`
                  : 'Tous les codes-barres sont valides !'}
              </div>
              <div className="text-sm text-gray-600">
                {validCount} valide{validCount > 1 ? 's' : ''} / {invalidCount} invalide{invalidCount > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {uniqueResults.map((result, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg border ${
                result.valid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.valid ? (
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                ) : (
                  <XCircle className="text-red-500 mt-0.5" size={16} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{result.format}:</span>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                      "{result.value}"
                    </code>
                    <span className={`text-sm ${result.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {result.valid ? '(Valide)' : '(Invalide)'}
                    </span>
                  </div>
                  
                  {result.productName && (
                    <div className="text-sm text-gray-600 mt-1">
                      Produit: {result.productName}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    <FileText size={12} className="inline mr-1" />
                    Ligne CSV: {result.lineNumber}
                  </div>
                  
                  {result.errors.map((error, i) => (
                    <div key={i} className="mt-2 text-sm">
                      <div className="text-red-600 font-medium">
                        → {error.message}
                      </div>
                      <div className="text-gray-500 ml-4 mt-0.5">
                        Attendu: {error.expected}
                      </div>
                      <div className="text-gray-500 ml-4">
                        Reçu: <code className="bg-red-100 px-1 rounded">{error.received}</code>
                      </div>
                    </div>
                  ))}
                  
                  {result.warnings.map((warning, i) => (
                    <div key={i} className="mt-1 text-sm text-yellow-600">
                      ⚠️ {warning.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant={hasErrors ? 'danger' : 'primary'} 
            className="flex-1"
            onClick={onContinue}
          >
            {hasErrors ? 'Continuer quand même' : 'Générer le PDF'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
