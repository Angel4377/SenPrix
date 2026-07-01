package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Mission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_agent", nullable = false)
    private Utilisateur agent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_region")
    private Region region;

    @Column(name = "titre", nullable = false)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    @Builder.Default
    private Statut status = Statut.PLANNED;

    @Column(name = "date_planifiee")
    private LocalDate scheduledDate;

    @Column(name = "cree_le")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Statut { PLANNED, IN_PROGRESS, COMPLETED }
}
