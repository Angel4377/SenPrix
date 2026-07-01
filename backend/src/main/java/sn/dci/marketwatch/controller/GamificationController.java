package sn.dci.marketwatch.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.repository.SignalementRepository;

import java.util.*;

/**
 * MODULE 3 — API Gamification (points, badges, classement)
 */
@RestController
@RequestMapping("/api/consumer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CONSUMER')")
public class GamificationController {

    private final SignalementRepository reportRepository;

    /** Profil gamification de l'utilisateur connecté */
    @GetMapping("/profile/gamification")
    public ResponseEntity<Map<String, Object>> getMyProfile() {
        // En production : calculer depuis la BDD (reports par user, validations, etc.)
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("totalPoints",       185);
        profile.put("reportsCount",      23);
        profile.put("validatedCount",    18);
        profile.put("confirmationsGiven", 12);
        profile.put("photosCount",       6);
        profile.put("criticalAlerts",    4);
        profile.put("rank",              7);
        profile.put("streak",            3);
        profile.put("earnedBadges", List.of(
                "first_report", "contributor_5", "vigilant_20", "confirmed", "photo", "critical"
        ));
        return ResponseEntity.ok(profile);
    }

    /** Top 10 classement national */
    @GetMapping("/leaderboard")
    @Cacheable("dashboard-stats")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        // En production : requête agrégée par userId avec SUM des points
        List<Map<String, Object>> board = List.of(
            Map.of("rank",1,"name","Aminata D.","points",1250,"reports",128,"badge","🏆"),
            Map.of("rank",2,"name","Moussa K.","points",980,"reports",97,"badge","🦅"),
            Map.of("rank",3,"name","Fatou S.","points",720,"reports",74,"badge","🦅"),
            Map.of("rank",4,"name","Ibrahim T.","points",610,"reports",61,"badge","⭐"),
            Map.of("rank",5,"name","Aissatou B.","points",530,"reports",53,"badge","⭐"),
            Map.of("rank",6,"name","Cheikh N.","points",420,"reports",42,"badge","⭐"),
            Map.of("rank",7,"name","Vous","points",185,"reports",23,"badge","⭐"),
            Map.of("rank",8,"name","Rokhaya L.","points",150,"reports",15,"badge","📢"),
            Map.of("rank",9,"name","Bamba F.","points",120,"reports",12,"badge","📢"),
            Map.of("rank",10,"name","Oumou D.","points",95,"reports",9,"badge","📢")
        );
        return ResponseEntity.ok(board);
    }

    /** Comparaison de prix entre commerçants d'une zone */
    @GetMapping("/prices/compare")
    public ResponseEntity<Map<String, Object>> comparePrices(
            @RequestParam Long regionId,
            @RequestParam Long productId) {
        // En production : jointure merchants + reports + official_prices filtrée par région
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("product", "Riz brisé");
        result.put("region", "Dakar");
        result.put("officialPrice", 500);
        result.put("unit", "kg");
        result.put("merchants", List.of(
            Map.of("name","Épicerie Fatou","address","Marché Sandaga","price",490,"ecart",-2),
            Map.of("name","Supermarché Auchan","address","Route de Ouakam","price",520,"ecart",4),
            Map.of("name","Boutique Mamadou","address","HLM Grand Yoff","price",600,"ecart",20),
            Map.of("name","Cash & Carry Diallo","address","Zone Industrielle","price",480,"ecart",-4),
            Map.of("name","Épicerie Al Amine","address","Médina","price",510,"ecart",2)
        ));
        return ResponseEntity.ok(result);
    }
}
