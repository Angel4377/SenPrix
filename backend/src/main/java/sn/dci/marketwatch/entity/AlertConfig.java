package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Seuils d'alerte automatique (en % d'écart entre prix observé/déclaré et
 * prix officiel) utilisés pour calculer la priorité d'un signalement.
 * Table à une seule ligne (singleton applicatif), configurable par l'Admin
 * (OS_A — Domaine A / OSNF... : automatisation de la détection d'anomalies).
 */
@Entity
@Table(name = "alert_config")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AlertConfig {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Écart (%) à partir duquel un signalement est classé HIGH. */
    @Builder.Default
    @Column(name = "seuil_high")
    private Double highThreshold = 10.0;

    /** Écart (%) à partir duquel un signalement est classé CRITICAL. */
    @Builder.Default
    @Column(name = "seuil_critical")
    private Double criticalThreshold = 20.0;

    /** Écart (%) en-dessous ou égal duquel un signalement est classé LOW. */
    @Builder.Default
    @Column(name = "seuil_low")
    private Double lowThreshold = 0.0;

    @Column(name = "maj_le")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maj_par")
    private Utilisateur updatedBy;
}
