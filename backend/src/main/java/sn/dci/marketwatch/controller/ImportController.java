package sn.dci.marketwatch.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sn.dci.marketwatch.entity.PrixOfficiel;
import sn.dci.marketwatch.repository.PrixOfficielRepository;
import sn.dci.marketwatch.repository.ProduitRepository;
import sn.dci.marketwatch.repository.RegionRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/prices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ImportController {
    private final PrixOfficielRepository officialPriceRepository;
    private final ProduitRepository productRepository;
    private final RegionRepository regionRepository;

    @PostMapping("/import")
    public ResponseEntity<Map<String,Object>> importCSV(@RequestParam("file") MultipartFile file) {
        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(),"UTF-8"))) {
            if (reader.readLine() == null) return ResponseEntity.badRequest().body(Map.of("error","Fichier vide"));
            String line; int n = 2;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) { n++; continue; }
                String[] c = line.split(";");
                if (c.length < 3) { errors.add("Ligne "+n+": format invalide"); skipped++; n++; continue; }
                try {
                    double prix = Double.parseDouble(c[2].trim());
                    var prod = productRepository.findAll().stream().filter(p->p.getName().equalsIgnoreCase(c[0].trim())).findFirst().orElse(null);
                    var reg  = regionRepository.findAll().stream().filter(r->r.getName().equalsIgnoreCase(c[1].trim())).findFirst().orElse(null);
                    if (prod==null) { errors.add("Ligne "+n+": produit introuvable"); skipped++; }
                    else if (reg==null) { errors.add("Ligne "+n+": region introuvable"); skipped++; }
                    else {
                        PrixOfficiel op = new PrixOfficiel();
                        op.setProduct(prod); op.setRegion(reg); op.setPrice(prix);
                        op.setValidFrom(c.length>=5 ? LocalDate.parse(c[4].trim()) : LocalDate.now());
                        officialPriceRepository.save(op); imported++;
                    }
                } catch (Exception e) { errors.add("Ligne "+n+": "+e.getMessage()); skipped++; }
                n++;
            }
        } catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error",e.getMessage())); }
        log.info("Import: {} importes, {} ignores", imported, skipped);
        return ResponseEntity.ok(Map.of("imported",imported,"skipped",skipped,"errors",errors.subList(0,Math.min(errors.size(),10))));
    }
}