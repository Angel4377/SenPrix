package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.JournalAudit;
import sn.dci.marketwatch.entity.Utilisateur;
import sn.dci.marketwatch.repository.UtilisateurRepository;
import sn.dci.marketwatch.security.UserDetailsImpl;
import sn.dci.marketwatch.service.AuditService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * Cas d'utilisation Admin : "Gérer les utilisateurs et les rôles" (Figure 6, Chapitre 3).
 * Permet de lister les comptes, changer le rôle d'un utilisateur, et
 * activer/désactiver un compte (désactivation = connexion refusée, voir
 * UserDetailsImpl#isEnabled et AuthController#login).
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UtilisateurRepository userRepo;
    private final AuditService auditService;

    public AdminUserController(UtilisateurRepository userRepo, AuditService auditService) {
        this.userRepo = userRepo;
        this.auditService = auditService;
    }

    /** GET /api/admin/users?role=CONSUMER (role optionnel) */
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String role) {
        List<Utilisateur> users = (role != null)
            ? userRepo.findByRoleOrderByNameAsc(Utilisateur.Role.valueOf(role.toUpperCase()))
            : userRepo.findAllByOrderByNameAsc();
        return ResponseEntity.ok(users.stream().map(this::toMap).toList());
    }

    /** PATCH /api/admin/users/{id}/role — body: { "role": "AGENT" } */
    @PatchMapping("/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable Long id, @RequestBody Map<String, String> body,
                                         Authentication auth, HttpServletRequest request) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        if (ud.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vous ne pouvez pas modifier votre propre rôle."));
        }
        Utilisateur user = userRepo.findById(id).orElseThrow();
        Utilisateur.Role newRole = Utilisateur.Role.valueOf(body.get("role").toUpperCase());
        Utilisateur.Role oldRole = user.getRole();
        user.setRole(newRole);
        userRepo.save(user);

        auditService.log(JournalAudit.Action.USER_ROLE_CHANGED,
                ud.getId(), ud.getUsername(),
                "Rôle de " + user.getEmail() + " changé : " + oldRole + " → " + newRole, request);

        return ResponseEntity.ok(Map.of("message", "Rôle mis à jour.", "user", toMap(user)));
    }

    /** PATCH /api/admin/users/{id}/status — body: { "active": false } */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleActive(@PathVariable Long id, @RequestBody Map<String, Boolean> body,
                                           Authentication auth, HttpServletRequest request) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        if (ud.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vous ne pouvez pas désactiver votre propre compte."));
        }
        Utilisateur user = userRepo.findById(id).orElseThrow();
        user.setActive(body.get("active"));
        userRepo.save(user);

        auditService.log(JournalAudit.Action.USER_STATUS_CHANGED,
                ud.getId(), ud.getUsername(),
                "Compte " + user.getEmail() + " : " + (Boolean.TRUE.equals(user.getActive()) ? "réactivé" : "désactivé"),
                request);

        return ResponseEntity.ok(Map.of("message",
            Boolean.TRUE.equals(user.getActive()) ? "Compte réactivé." : "Compte désactivé.",
            "user", toMap(user)));
    }

    private Map<String, Object> toMap(Utilisateur u) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", u.getId());
        m.put("name", u.getName());
        m.put("email", u.getEmail());
        m.put("role", u.getRole().name());
        m.put("region", u.getRegion());
        m.put("active", u.getActive());
        m.put("createdAt", u.getCreatedAt());
        return m;
    }
}
