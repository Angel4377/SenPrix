package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.*;
import sn.dci.marketwatch.repository.*;
import sn.dci.marketwatch.security.UserDetailsImpl;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class PriceController {

    private final PrixOfficielRepository priceRepo;
    private final ProduitRepository productRepo;
    private final RegionRepository regionRepo;
    private final CommercantRepository merchantRepo;
    private final UtilisateurRepository userRepo;
    private final PrixDeclareRepository declareRepo;

    public PriceController(PrixOfficielRepository priceRepo, ProduitRepository productRepo,
                           RegionRepository regionRepo, CommercantRepository merchantRepo,
                           UtilisateurRepository userRepo, PrixDeclareRepository declareRepo) {
        this.priceRepo = priceRepo; this.productRepo = productRepo;
        this.regionRepo = regionRepo; this.merchantRepo = merchantRepo;
        this.userRepo = userRepo; this.declareRepo = declareRepo;
    }

    /** GET /api/prices?region=Dakar */
    @GetMapping("/prices")
    public ResponseEntity<?> getPrices(@RequestParam(defaultValue = "Dakar") String region) {
        return ResponseEntity.ok(priceRepo.findCurrentByRegion(region).stream().map(this::toMap).toList());
    }

    /** GET /api/prices/all */
    @GetMapping("/prices/all")
    public ResponseEntity<?> getAllPrices() {
        return ResponseEntity.ok(priceRepo.findAllCurrent().stream().map(this::toMap).toList());
    }

    /** GET /api/admin/prices/history — Admin seul : prix antérieurs (remplacés) */
    @GetMapping("/admin/prices/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPriceHistory() {
        return ResponseEntity.ok(priceRepo.findAllHistory().stream().map(this::toMap).toList());
    }

    /** POST /api/admin/prices – Admin seul */
    @PostMapping("/admin/prices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setPrice(@RequestBody Map<String, Object> body, Authentication auth) {
        Long productId = Long.valueOf(body.get("productId").toString());
        Long regionId  = Long.valueOf(body.get("regionId").toString());
        Double price   = Double.valueOf(body.get("price").toString());
        LocalDate from = LocalDate.parse(body.getOrDefault("validFrom", LocalDate.now().toString()).toString());

        // Expirer l'ancien prix
        priceRepo.findCurrentByProductAndRegion(productId, regionId)
                 .ifPresent(old -> { old.setValidTo(from); priceRepo.save(old); });

        Produit product = productRepo.findById(productId).orElseThrow();
        Region  region  = regionRepo.findById(regionId).orElseThrow();
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        Utilisateur setter = userRepo.findById(ud.getId()).orElseThrow();

        PrixOfficiel op = PrixOfficiel.builder()
            .product(product).region(region).price(price)
            .validFrom(from).setBy(setter).build();
        priceRepo.save(op);
        return ResponseEntity.ok(Map.of("message", "Prix mis à jour avec succès."));
    }

    /**
     * GET /api/prices/compare?regionId=&productId= — Consommateur (OS_C2)
     * Compare, pour un produit et une région donnés, le prix officiel avec les
     * prix réellement déclarés par les commerçants de cette région.
     * (Remplace l'ancienne implémentation à données fictives qui vivait par erreur
     * dans le module Gamification, retiré du projet.)
     */
    @GetMapping("/prices/compare")
    public ResponseEntity<?> comparePrices(@RequestParam Long regionId, @RequestParam Long productId) {
        Produit product = productRepo.findById(productId).orElseThrow();
        Region region = regionRepo.findById(regionId).orElseThrow();
        Double officialPrice = priceRepo.findCurrentByProductAndRegion(productId, regionId)
                .map(PrixOfficiel::getPrice).orElse(null);

        List<Map<String, Object>> merchants = declareRepo
            .findByProduct_IdAndCommercant_Region_IdOrderByPriceAsc(productId, regionId)
            .stream()
            .map(d -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", d.getCommercant().getName());
                m.put("address", d.getCommercant().getAddress());
                m.put("lat", d.getCommercant().getLat());
                m.put("lng", d.getCommercant().getLng());
                m.put("price", d.getPrice());
                if (officialPrice != null && officialPrice > 0) {
                    double ecart = Math.round(((d.getPrice() - officialPrice) / officialPrice) * 1000.0) / 10.0;
                    m.put("ecart", ecart);
                }
                return m;
            }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("product", product.getName());
        result.put("region", region.getName());
        result.put("officialPrice", officialPrice);
        result.put("unit", product.getUnit());
        result.put("merchants", merchants);
        return ResponseEntity.ok(result);
    }

    /** GET /api/products */
    @GetMapping("/products")
    public ResponseEntity<?> getProducts() {
        return ResponseEntity.ok(productRepo.findAllByOrderByCategoryAscNameAsc().stream().map(p ->
            Map.of("id", p.getId(), "name", p.getName(), "category", p.getCategory(), "unit", p.getUnit())
        ).toList());
    }

    /** POST /api/admin/products */
    @PostMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addProduct(@RequestBody Map<String, String> body) {
        Produit p = Produit.builder()
            .name(body.get("name")).category(body.get("category"))
            .unit(body.getOrDefault("unit", "kg")).build();
        productRepo.save(p);
        return ResponseEntity.ok(Map.of("message", "Produit ajouté.", "id", p.getId()));
    }

    /** GET /api/regions */
    @GetMapping("/regions")
    public ResponseEntity<?> getRegions() {
        return ResponseEntity.ok(regionRepo.findAll().stream()
            .sorted(Comparator.comparing(Region::getName))
            .map(r -> Map.of("id", r.getId(), "name", r.getName()))
            .toList());
    }

    /** GET /api/merchants */
    @GetMapping("/merchants")
    public ResponseEntity<?> getMerchants() {
        return ResponseEntity.ok(merchantRepo.findAllByOrderByRegion_NameAscNameAsc().stream().map(m ->
            Map.of("id", m.getId(), "name", m.getName(),
                   "address", m.getAddress() != null ? m.getAddress() : "",
                   "region", m.getRegion() != null ? m.getRegion().getName() : "",
                   "lat", m.getLat(), "lng", m.getLng())
        ).toList());
    }

    private Map<String, Object> toMap(PrixOfficiel op) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", op.getId());
        m.put("productId", op.getProduct().getId());
        m.put("productName", op.getProduct().getName());
        m.put("category", op.getProduct().getCategory());
        m.put("unit", op.getProduct().getUnit());
        m.put("regionId", op.getRegion().getId());
        m.put("regionName", op.getRegion().getName());
        m.put("price", op.getPrice());
        m.put("validFrom", op.getValidFrom());
        m.put("validTo", op.getValidTo());
        m.put("setBy", op.getSetBy() != null ? op.getSetBy().getName() : null);
        return m;
    }
}
