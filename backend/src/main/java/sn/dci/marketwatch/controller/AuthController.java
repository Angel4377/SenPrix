package sn.dci.marketwatch.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sn.dci.marketwatch.entity.JournalAudit;
import sn.dci.marketwatch.entity.TokenRafraichissement;
import sn.dci.marketwatch.entity.Utilisateur;
import sn.dci.marketwatch.repository.UtilisateurRepository;
import sn.dci.marketwatch.security.*;
import sn.dci.marketwatch.service.AuditService;
import sn.dci.marketwatch.service.RefreshTokenService;

import java.util.Map;

@Tag(name = "Authentification", description = "Connexion, inscription, refresh token et déconnexion")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider,
                          UtilisateurRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          RefreshTokenService refreshTokenService,
                          AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @Operation(summary = "Connexion", description = "Retourne un access token JWT (15 min) et un refresh token (7 jours)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Connexion réussie — token retourné"),
        @ApiResponse(responseCode = "401", description = "Email ou mot de passe incorrect")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
            );
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            Utilisateur user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

            String accessToken   = jwtTokenProvider.generateToken(auth);
            TokenRafraichissement refresh = refreshTokenService.create(user);

            auditService.log(JournalAudit.Action.LOGIN,
                    user.getId(), user.getEmail(), "Connexion reussie", request);

            return ResponseEntity.ok(Map.of(
                "token",        accessToken,
                "refreshToken", refresh.getToken(),
                "type",         "Bearer",
                "id",           userDetails.getId(),
                "name",         userDetails.getName(),
                "email",        userDetails.getUsername(),
                "role",         userDetails.getRole()
            ));
        } catch (BadCredentialsException e) {
            auditService.log(JournalAudit.Action.LOGIN_FAILED,
                    "Tentative echouee pour : " + req.getEmail(), request);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email ou mot de passe incorrect."));
        }
    }

    @Operation(summary = "Inscription", description = "Crée un nouveau compte utilisateur (CONSUMER, AGENT, MERCHANT, ADMIN)")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Compte créé avec succès"),
        @ApiResponse(responseCode = "400", description = "Email déjà utilisé ou données invalides")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req,
                                      HttpServletRequest request) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email deja utilise."));
        }
        Utilisateur user = Utilisateur.builder()
            .name(req.getName())
            .email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .role(Utilisateur.Role.valueOf(req.getRole().toUpperCase()))
            .region(req.getRegion())
            .build();
        userRepository.save(user);

        auditService.log(JournalAudit.Action.REGISTER,
                user.getId(), user.getEmail(),
                "Nouveau compte : " + user.getRole(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("message", "Compte cree avec succes. Vous pouvez vous connecter."));
    }

    @Operation(summary = "Renouveler le token", description = "Rotation : échange le refresh token contre un nouveau couple access/refresh token")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Nouveaux tokens émis"),
        @ApiResponse(responseCode = "401", description = "Refresh token invalide ou expiré")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body,
                                     HttpServletRequest request) {
        String tokenStr = body.get("refreshToken");
        if (tokenStr == null || tokenStr.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "refreshToken manquant."));
        }

        return refreshTokenService.findByToken(tokenStr)
            .filter(refreshTokenService::isValid)
            .map(oldToken -> {
                Utilisateur user = oldToken.getUser();
                refreshTokenService.revoke(oldToken);
                TokenRafraichissement newRefresh = refreshTokenService.create(user);
                String newAccess = jwtTokenProvider.generateTokenFromUser(user);

                auditService.log(JournalAudit.Action.TOKEN_REFRESHED,
                        user.getId(), user.getEmail(), "Rotation du refresh token", request);

                return ResponseEntity.ok(Map.of(
                    "token",        newAccess,
                    "refreshToken", newRefresh.getToken(),
                    "type",         "Bearer"
                ));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Refresh token invalide ou expire. Reconnectez-vous.")));
    }

    @Operation(summary = "Déconnexion", description = "Révoque le refresh token et invalide la session")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) Map<String, String> body,
                                    Authentication auth,
                                    HttpServletRequest request) {
        if (body != null && body.containsKey("refreshToken")) {
            refreshTokenService.findByToken(body.get("refreshToken"))
                    .ifPresent(refreshTokenService::revoke);
        }
        if (auth != null) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            auditService.log(JournalAudit.Action.LOGOUT,
                    userDetails.getId(), userDetails.getUsername(), "Deconnexion", request);
        }
        return ResponseEntity.ok(Map.of("message", "Deconnexion reussie."));
    }

    @Operation(summary = "Profil connecté", description = "Retourne les informations de l'utilisateur actuellement authentifié")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(Map.of(
            "id",    user.getId(),
            "name",  user.getName(),
            "email", user.getUsername(),
            "role",  user.getRole()
        ));
    }

    // --- DTOs avec validation ---

    @Data
    public static class LoginRequest {
        @NotBlank(message = "L'email est obligatoire.")
        @Email(message = "Format d'email invalide.")
        private String email;

        @NotBlank(message = "Le mot de passe est obligatoire.")
        @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caracteres.")
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Le nom est obligatoire.")
        @Size(min = 2, max = 100)
        private String name;

        @NotBlank(message = "L'email est obligatoire.")
        @Email(message = "Format d'email invalide.")
        private String email;

        @NotBlank(message = "Le mot de passe est obligatoire.")
        @Size(min = 6, max = 100, message = "Le mot de passe doit contenir entre 6 et 100 caracteres.")
        private String password;

        @NotBlank(message = "Le role est obligatoire.")
        @Pattern(regexp = "ADMIN|CONSUMER|AGENT|MERCHANT",
                 message = "Role invalide. Valeurs : ADMIN, CONSUMER, AGENT, MERCHANT.")
        private String role;

        private String region;
    }
}
