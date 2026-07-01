package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Region {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", unique = true, nullable = false)
    private String name;
}
