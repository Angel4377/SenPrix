package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur user;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "type")
    @Builder.Default
    private String type = "info";

    @Column(name = "est_lu")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "cree_le")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
