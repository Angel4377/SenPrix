package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalements")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Signalement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_consommateur", nullable = false)
    private Utilisateur consumer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_produit", nullable = false)
    private Produit product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_commercant")
    private Commercant merchant;

    @Column(name = "prix_observe", nullable = false)
    private Double priceObserved;

    @Column(name = "prix_officiel_ref")
    private Double officialPrice;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_region")
    private Region region;

    @Column(name = "latitude")
    private Double lat;

    @Column(name = "longitude")
    private Double lng;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    @Builder.Default
    private Statut status = Statut.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "priorite")
    @Builder.Default
    private Priorite priority = Priorite.NORMAL;

    @Column(name = "nb_confirmations")
    @Builder.Default
    private Integer confirmationCount = 0;

    @Column(name = "cree_le")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public Double getEcart() {
        if (officialPrice == null || officialPrice == 0) return null;
        return (priceObserved - officialPrice) / officialPrice * 100;
    }

    public enum Statut { PENDING, VERIFIED, RESOLVED, REJECTED }
    public enum Priorite { LOW, NORMAL, HIGH, CRITICAL }
}
