// Libellés français pour les valeurs d'énumération renvoyées par le backend
// (le backend garde des valeurs anglaises en base : PENDING, CRITICAL, etc.
// Ces tables ne servent qu'à l'affichage.)

export const STATUT_LABELS = {
  PENDING:  'En attente',
  VERIFIED: 'Vérifié',
  RESOLVED: 'Résolu',
  REJECTED: 'Rejeté',
}

export const PRIORITE_LABELS = {
  LOW:      'Basse',
  NORMAL:   'Normale',
  HIGH:     'Élevée',
  CRITICAL: 'Critique',
}

export const statutLabel   = s => STATUT_LABELS[s] ?? s
export const prioriteLabel = p => PRIORITE_LABELS[p] ?? p
