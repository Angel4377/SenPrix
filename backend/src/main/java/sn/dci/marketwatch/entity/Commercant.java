package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "commercants")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Commercant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false)
    private String name;

    @Column(name = "adresse")
    private String address;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_region")
    private Region region;

    @Column(name = "latitude")
    @Builder.Default
    private Double lat = 14.6937;

    @Column(name = "longitude")
    @Builder.Default
    private Double lng = -17.4441;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur")
    private Utilisateur user;

    @Column(name = "statut")
    @Builder.Default
    private String status = "active";
}
