package sn.dci.marketwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "tokens_rafraichissement")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TokenRafraichissement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true, length = 36)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur user;

    @Column(name = "date_expiration", nullable = false)
    private Instant expiryDate;

    @Column(name = "est_valide", nullable = false)
    @Builder.Default
    private boolean valid = true;
}
