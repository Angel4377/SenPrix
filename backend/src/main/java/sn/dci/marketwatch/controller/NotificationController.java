package sn.dci.marketwatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.repository.NotificationRepository;
import sn.dci.marketwatch.security.UserDetailsImpl;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notifRepo;

    public NotificationController(NotificationRepository notifRepo) {
        this.notifRepo = notifRepo;
    }

    @GetMapping
    public ResponseEntity<?> getAll(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(notifRepo.findByUser_IdOrderByCreatedAtDesc(ud.getId()).stream().map(n ->
            Map.of("id", n.getId(), "message", n.getMessage(), "type", n.getType(),
                   "isRead", n.getIsRead(), "createdAt", n.getCreatedAt().toString())
        ).toList());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", notifRepo.countByUser_IdAndIsReadFalse(ud.getId())));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        var notifs = notifRepo.findByUser_IdOrderByCreatedAtDesc(ud.getId());
        notifs.forEach(n -> n.setIsRead(true));
        notifRepo.saveAll(notifs);
        return ResponseEntity.ok(Map.of("message", "Notifications marquées comme lues."));
    }
}
