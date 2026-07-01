package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "produits")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Produit {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false)
    private String name;

    @Column(name = "categorie", nullable = false)
    private String category;

    @Column(name = "unite")
    @Builder.Default
    private String unit = "kg";
}
