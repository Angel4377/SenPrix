package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prix_officiels")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PrixOfficiel {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_produit", nullable = false)
    private Produit product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_region", nullable = false)
    private Region region;

    @Column(name = "prix", nullable = false)
    private Double price;

    @Column(name = "devise")
    @Builder.Default
    private String currency = "FCFA";

    @Column(name = "valide_du")
    private LocalDate validFrom;

    @Column(name = "valide_au")
    private LocalDate validTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defini_par")
    private Utilisateur setBy;

    @Column(name = "cree_le")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActive() {
        LocalDate today = LocalDate.now();
        boolean afterStart = (validFrom == null) || !today.isBefore(validFrom);
        boolean beforeEnd  = (validTo   == null) || !today.isAfter(validTo);
        return afterStart && beforeEnd;
    }
}
