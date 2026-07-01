package sn.dci.marketwatch.service;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import sn.dci.marketwatch.entity.JournalAudit;
import sn.dci.marketwatch.repository.JournalAuditRepository;

/**
 * Service de traçabilité.
 * Toutes les méthodes sont @Async pour ne pas ralentir les requêtes HTTP.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final JournalAuditRepository repository;

    public AuditService(JournalAuditRepository repository) {
        this.repository = repository;
    }

    /** Enregistre une action avec contexte utilisateur complet */
    @Async
    public void log(JournalAudit.Action action,
                    Long userId, String userEmail,
                    String resource, Long resourceId,
                    String details,
                    HttpServletRequest request) {
        try {
            JournalAudit entry = JournalAudit.builder()
                    .action(action)
                    .userId(userId)
                    .userEmail(userEmail)
                    .resource(resource)
                    .resourceId(resourceId)
                    .details(details)
                    .ipAddress(extractIp(request))
                    .build();
            repository.save(entry);
        } catch (Exception e) {
            // Ne jamais bloquer la requête principale sur un échec d'audit
            log.error("Échec enregistrement audit [{}] user={} : {}", action, userEmail, e.getMessage());
        }
    }

    /** Surcharge simplifiée sans resource/resourceId */
    @Async
    public void log(JournalAudit.Action action, Long userId, String userEmail,
                    String details, HttpServletRequest request) {
        log(action, userId, userEmail, null, null, details, request);
    }

    /** Surcharge sans utilisateur (ex: tentative échouée) */
    @Async
    public void log(JournalAudit.Action action, String details, HttpServletRequest request) {
        log(action, null, null, null, null, details, request);
    }

    // ─── Utilitaire IP ────────────────────────────────────────────────────────
    private String extractIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim(); // première IP de la chaîne
        }
        return request.getRemoteAddr();
    }
}
