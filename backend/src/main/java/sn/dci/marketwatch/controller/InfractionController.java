package sn.dci.marketwatch.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.Infraction;
import sn.dci.marketwatch.repository.InfractionRepository;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/agent/infractions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('AGENT') or hasRole('ADMIN')")
public class InfractionController {
    private final InfractionRepository infractionRepository;

    @GetMapping
    public ResponseEntity<List<Infraction>> list() {
        return ResponseEntity.ok(infractionRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Infraction> create(@RequestBody Map<String, Object> body) {
        Infraction inf = new Infraction();
        String type = body.getOrDefault("typeInfraction","PRIX_EXCESSIF").toString();
        String desc = body.getOrDefault("description","").toString();
        String pc   = body.getOrDefault("prixConstate","").toString();
        String po   = body.getOrDefault("prixOfficiel","").toString();
        String lat  = body.getOrDefault("latitude","").toString();
        String lng  = body.getOrDefault("longitude","").toString();
        inf.setDescription("["+type+"] "+desc+(pc.isEmpty()?"":"|"+pc+"/"+po+" FCFA")+(lat.isEmpty()?"":"|GPS:"+lat+","+lng));
        inf.setStatus(Infraction.Statut.OPEN);
        Infraction saved = infractionRepository.save(inf);
        log.info("Infraction #{} creee", saved.getId());
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> generatePDF(@PathVariable Long id) {
        return infractionRepository.findById(id).map(inf -> ResponseEntity.ok()
            .header("Content-Type","text/plain")
            .header("Content-Disposition","attachment; filename=\"constat_"+id+".txt\"")
            .body(("CONSTAT #"+id+"\n"+inf.getDescription()).getBytes()))
            .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Infraction> updateStatut(@PathVariable Long id, @RequestBody Map<String,String> body) {
        return infractionRepository.findById(id).map(inf -> {
            try { inf.setStatus(Infraction.Statut.valueOf(body.getOrDefault("statut","OPEN"))); }
            catch (Exception e) { inf.setStatus(Infraction.Statut.OPEN); }
            return ResponseEntity.ok(infractionRepository.save(inf));
        }).orElse(ResponseEntity.notFound().build());
    }
}