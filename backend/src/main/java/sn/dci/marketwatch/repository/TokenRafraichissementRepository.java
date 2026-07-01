package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import sn.dci.marketwatch.entity.TokenRafraichissement;
import sn.dci.marketwatch.entity.Utilisateur;

import java.util.Optional;

public interface TokenRafraichissementRepository extends JpaRepository<TokenRafraichissement, Long> {

    Optional<TokenRafraichissement> findByToken(String token);

    @Modifying
    @Query("DELETE FROM TokenRafraichissement rt WHERE rt.user = :user")
    void deleteAllByUser(Utilisateur user);
}
