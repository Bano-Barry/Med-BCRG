/**
 * @file session-revocation.service.ts
 * @description Service de gestion des révocations de session (Single Logout - SLO).
 * Mémorise les timestamps de révocation par matricule, id utilisateur et email.
 * Tout jeton JWT émis avant ce timestamp est automatiquement invalidé (erreur 401).
 */

class SessionRevocationService {
  // Map identifier (matricule / user_id / email) -> timestamp de révocation en millisecondes
  private revokedMap = new Map<string, number>();

  /**
   * Enregistre la révocation d'une session pour un identifiant donné.
   * @param identifier Matricule, user_id ou email
   * @param timestamp Timestamp de révocation (ms)
   */
  revoke(identifier: string, timestamp: number = Date.now()): void {
    if (!identifier) return;
    const cleanId = String(identifier).trim().toUpperCase();
    this.revokedMap.set(cleanId, timestamp);
    console.log(`[SLO MedBCRG] Révocation enregistrée pour '${cleanId}' à ${new Date(timestamp).toISOString()}`);
  }

  /**
   * Vérifie si un identifiant a fait l'objet d'une révocation SLO.
   * @param identifier Matricule, user_id ou email
   * @param tokenIatSeconds Issued-at (iat) du jeton JWT en secondes
   * @returns true si la session est révoquée, false sinon
   */
  isRevoked(identifier?: string, tokenIatSeconds?: number): boolean {
    if (!identifier) return false;
    const cleanId = String(identifier).trim().toUpperCase();
    const revokedAt = this.revokedMap.get(cleanId);
    if (!revokedAt) return false;

    // Si le jeton fournit son iat, il est invalide s'il a été émis avant ou au moment de la révocation
    if (tokenIatSeconds) {
      const tokenIatMs = tokenIatSeconds * 1000;
      // Marge de 1 seconde pour éviter les décalages d'horloge
      return tokenIatMs <= (revokedAt + 1000);
    }

    return true;
  }

  /**
   * Nettoie les entrées obsolètes de plus de 24h pour libérer la mémoire
   */
  cleanup(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, timestamp] of this.revokedMap.entries()) {
      if (timestamp < oneDayAgo) {
        this.revokedMap.delete(key);
      }
    }
  }
}

export const sessionRevocationService = new SessionRevocationService();

// Nettoyage automatique toutes les 6 heures
setInterval(() => {
  sessionRevocationService.cleanup();
}, 6 * 60 * 60 * 1000);
