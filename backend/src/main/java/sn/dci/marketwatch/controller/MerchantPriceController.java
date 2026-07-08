package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.*;
import sn.dci.marketwatch.repository.*;
import sn.dci.marketwatch.security.UserDetailsImpl;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Espace commerçant : le commerçant déclare le prix qu'il pratique réellement
 * pour chaque produit réglementé, et peut justifier un écart par rapport au
 * prix officiel (mercuriale DCI).
 */
@RestController
@RequestMapping("/api/merchant")
@PreAuthorize("hasRole('MERCHANT')")
public class MerchantPriceController {

    private final CommercantRepository merchantRepo;
    private final PrixDeclareRepository declareRepo;
    private final PrixOfficielRepository officielRepo;
    private final ProduitRepository productRepo;
    private final UtilisateurRepository userRepo;

    public MerchantPriceController(CommercantRepository merchantRepo, PrixDeclareRepository declareRepo,
                                    PrixOfficielRepository officielRepo, ProduitRepository productRepo,
                                    UtilisateurRepository userRepo) {
        this.merchantRepo = merchantRepo; this.declareRepo = declareRepo;
        this.officielRepo = officielRepo; this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    /** GET /api/merchant/shop — la boutique du commerçant connecté */
    @GetMapping("/shop")
    public ResponseEntity<?> getShop(Authentication auth) {
        Commercant shop = currentShop(auth);
        if (shop == null) return ResponseEntity.ok(Map.of());
        return ResponseEntity.ok(Map.of(
            "id", shop.getId(), "name", shop.getName(),
            "address", shop.getAddress() != null ? shop.getAddress() : "",
            "region", shop.getRegion() != null ? shop.getRegion().getName() : ""
        ));
    }

    /** GET /api/merchant/prices — catalogue des produits + prix déclaré + conformité */
    @GetMapping("/prices")
    public ResponseEntity<?> getDeclaredPrices(Authentication auth) {
        Commercant shop = currentShop(auth);
        if (shop == null || shop.getRegion() == null) return ResponseEntity.ok(List.of());

        List<PrixOfficiel> officiels = officielRepo.findCurrentByRegion(shop.getRegion().getName());
        Map<Long, PrixDeclare> declared = new HashMap<>();
        declareRepo.findByCommercant_Id(shop.getId()).forEach(d -> declared.put(d.getProduct().getId(), d));

        List<Map<String, Object>> rows = officiels.stream().map(off -> {
            PrixDeclare d = declared.get(off.getProduct().getId());
            Map<String, Object> m = new HashMap<>();
            m.put("productId", off.getProduct().getId());
            m.put("productName", off.getProduct().getName());
            m.put("category", off.getProduct().getCategory());
            m.put("unit", off.getProduct().getUnit());
            m.put("officialPrice", off.getPrice());
            m.put("declaredPriceId", d != null ? d.getId() : null);
            m.put("declaredPrice", d != null ? d.getPrice() : null);
            boolean conforme = d == null || d.getPrice() <= off.getPrice();
            m.put("conformity", d == null ? "NON_DECLARE" : (conforme ? "CONFORME" : "NON_CONFORME"));
            m.put("ecart", d != null ? Math.round(((d.getPrice() - off.getPrice()) / off.getPrice()) * 1000.0) / 10.0 : null);
            m.put("justificationMotif", d != null ? d.getJustificationMotif() : null);
            m.put("justificationCommentaire", d != null ? d.getJustificationCommentaire() : null);
            m.put("justifiedAt", d != null ? d.getJustifiedAt() : null);
            return m;
        }).toList();

        return ResponseEntity.ok(rows);
    }

    /** PUT /api/merchant/prices — déclarer ou modifier le prix pratiqué pour un produit */
    @PutMapping("/prices")
    public ResponseEntity<?> setDeclaredPrice(@RequestBody Map<String, Object> body, Authentication auth) {
        Commercant shop = currentShop(auth);
        if (shop == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune boutique associée à ce compte."));

        Long productId = Long.valueOf(body.get("productId").toString());
        Double price   = Double.valueOf(body.get("price").toString());
        Produit product = productRepo.findById(productId).orElseThrow();

        PrixDeclare declare = declareRepo.findByCommercant_IdAndProduct_Id(shop.getId(), productId)
            .orElse(PrixDeclare.builder().commercant(shop).product(product).build());
        declare.setPrice(price);
        declare.setUpdatedAt(LocalDateTime.now());
        // Un nouveau prix déclaré efface l'ancienne justification (elle ne concernait que l'écart précédent)
        declare.setJustificationMotif(null);
        declare.setJustificationCommentaire(null);
        declare.setJustifiedAt(null);
        declareRepo.save(declare);

        return ResponseEntity.ok(Map.of("message", "Prix déclaré mis à jour.", "id", declare.getId()));
    }

    /** POST /api/merchant/prices/{id}/justify — justifier un écart de conformité */
    @PostMapping("/prices/{id}/justify")
    public ResponseEntity<?> justify(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Commercant shop = currentShop(auth);
        PrixDeclare declare = declareRepo.findById(id).orElseThrow();
        if (shop == null || !declare.getCommercant().getId().equals(shop.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Cette déclaration n'appartient pas à votre boutique."));
        }
        declare.setJustificationMotif(body.get("motif"));
        declare.setJustificationCommentaire(body.get("commentaire"));
        declare.setJustifiedAt(LocalDateTime.now());
        declareRepo.save(declare);
        return ResponseEntity.ok(Map.of("message", "Justification transmise."));
    }

    private Commercant currentShop(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        List<Commercant> shops = merchantRepo.findByUser_Id(ud.getId());
        return shops.isEmpty() ? null : shops.get(0);
    }
}
