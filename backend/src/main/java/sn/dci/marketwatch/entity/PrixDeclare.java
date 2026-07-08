package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Prix déclaré par un commerçant pour un produit donné (espace commerçant).
 * Distinct du PrixOfficiel (mercuriale de référence fixée par la DCI) :
 * ceci représente le prix que le commerçant affirme pratiquer dans sa boutique,
 * comparé automatiquement au prix officiel pour déterminer sa conformité.
 */
@Entity
@Table(name = "prix_declares", uniqueConstraints = @UniqueConstraint(columnNames = {"id_commercant", "id_produit"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PrixDeclare {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_commercant", nullable = false)
    private Commercant commercant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_produit", nullable = false)
    private Produit product;

    @Column(name = "prix", nullable = false)
    private Double price;

    @Column(name = "devise")
    @Builder.Default
    private String currency = "FCFA";

    @Column(name = "maj_le")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "justification_motif")
    private String justificationMotif;

    @Column(name = "justification_commentaire", length = 1000)
    private String justificationCommentaire;

    @Column(name = "justifie_le")
    private LocalDateTime justifiedAt;
}
