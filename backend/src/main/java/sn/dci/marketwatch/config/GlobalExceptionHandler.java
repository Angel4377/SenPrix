package sn.dci.marketwatch.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestion centralisee des erreurs de validation (@Valid).
 * Retourne un JSON lisible avec la liste des champs invalides.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 400 — Erreur de validation Bean Validation (@NotBlank, @Email, @Size, ...)
     * Exemple de reponse :
     * {
     *   "status": 400,
     *   "message": "Donnees invalides",
     *   "errors": ["L'email est obligatoire.", "Le mot de passe doit contenir au moins 6 caracteres."]
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> fe.getDefaultMessage())
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("message", "Donnees invalides");
        body.put("errors", errors);

        return ResponseEntity.badRequest().body(body);
    }

    /** 500 — Erreur inattendue */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("message", "Une erreur interne est survenue.");
        return ResponseEntity.internalServerError().body(body);
    }
}
