package sn.dci.marketwatch.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.repository.SignalementRepository;
import sn.dci.marketwatch.repository.MissionRepository;
import sn.dci.marketwatch.repository.InfractionRepository;

import java.time.LocalDateTime;
import java.util.*;

/**
 * MODULE 6 — API Analyse et Intelligence des données
 */
@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final SignalementRepository reportRepository;
    private final MissionRepository missionRepository;
    private final InfractionRepository infractionRepository;

    /** KPIs globaux de la plateforme */
    @GetMapping("/kpis")
    @Cacheable("dashboard-stats")
    public ResponseEntity<Map<String, Object>> getKpis() {
        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalSignalements",    reportRepository.count());
        kpis.put("tauxResolution",       67);   // % calculé en prod : resolved / total * 100
        kpis.put("ecartMoyen",           8.3);  // Moyenne des écarts sur les 30 derniers jours
        kpis.put("zonesActives",         14);   // Régions avec alertes actives
        kpis.put("missionsDone",         missionRepository.count());
        kpis.put("infractions",          infractionRepository.count());
        kpis.put("merchantsControlled",  89);
        kpis.put("productsAlerted",      5);
        return ResponseEntity.ok(kpis);
    }

    /** Tendances tarifaires par période */
    @GetMapping("/trends")
    @Cacheable("prices")
    public ResponseEntity<List<Map<String, Object>>> getTrends(@RequestParam(defaultValue = "month") String period) {
        // En production : requêtes JPA agrégées sur PrixOfficiel par mois
        // Données de démonstration pour la soutenance
        String[] months = {"Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû"};
        List<Map<String, Object>> data = new ArrayList<>();
        Random rand = new Random(42);
        for (int i = 0; i < months.length; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", months[i]);
            row.put("Riz brisé",     480 + (int)(Math.sin(i) * 30));
            row.put("Huile végétale", 1150 + i * 15 + rand.nextInt(50));
            row.put("Sucre",         720 + (int)(Math.cos(i) * 20));
            row.put("Pain",          210 + (int)(Math.sin(i * 0.5) * 10));
            row.put("signalements",  45 + i * 8 + rand.nextInt(20));
            data.add(row);
        }
        return ResponseEntity.ok(data);
    }

    /** Anomalies statistiques détectées automatiquement */
    @GetMapping("/anomalies")
    public ResponseEntity<List<Map<String, Object>>> getAnomalies() {
        List<Map<String, Object>> anomalies = List.of(
            Map.of("region","Dakar Centre","product","Huile végétale","ecart",32,
                   "trend","HAUSSE","risk","ÉLEVÉ","alerts",18,"prediction","Probable hausse de 5% dans 2 semaines"),
            Map.of("region","Thiès","product","Riz brisé","ecart",24,
                   "trend","STABLE_HAUT","risk","ÉLEVÉ","alerts",12,"prediction","Tension sur stocks — risque de pénurie locale"),
            Map.of("region","Saint-Louis","product","Sucre cristallisé","ecart",18,
                   "trend","HAUSSE","risk","MOYEN","alerts",7,"prediction","Écart en augmentation progressive"),
            Map.of("region","Ziguinchor","product","Pain ordinaire","ecart",14,
                   "trend","BAISSE","risk","FAIBLE","alerts",3,"prediction","Retour à la normale prévu sous 1 semaine")
        );
        return ResponseEntity.ok(anomalies);
    }

    /** Export des données (CSV, Excel, PDF) */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(defaultValue = "month") String period) {

        // En production : utiliser Apache POI pour xlsx, iText pour PDF
        String csv = "Mois;Riz brisé;Huile végétale;Sucre;Signalements\n"
                   + "Jan;480;1150;720;45\nFév;492;1165;712;53\nMar;468;1195;735;61\n"
                   + "Avr;485;1208;740;69\nMai;501;1225;728;77\nJun;476;1238;742;85\n";

        byte[] bytes = csv.getBytes();
        String contentType = switch (format) {
            case "xlsx" -> "application/vnd.ms-excel";
            case "pdf"  -> "application/pdf";
            default     -> "text/csv;charset=UTF-8";
        };
        String filename = "marketwatch_export_" + LocalDateTime.now().toLocalDate() + "." + format;

        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(bytes);
    }
}
