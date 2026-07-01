package sn.dci.marketwatch.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.JournalAudit;
import sn.dci.marketwatch.repository.JournalAuditRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Endpoint réservé à l'ADMIN pour consulter le journal d'audit.
 * GET /api/admin/audit-logs
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final JournalAuditRepository repository;

    public AuditLogController(JournalAuditRepository repository) {
        this.repository = repository;
    }

    /**
     * GET /api/admin/audit-logs
     * Retourne les 500 derniers logs triés par date décroissante.
     */
    @GetMapping
    public ResponseEntity<List<JournalAudit>> getAll() {
        List<JournalAudit> logs = repository.findAll(
            Sort.by(Sort.Direction.DESC, "createdAt")
        );
        // Limite à 500 pour la réponse JSON
        return ResponseEntity.ok(logs.stream().limit(500).toList());
    }

    /**
     * GET /api/admin/audit-logs/paginated?page=0&size=20
     * Version paginée pour les grandes volumétries.
     */
    @GetMapping("/paginated")
    public ResponseEntity<Page<JournalAudit>> getPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<JournalAudit> result = repository.findAll(
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/audit-logs/by-user/{userId}
     */
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<?> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(
            repository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, 100)
            )
        );
    }

    /**
     * GET /api/admin/audit-logs/stats
     * Résumé : total, alertes sécurité, actions du jour.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<JournalAudit> todayLogs = repository.findByCreatedAtAfterOrderByCreatedAtDesc(todayStart);

        long total        = repository.count();
        long secAlerts    = repository.findAll().stream()
            .filter(l -> List.of(
                JournalAudit.Action.LOGIN_FAILED,
                JournalAudit.Action.ACCESS_DENIED,
                JournalAudit.Action.INVALID_TOKEN
            ).contains(l.getAction()))
            .count();

        return ResponseEntity.ok(Map.of(
            "total",         total,
            "todayCount",    todayLogs.size(),
            "securityAlerts", secAlerts
        ));
    }
}
