package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.AlertConfig;
import sn.dci.marketwatch.entity.JournalAudit;
import sn.dci.marketwatch.entity.Utilisateur;
import sn.dci.marketwatch.repository.AlertConfigRepository;
import sn.dci.marketwatch.repository.UtilisateurRepository;
import sn.dci.marketwatch.security.UserDetailsImpl;
import sn.dci.marketwatch.service.AuditService;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Cas d'utilisation Admin : "Configurer les seuils d'alerte automatique"
 * (Figure 6 du Chapitre 3). Ces seuils déterminent, lors de la création
 * d'un signalement, à partir de quel écart de prix la priorité passe à
 * HIGH puis CRITICAL (voir ReportController#createReport).
 */
@RestController
@RequestMapping("/api/admin/alert-config")
@PreAuthorize("hasRole('ADMIN')")
public class AlertConfigController {

    private final AlertConfigRepository configRepo;
    private final UtilisateurRepository userRepo;
    private final AuditService auditService;

    public AlertConfigController(AlertConfigRepository configRepo, UtilisateurRepository userRepo,
                                  AuditService auditService) {
        this.configRepo = configRepo;
        this.userRepo = userRepo;
        this.auditService = auditService;
    }

    /** GET /api/admin/alert-config — seuils actuels (créés avec les valeurs par défaut si absents) */
    @GetMapping
    public ResponseEntity<?> get() {
        return ResponseEntity.ok(toMap(getOrCreate()));
    }

    /** PUT /api/admin/alert-config — met à jour les 3 seuils (%) */
    @PutMapping
    public ResponseEntity<?> update(@RequestBody Map<String, Object> body, Authentication auth, HttpServletRequest request) {
        AlertConfig cfg = getOrCreate();

        if (body.get("highThreshold") != null) cfg.setHighThreshold(Double.valueOf(body.get("highThreshold").toString()));
        if (body.get("criticalThreshold") != null) cfg.setCriticalThreshold(Double.valueOf(body.get("criticalThreshold").toString()));
        if (body.get("lowThreshold") != null) cfg.setLowThreshold(Double.valueOf(body.get("lowThreshold").toString()));

        if (cfg.getHighThreshold() >= cfg.getCriticalThreshold()) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Le seuil HIGH doit être strictement inférieur au seuil CRITICAL."));
        }
        if (cfg.getLowThreshold() > cfg.getHighThreshold()) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Le seuil LOW doit être inférieur ou égal au seuil HIGH."));
        }

        cfg.setUpdatedAt(LocalDateTime.now());
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        userRepo.findById(ud.getId()).ifPresent(cfg::setUpdatedBy);
        configRepo.save(cfg);

        auditService.log(JournalAudit.Action.ALERT_CONFIG_UPDATED, ud.getId(), ud.getUsername(),
            "Seuils : LOW=" + cfg.getLowThreshold() + "% HIGH=" + cfg.getHighThreshold()
                + "% CRITICAL=" + cfg.getCriticalThreshold() + "%", request);

        return ResponseEntity.ok(Map.of("message", "Seuils d'alerte mis à jour.", "config", toMap(cfg)));
    }

    private AlertConfig getOrCreate() {
        return configRepo.findAll().stream().findFirst()
            .orElseGet(() -> configRepo.save(AlertConfig.builder().build()));
    }

    private Map<String, Object> toMap(AlertConfig cfg) {
        Utilisateur by = cfg.getUpdatedBy();
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("highThreshold", cfg.getHighThreshold());
        m.put("criticalThreshold", cfg.getCriticalThreshold());
        m.put("lowThreshold", cfg.getLowThreshold());
        m.put("updatedAt", cfg.getUpdatedAt());
        m.put("updatedBy", by != null ? by.getName() : null);
        return m;
    }
}
