package sn.dci.marketwatch.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.*;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("SamaPrix API")
                .description("API REST de la plateforme SamaPrix — Surveillance participative des prix au Sénégal.")
                .version("1.0.0")
            )
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Serveur local"),
                new Server().url("https://sen-prix-api.onrender.com").description("Serveur de production")
            ))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Entrez votre JWT access token obtenu via /api/auth/login")
                )
            );
    }
}
