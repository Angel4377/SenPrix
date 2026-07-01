package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.Signalement;
import sn.dci.marketwatch.repository.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final SignalementRepository reportRepo;
    private final CommercantRepository merchantRepo;
    private final ProduitRepository productRepo;
    private final MissionRepository missionRepo;
    private final InfractionRepository infractionRepo;

    public DashboardController(SignalementRepository r, CommercantRepository m,
                               ProduitRepository p, MissionRepository mi,
                               InfractionRepository inf) {
        this.reportRepo = r; this.merchantRepo = m; this.productRepo = p;
        this.missionRepo = mi; this.infractionRepo = inf;
    }

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<?> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalReports",     reportRepo.count());
        stats.put("pendingReports",   reportRepo.countByStatus(Signalement.Statut.PENDING));
        stats.put("criticalReports",  reportRepo.countByPriority(Signalement.Priorite.CRITICAL));
        stats.put("resolvedReports",  reportRepo.countByStatus(Signalement.Statut.RESOLVED));
        stats.put("totalMerchants",   merchantRepo.count());
        stats.put("totalProducts",    productRepo.count());
        stats.put("totalMissions",    missionRepo.count());
        stats.put("totalInfractions", infractionRepo.count());

        List<Map<String, Object>> byRegion = new ArrayList<>();
        try {
            for (Object[] row : reportRepo.countByRegion()) {
                if (row[0] != null) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", row[0].toString());
                    m.put("count", row[1]);
                    byRegion.add(m);
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        stats.put("byRegion", byRegion);

        List<Map<String, Object>> byPriority = new ArrayList<>();
        try {
            for (Object[] row : reportRepo.countByPriorityGrouped()) {
                if (row[0] != null) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("priority", row[0].toString());
                    m.put("count", row[1]);
                    byPriority.add(m);
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        stats.put("byPriority", byPriority);

        List<Map<String, Object>> recent = new ArrayList<>();
        try {
            for (Signalement r : reportRepo.findAllWithDetailsOrderByDate().stream().limit(10).toList()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",           r.getId());
                m.put("product",      r.getProduct()  != null ? r.getProduct().getName()  : "");
                m.put("region",       r.getRegion()   != null ? r.getRegion().getName()   : "");
                m.put("priceObserved",r.getPriceObserved()  != null ? r.getPriceObserved()  : 0);
                m.put("officialPrice",r.getOfficialPrice()  != null ? r.getOfficialPrice()  : 0);
                m.put("priority",     r.getPriority() != null ? r.getPriority().name() : "NORMAL");
                m.put("status",       r.getStatus()   != null ? r.getStatus().name()   : "PENDING");
                m.put("createdAt",    r.getCreatedAt()!= null ? r.getCreatedAt().toString() : "");
                recent.add(m);
            }
        } catch (Exception e) { e.printStackTrace(); }
        stats.put("recentReports", recent);

        return ResponseEntity.ok(stats);
    }
}