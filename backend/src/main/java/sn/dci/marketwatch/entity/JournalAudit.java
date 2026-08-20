package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "journaux_audit", indexes = {
    @Index(name = "idx_audit_utilisateur", columnList = "id_utilisateur"),
    @Index(name = "idx_audit_action",      columnList = "action"),
    @Index(name = "idx_audit_cree_le",     columnList = "cree_le")
})
@EntityListeners(AuditingEntityListener.class)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class JournalAudit {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 50)
    private Action action;

    @Column(name = "id_utilisateur")
    private Long userId;

    @Column(name = "email_utilisateur", length = 100)
    private String userEmail;

    @Column(name = "ressource", length = 50)
    private String resource;

    @Column(name = "id_ressource")
    private Long resourceId;

    @Column(name = "adresse_ip", length = 45)
    private String ipAddress;

    @Column(name = "details", length = 500)
    private String details;

    @CreatedDate
    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Action {
        LOGIN, LOGIN_FAILED, LOGOUT, REGISTER, TOKEN_REFRESHED,
        REPORT_CREATED, REPORT_CONFIRMED, REPORT_VALIDATED,
        REPORT_REJECTED, REPORT_RESOLVED,
        MISSION_CREATED, MISSION_COMPLETED,
        INFRACTION_RECORDED, PRICE_IMPORTED,
        ACCESS_DENIED, INVALID_TOKEN,
        USER_ROLE_CHANGED, USER_STATUS_CHANGED, ALERT_CONFIG_UPDATED
    }
}
