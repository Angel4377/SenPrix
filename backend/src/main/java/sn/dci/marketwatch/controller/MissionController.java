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

@RestController
@RequestMapping("/api/agent/missions")
@PreAuthorize("hasRole('AGENT')")
public class MissionController {

    private final MissionRepository missionRepo;
    private final RegionRepository regionRepo;
    private final UtilisateurRepository userRepo;

    public MissionController(MissionRepository missionRepo, RegionRepository regionRepo,
                             UtilisateurRepository userRepo) {
        this.missionRepo = missionRepo; this.regionRepo = regionRepo; this.userRepo = userRepo;
    }

    @GetMapping
    public ResponseEntity<?> myMissions(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(missionRepo.findByAgent_IdOrderByScheduledDateDesc(ud.getId())
            .stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> createMission(@RequestBody Map<String, Object> body, Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        Utilisateur agent  = userRepo.findById(ud.getId()).orElseThrow();
        Region region = regionRepo.findById(Long.valueOf(body.get("regionId").toString())).orElseThrow();

        Mission m = Mission.builder()
            .agent(agent).region(region)
            .title(body.get("title").toString())
            .description(body.getOrDefault("description","").toString())
            .scheduledDate(LocalDate.parse(body.get("scheduledDate").toString()))
            .build();
        missionRepo.save(m);
        return ResponseEntity.ok(Map.of("message", "Mission créée.", "id", m.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        Mission m = missionRepo.findById(id)
            .filter(ms -> ms.getAgent().getId().equals(ud.getId()))
            .orElseThrow();
        m.setStatus(Mission.Statut.valueOf(body.get("status").toUpperCase()));
        missionRepo.save(m);
        return ResponseEntity.ok(Map.of("message", "Statut mis à jour."));
    }

    private Map<String, Object> toMap(Mission m) {
        return Map.of(
            "id", m.getId(),
            "title", m.getTitle(),
            "description", m.getDescription() != null ? m.getDescription() : "",
            "regionName", m.getRegion() != null ? m.getRegion().getName() : "",
            "regionId", m.getRegion() != null ? m.getRegion().getId() : 0,
            "status", m.getStatus().name(),
            "scheduledDate", m.getScheduledDate() != null ? m.getScheduledDate().toString() : ""
        );
    }
}
