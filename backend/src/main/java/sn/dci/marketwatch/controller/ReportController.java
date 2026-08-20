package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.*;
import sn.dci.marketwatch.repository.*;
import sn.dci.marketwatch.security.UserDetailsImpl;

import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final SignalementRepository reportRepo;
    private final ProduitRepository productRepo;
    private final RegionRepository regionRepo;
    private final CommercantRepository merchantRepo;
    private final PrixOfficielRepository priceRepo;
    private final UtilisateurRepository userRepo;
    private final NotificationRepository notifRepo;
    private final AlertConfigRepository alertConfigRepo;

    public ReportController(SignalementRepository reportRepo, ProduitRepository productRepo,
                            RegionRepository regionRepo, CommercantRepository merchantRepo,
                            PrixOfficielRepository priceRepo, UtilisateurRepository userRepo,
                            NotificationRepository notifRepo, AlertConfigRepository alertConfigRepo) {
        this.reportRepo = reportRepo; this.productRepo = productRepo;
        this.regionRepo = regionRepo; this.merchantRepo = merchantRepo;
        this.priceRepo = priceRepo; this.userRepo = userRepo;
        this.notifRepo = notifRepo; this.alertConfigRepo = alertConfigRepo;
    }

    /** GET /api/reports – Admin & Agent */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    public ResponseEntity<?> getAllReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        List<Signalement> reports = reportRepo.findAllByOrderByCreatedAtDesc();
        if (status != null)   reports = reports.stream().filter(r -> r.getStatus().name().equalsIgnoreCase(status)).toList();
        if (priority != null) reports = reports.stream().filter(r -> r.getPriority().name().equalsIgnoreCase(priority)).toList();
        return ResponseEntity.ok(reports.stream().map(this::toMap).toList());
    }

    /** GET /api/reports/alerts – Agent : alertes actives triées par priorité */
    @GetMapping("/alerts")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> getAlerts() {
        return ResponseEntity.ok(reportRepo.findActiveOrderedByPriority().stream().map(this::toMap).toList());
    }

    /** GET /api/reports/my – Consommateur : mes signalements */
    @GetMapping("/my")
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> myReports(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(reportRepo.findByConsumer_IdOrderByCreatedAtDesc(ud.getId())
                .stream().map(this::toMap).toList());
    }

    /** POST /api/reports – Consommateur */
    @PostMapping
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> createReport(@RequestBody Map<String, Object> body, Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        Utilisateur consumer = userRepo.findById(ud.getId()).orElseThrow();

        Long productId = Long.valueOf(body.get("productId").toString());
        Long regionId  = Long.valueOf(body.get("regionId").toString());
        double priceObserved = Double.parseDouble(body.get("priceObserved").toString());

        Produit product = productRepo.findById(productId).orElseThrow();
        Region  region  = regionRepo.findById(regionId).orElseThrow();

        // Prix officiel
        Double officialPrice = priceRepo.findCurrentByProductAndRegion(productId, regionId)
                .map(PrixOfficiel::getPrice).orElse(null);

        // Calcul priorité — seuils configurables par l'Admin (voir AlertConfigController)
        AlertConfig alertConfig = alertConfigRepo.findAll().stream().findFirst()
            .orElseGet(() -> alertConfigRepo.save(AlertConfig.builder().build()));
        Signalement.Priorite priority = Signalement.Priorite.NORMAL;
        if (officialPrice != null) {
            double ecart = (priceObserved - officialPrice) / officialPrice * 100;
            if (ecart >= alertConfig.getCriticalThreshold())     priority = Signalement.Priorite.CRITICAL;
            else if (ecart >= alertConfig.getHighThreshold())    priority = Signalement.Priorite.HIGH;
            else if (ecart <= alertConfig.getLowThreshold())     priority = Signalement.Priorite.LOW;
        }

        Long merchantId = body.containsKey("merchantId") && body.get("merchantId") != null ?
            Long.valueOf(body.get("merchantId").toString()) : null;
        Commercant merchant = merchantId != null ? merchantRepo.findById(merchantId).orElse(null) : null;

        Signalement report = Signalement.builder()
            .consumer(consumer).product(product).region(region)
            .merchant(merchant).priceObserved(priceObserved)
            .officialPrice(officialPrice).priority(priority)
            .description(body.getOrDefault("description", "").toString())
            .lat(body.get("lat") != null ? Double.valueOf(body.get("lat").toString()) : null)
            .lng(body.get("lng") != null ? Double.valueOf(body.get("lng").toString()) : null)
            .build();
        reportRepo.save(report);

        // Notifications
        if (priority == Signalement.Priorite.CRITICAL || priority == Signalement.Priorite.HIGH) {
            String msg = "🚨 Signalement " + priority + " : " + product.getName() + " à " + (int)priceObserved + " FCFA (#" + report.getId() + ")";
            userRepo.findAll().stream()
                .filter(u -> u.getRole() == Utilisateur.Role.AGENT || u.getRole() == Utilisateur.Role.ADMIN)
                .forEach(u -> notifRepo.save(Notification.builder().user(u).message(msg).type("alert").build()));
        }
        notifRepo.save(Notification.builder().user(consumer)
            .message("Votre signalement #" + report.getId() + " a bien été enregistré. Merci !")
            .type("success").build());

        return ResponseEntity.ok(Map.of("message", "Signalement soumis.", "id", report.getId(), "priority", priority.name()));
    }

    /** PATCH /api/reports/{id}/status – Admin / Agent */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Signalement report = reportRepo.findById(id).orElseThrow();
        report.setStatus(Signalement.Statut.valueOf(body.get("status").toUpperCase()));
        reportRepo.save(report);
        notifRepo.save(Notification.builder().user(report.getConsumer())
            .message("Votre signalement #" + id + " : statut mis à jour → " + report.getStatus()).build());
        return ResponseEntity.ok(Map.of("message", "Statut mis à jour."));
    }

    /**
     * GET /api/reports/community – Consommateur
     * Retourne des signalements PENDING d'autres utilisateurs à confirmer.
     */
    @GetMapping("/community")
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> getCommunityReports(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        // Exclure les signalements de l'utilisateur courant, prendre les 8 plus récents en attente
        List<Signalement> reports = reportRepo.findAllByOrderByCreatedAtDesc().stream()
            .filter(r -> r.getStatus() == Signalement.Statut.PENDING)
            .filter(r -> !r.getConsumer().getId().equals(ud.getId()))
            .limit(8)
            .toList();
        return ResponseEntity.ok(reports.stream().map(r -> {
            Map<String, Object> m = toMap(r);
            m.put("confirmationCount", r.getConfirmationCount() != null ? r.getConfirmationCount() : 0);
            return m;
        }).toList());
    }

    /**
     * POST /api/reports/{id}/confirm – Consommateur
     * Confirme un signalement communautaire (incrémente le compteur).
     */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> confirmReport(@PathVariable Long id, Authentication auth) {
        Signalement report = reportRepo.findById(id).orElseThrow();
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        // Empêcher l'auteur de confirmer son propre signalement
        if (report.getConsumer().getId().equals(ud.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vous ne pouvez pas confirmer votre propre signalement."));
        }
        int newCount = (report.getConfirmationCount() != null ? report.getConfirmationCount() : 0) + 1;
        report.setConfirmationCount(newCount);
        // Si 3+ confirmations → passer en VERIFIED automatiquement
        if (newCount >= 3 && report.getStatus() == Signalement.Statut.PENDING) {
            report.setStatus(Signalement.Statut.VERIFIED);
            notifRepo.save(Notification.builder()
                .user(report.getConsumer())
                .message("✅ Votre signalement #" + id + " a été confirmé par la communauté et est maintenant vérifié !")
                .type("success").build());
        }
        reportRepo.save(report);
        return ResponseEntity.ok(Map.of("confirmationCount", newCount, "status", report.getStatus().name()));
    }

    private Map<String, Object> toMap(Signalement r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("productName", r.getProduct().getName());
        m.put("productId", r.getProduct().getId());
        m.put("regionName", r.getRegion() != null ? r.getRegion().getName() : "");
        m.put("merchantName", r.getMerchant() != null ? r.getMerchant().getName() : null);
        m.put("merchantId", r.getMerchant() != null ? r.getMerchant().getId() : null);
        m.put("consumerName", r.getConsumer().getName());
        m.put("priceObserved", r.getPriceObserved());
        m.put("officialPrice", r.getOfficialPrice());
        m.put("description", r.getDescription());
        m.put("status", r.getStatus().name());
        m.put("priority", r.getPriority().name());
        m.put("lat", r.getLat()); m.put("lng", r.getLng());
        m.put("createdAt", r.getCreatedAt().toString());
        if (r.getOfficialPrice() != null && r.getOfficialPrice() > 0) {
            double ecart = (r.getPriceObserved() - r.getOfficialPrice()) / r.getOfficialPrice() * 100;
            m.put("ecartPercent", Math.round(ecart * 10.0) / 10.0);
        }
        return m;
    }
}
