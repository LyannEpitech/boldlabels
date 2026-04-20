import { useToast } from '../stores/toastStore';

export interface BackendError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  timestamp?: string;
  path?: string;
  code?: string;
  meta?: Record<string, any>;
}

/**
 * Parse backend error response and return user-friendly message
 */
export function parseBackendError(error: any): {
  title: string;
  message: string;
  type: 'validation' | 'not_found' | 'conflict' | 'server' | 'network';
} {
  // Network error (no response)
  if (!error.response && error.message?.includes('fetch')) {
    return {
      title: 'Erreur de connexion',
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      type: 'network',
    };
  }

  const status = error.response?.status;
  const data: BackendError = error.response?.data || error;

  // 400 - Bad Request / Validation Error
  if (status === 400) {
    const details = data.details?.map((d) => `${d.field}: ${d.message}`).join(', ');
    return {
      title: 'Données invalides',
      message: details || data.message || 'Les données envoyées sont invalides.',
      type: 'validation',
    };
  }

  // 404 - Not Found
  if (status === 404) {
    return {
      title: 'Ressource non trouvée',
      message: data.message || "L'élément demandé n'existe pas ou a été supprimé.",
      type: 'not_found',
    };
  }

  // 409 - Conflict (duplicate, etc.)
  if (status === 409) {
    return {
      title: 'Conflit',
      message: data.message || 'Cette ressource existe déjà ou est en conflit.',
      type: 'conflict',
    };
  }

  // 422 - Unprocessable Entity
  if (status === 422) {
    return {
      title: 'Format invalide',
      message: data.message || 'Le format des données est incorrect.',
      type: 'validation',
    };
  }

  // 500+ - Server errors
  if (status >= 500) {
    return {
      title: 'Erreur serveur',
      message: 'Une erreur est survenue sur le serveur. Réessayez plus tard.',
      type: 'server',
    };
  }

  // Default fallback
  return {
    title: 'Erreur',
    message: data.message || error.message || 'Une erreur inattendue est survenue.',
    type: 'server',
  };
}

/**
 * Hook to handle API errors with toast notifications
 */
export function useApiErrorHandler() {
  const toast = useToast();

  const handleError = (error: any, customMessage?: string) => {
    const parsed = parseBackendError(error);

    toast.error(
      parsed.title,
      customMessage || parsed.message,
      parsed.type === 'validation' ? 10000 : 8000 // Longer duration for validation errors
    );

    return parsed;
  };

  return { handleError, parseBackendError };
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    onError?: (error: any) => void;
    showToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
  }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      const result = await fn(...args);

      if (options?.showToast && options.successMessage) {
        const toast = useToast();
        toast.success('Succès', options.successMessage);
      }

      return result;
    } catch (error) {
      if (options?.showToast !== false) {
        const toast = useToast();
        const parsed = parseBackendError(error);
        toast.error(
          parsed.title,
          options?.errorMessage || parsed.message,
          parsed.type === 'validation' ? 10000 : 8000
        );
      }

      if (options?.onError) {
        options.onError(error);
      }

      throw error;
    }
  }) as T;
}
