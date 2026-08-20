package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateurs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Utilisateur {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false)
    private String name;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "region")
    private String region;

    /** Compte actif ou désactivé par un Admin (cas d'utilisation "Gérer les utilisateurs et les rôles"). */
    @Builder.Default
    @Column(name = "actif", nullable = false)
    private Boolean active = true;

    @Builder.Default
    @Column(name = "cree_le", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        ADMIN, CONSUMER, AGENT, MERCHANT
    }
}
