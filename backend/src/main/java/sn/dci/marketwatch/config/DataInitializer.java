package sn.dci.marketwatch.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.dci.marketwatch.entity.*;
import sn.dci.marketwatch.repository.*;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            UtilisateurRepository userRepo,
            RegionRepository regionRepo,
            ProduitRepository productRepo,
            PrixOfficielRepository priceRepo,
            CommercantRepository merchantRepo,
            PrixDeclareRepository declareRepo,
            SignalementRepository reportRepo,
            MissionRepository missionRepo,
            NotificationRepository notifRepo,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (userRepo.count() > 0) {
                System.out.println("✅ Données déjà initialisées.");
                return;
            }

            System.out.println("🌱 Initialisation des données de démonstration...");

            // ─── Utilisateurs ────────────────────────────────────────────
            Utilisateur admin    = userRepo.save(Utilisateur.builder().name("Admin DCI").email("admin@dci.sn")
                .password(passwordEncoder.encode("admin123")).role(Utilisateur.Role.ADMIN).region("Dakar").build());
            Utilisateur consumer = userRepo.save(Utilisateur.builder().name("Amadou Diallo").email("consumer@test.sn")
                .password(passwordEncoder.encode("consumer123")).role(Utilisateur.Role.CONSUMER).region("Dakar").build());
            Utilisateur agent    = userRepo.save(Utilisateur.builder().name("Agent Ibrahima Sow").email("agent@dci.sn")
                .password(passwordEncoder.encode("agent123")).role(Utilisateur.Role.AGENT).region("Dakar").build());
            Utilisateur merchant = userRepo.save(Utilisateur.builder().name("Fatou Ndiaye Commerce").email("merchant@test.sn")
                .password(passwordEncoder.encode("merchant123")).role(Utilisateur.Role.MERCHANT).region("Thiès").build());

            // ─── Régions ─────────────────────────────────────────────────
            List<Region> regions = regionRepo.saveAll(List.of(
                Region.builder().name("Dakar").build(), Region.builder().name("Thiès").build(),
                Region.builder().name("Saint-Louis").build(), Region.builder().name("Ziguinchor").build(),
                Region.builder().name("Kaolack").build(), Region.builder().name("Touba").build(),
                Region.builder().name("Diourbel").build(), Region.builder().name("Tambacounda").build(),
                Region.builder().name("Kolda").build(), Region.builder().name("Louga").build(),
                Region.builder().name("Fatick").build(), Region.builder().name("Kaffrine").build()
            ));
            Region rDakar  = regions.get(0);
            Region rThies  = regions.get(1);
            Region rStLouis= regions.get(2);

            // ─── Produits ────────────────────────────────────────────────
            Produit riz    = productRepo.save(Produit.builder().name("Riz brisé local").category("Céréales").unit("kg").build());
            Produit rizImp = productRepo.save(Produit.builder().name("Riz importé").category("Céréales").unit("kg").build());
            Produit huile  = productRepo.save(Produit.builder().name("Huile végétale").category("Huiles").unit("litre").build());
            Produit sucre  = productRepo.save(Produit.builder().name("Sucre cristallisé").category("Condiments").unit("kg").build());
            Produit pain   = productRepo.save(Produit.builder().name("Pain baguette").category("Boulangerie").unit("unité").build());
            Produit lait   = productRepo.save(Produit.builder().name("Lait en poudre").category("Laitiers").unit("kg").build());
            Produit tomate = productRepo.save(Produit.builder().name("Tomate concentrée").category("Conserves").unit("boîte 400g").build());
            Produit mil    = productRepo.save(Produit.builder().name("Mil").category("Céréales").unit("kg").build());
            Produit farine = productRepo.save(Produit.builder().name("Farine de blé").category("Farines").unit("kg").build());

            // ─── Prix officiels ───────────────────────────────────────────
            // Sources : arrêté du Conseil National de la Consommation (juin 2024) et
            // relevés ANSD/IHPC janvier 2026 (riz brisé local ~410 FCFA/kg, riz importé
            // ~500 FCFA/kg, huile de palme raffinée 1000 FCFA/L, sucre cristallisé
            // 600 FCFA/kg, pain baguette 150 FCFA, farine de blé ~310 FCFA/kg,
            // mil ~400 FCFA/kg à Dakar).
            LocalDate depuis = LocalDate.of(2024, 6, 21);
            priceRepo.saveAll(List.of(
                price(riz, rDakar, 410, depuis, admin), price(rizImp, rDakar, 500, depuis, admin),
                price(huile, rDakar, 1000, depuis, admin), price(sucre, rDakar, 600, depuis, admin),
                price(pain, rDakar, 150, depuis, admin), price(lait, rDakar, 3500, depuis, admin),
                price(tomate, rDakar, 350, depuis, admin), price(mil, rDakar, 400, depuis, admin),
                price(farine, rDakar, 310, depuis, admin),
                price(riz, rThies, 430, depuis, admin), price(rizImp, rThies, 520, depuis, admin),
                price(huile, rThies, 1050, depuis, admin), price(sucre, rThies, 620, depuis, admin),
                price(pain, rThies, 150, depuis, admin),
                price(riz, rStLouis, 420, depuis, admin), price(rizImp, rStLouis, 540, depuis, admin),
                price(huile, rStLouis, 1100, depuis, admin), price(sucre, rStLouis, 650, depuis, admin)
            ));

            // ─── Commerçants ──────────────────────────────────────────────
            Commercant m1 = merchantRepo.save(Commercant.builder().name("Boutique Al-Amine").address("Parcelles Assainies, Dakar").region(rDakar).lat(14.7547).lng(-17.4677).user(merchant).build());
            Commercant m2 = merchantRepo.save(Commercant.builder().name("Supermarché Dial Diali").address("Plateau, Dakar").region(rDakar).lat(14.6927).lng(-17.4467).build());
            Commercant m3 = merchantRepo.save(Commercant.builder().name("Épicerie Moussa Ba").address("Médina, Dakar").region(rDakar).lat(14.6878).lng(-17.4567).build());
            Commercant m4 = merchantRepo.save(Commercant.builder().name("Commerce Fatou Ndiaye").address("Centre, Thiès").region(rThies).lat(14.7886).lng(-16.9249).user(merchant).build());
            Commercant m5 = merchantRepo.save(Commercant.builder().name("Marché Sor").address("Saint-Louis Nord").region(rStLouis).lat(16.0179).lng(-16.4896).build());

            // ─── Prix déclarés (espace commerçant — boutique Al-Amine, Dakar) ─
            declareRepo.saveAll(List.of(
                PrixDeclare.builder().commercant(m1).product(riz).price(410.0).build(),
                PrixDeclare.builder().commercant(m1).product(huile).price(1450.0).build(),
                PrixDeclare.builder().commercant(m1).product(sucre).price(600.0).build()
            ));

            // ─── Signalements ─────────────────────────────────────────────
            Signalement r1 = reportRepo.save(Signalement.builder().consumer(consumer).product(riz).merchant(m1).region(rDakar)
                .priceObserved(500.0).officialPrice(410.0).priority(Signalement.Priorite.HIGH)
                .description("Riz brisé vendu à 500 FCFA/kg au lieu de 410 (référence DCI)").lat(14.7547).lng(-17.4677).build());
            Signalement r2 = reportRepo.save(Signalement.builder().consumer(consumer).product(huile).merchant(m2).region(rDakar)
                .priceObserved(1450.0).officialPrice(1000.0).priority(Signalement.Priorite.CRITICAL).status(Signalement.Statut.VERIFIED)
                .description("Huile végétale à 1450 FCFA/L, prix officiel 1000").lat(14.6927).lng(-17.4467).build());
            reportRepo.save(Signalement.builder().consumer(consumer).product(sucre).merchant(m3).region(rDakar)
                .priceObserved(750.0).officialPrice(600.0).priority(Signalement.Priorite.HIGH)
                .description("Sucre vendu 750 FCFA/kg (plafond: 600)").lat(14.6878).lng(-17.4567).build());
            reportRepo.save(Signalement.builder().consumer(consumer).product(rizImp).merchant(m1).region(rDakar)
                .priceObserved(540.0).officialPrice(500.0).priority(Signalement.Priorite.NORMAL).status(Signalement.Statut.RESOLVED)
                .description("Riz importé à 540 FCFA vs 500 officiel").lat(14.7100).lng(-17.4600).build());
            reportRepo.save(Signalement.builder().consumer(consumer).product(riz).merchant(m4).region(rThies)
                .priceObserved(440.0).officialPrice(430.0).priority(Signalement.Priorite.LOW)
                .description("Légère hausse du riz brisé à 440 F (officiel 430) à Thiès").lat(14.7886).lng(-16.9249).build());
            reportRepo.save(Signalement.builder().consumer(consumer).product(pain).merchant(m2).region(rDakar)
                .priceObserved(175.0).officialPrice(150.0).priority(Signalement.Priorite.NORMAL)
                .description("Pain baguette à 175 F au lieu de 150 F (officiel)").lat(14.6927).lng(-17.4467).build());
            reportRepo.save(Signalement.builder().consumer(consumer).product(lait).merchant(m3).region(rDakar)
                .priceObserved(4200.0).officialPrice(3500.0).priority(Signalement.Priorite.CRITICAL).status(Signalement.Statut.VERIFIED)
                .description("Lait en poudre hors prix officiel").lat(14.6878).lng(-17.4567).build());

            // ─── Missions ─────────────────────────────────────────────────
            missionRepo.saveAll(List.of(
                Mission.builder().agent(agent).region(rDakar).title("Contrôle Parcelles Assainies")
                    .description("Vérification suite aux signalements critiques").status(Mission.Statut.PLANNED)
                    .scheduledDate(LocalDate.now().plusDays(7)).build(),
                Mission.builder().agent(agent).region(rDakar).title("Inspection Marché Médina")
                    .description("Contrôle routine mensuel").status(Mission.Statut.COMPLETED)
                    .scheduledDate(LocalDate.now().minusDays(3)).build(),
                Mission.builder().agent(agent).region(rThies).title("Mission Contrôle Thiès")
                    .description("Contrôle des épiceries suite aux alertes").status(Mission.Statut.IN_PROGRESS)
                    .scheduledDate(LocalDate.now()).build()
            ));

            // ─── Notifications ────────────────────────────────────────────
            notifRepo.saveAll(List.of(
                Notification.builder().user(consumer).message("Votre signalement sur le riz (Parcelles) a été pris en charge.").type("info").build(),
                Notification.builder().user(consumer).message("Signalement résolu : riz importé Al-Amine. Merci !").type("success").build(),
                Notification.builder().user(agent).message("🚨 Signalement CRITIQUE : Huile végétale Supermarché Dial (+45%)").type("alert").build(),
                Notification.builder().user(agent).message("2 nouveaux signalements haute priorité en zone Dakar.").type("warning").build(),
                Notification.builder().user(admin).message("8 signalements reçus aujourd'hui. 2 critiques à traiter.").type("info").build(),
                Notification.builder().user(admin).message("Rapport mensuel de mai disponible.").type("info").build()
            ));

            System.out.println("✅ Données initialisées avec succès !");
        };
    }

    private PrixOfficiel price(Produit product, Region region, double price, LocalDate from, Utilisateur by) {
        return PrixOfficiel.builder().product(product).region(region).price(price).validFrom(from).setBy(by).build();
    }
}
