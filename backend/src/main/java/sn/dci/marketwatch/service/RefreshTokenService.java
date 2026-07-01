package sn.dci.marketwatch.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.dci.marketwatch.entity.TokenRafraichissement;
import sn.dci.marketwatch.entity.Utilisateur;
import sn.dci.marketwatch.repository.TokenRafraichissementRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${app.jwt.refresh-expiration-days:7}")
    private int refreshExpirationDays;

    private final TokenRafraichissementRepository repository;

    public RefreshTokenService(TokenRafraichissementRepository repository) {
        this.repository = repository;
    }

    /**
     * Crée un nouveau refresh token pour l'utilisateur.
     * Révoque tous les anciens tokens de cet utilisateur (rotation).
     */
    @Transactional
    public TokenRafraichissement create(Utilisateur user) {
        repository.deleteAllByUser(user);  // rotation : 1 token actif max par utilisateur
        TokenRafraichissement token = TokenRafraichissement.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plus(refreshExpirationDays, ChronoUnit.DAYS))
                .valid(true)
                .build();
        return repository.save(token);
    }

    public Optional<TokenRafraichissement> findByToken(String token) {
        return repository.findByToken(token);
    }

    /** Vérifie qu'un token est non révoqué et non expiré */
    public boolean isValid(TokenRafraichissement token) {
        return token.isValid() && token.getExpiryDate().isAfter(Instant.now());
    }

    @Transactional
    public void revoke(TokenRafraichissement token) {
        token.setValid(false);
        repository.save(token);
    }

    @Transactional
    public void revokeAll(Utilisateur user) {
        repository.deleteAllByUser(user);
    }
}
