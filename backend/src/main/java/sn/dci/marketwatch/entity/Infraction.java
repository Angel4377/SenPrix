package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "infractions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Infraction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_signalement")
    private Signalement report;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_agent", nullable = false)
    private Utilisateur agent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_commercant")
    private Commercant merchant;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "montant_amende")
    @Builder.Default
    private Double fineAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    @Builder.Default
    private Statut status = Statut.OPEN;

    @Column(name = "cree_le")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Statut { OPEN, CLOSED }
}
