# MarketWatch Sénégal 🇸🇳

Plateforme participative de surveillance des prix des denrées de première nécessité au Sénégal.

---

## 🏗️ Architecture

```
marketwatch_v2/
├── backend/        → Spring Boot 3.2.5 + Java 17 + PostgreSQL
├── frontend/       → React 18 + Vite 5 + Tailwind CSS
├── docker-compose.yml
├── start-backend.bat
└── start-frontend.bat
```

---

## ✅ Prérequis

| Outil | Version | Lien |
|-------|---------|------|
| Java JDK | 17+ | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org |
| Node.js | 18+ | https://nodejs.org |
| Docker Desktop | Dernière | https://docs.docker.com/get-docker |

---

## 🚀 Démarrage rapide

### Étape 1 — Base de données

```bash
docker compose up -d postgres
```

Ou double-cliquez sur **`start-backend.bat`** (lance Docker + Spring Boot automatiquement).

### Étape 2 — Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

→ API disponible sur http://localhost:8080

### Étape 3 — Frontend (React)

Dans un autre terminal :

```bash
cd frontend
npm install
npm run dev
```

→ Application disponible sur **http://localhost:5173**

---

## 👥 Comptes de démonstration

Les données sont initialisées automatiquement au premier démarrage.

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur DCI | admin@dci.sn | admin123 |
| Consommateur | consumer@test.sn | consumer123 |
| Agent Brigade | agent@brigade.sn | agent123 |
| Commerçant | merchant@test.sn | merchant123 |

---

## 🔌 API REST principales

| Endpoint | Méthode | Accès | Description |
|----------|---------|-------|-------------|
| `/api/auth/login` | POST | Public | Authentification JWT |
| `/api/auth/register` | POST | Public | Inscription |
| `/api/prices?region=Dakar` | GET | Public | Prix officiels |
| `/api/reports` | POST | Consumer | Soumettre un signalement |
| `/api/reports/alerts` | GET | Agent | Alertes actives |
| `/api/agent/missions` | GET/POST | Agent | Missions terrain |
| `/api/admin/dashboard/stats` | GET | Admin | Statistiques |
| `/api/admin/prices` | POST | Admin | Fixer un prix |

---

## 🔐 Sécurité

- **JWT** stateless (Bearer token, expiry 24h)
- **BCrypt** pour les mots de passe
- **RBAC** : ROLE_ADMIN / ROLE_CONSUMER / ROLE_AGENT / ROLE_MERCHANT
- **CORS** configuré pour localhost:5173 et localhost:3000

---

## 📊 Calcul automatique des priorités

La priorité est calculée côté serveur à la soumission d'un signalement :

| Écart avec prix officiel | Priorité |
|--------------------------|----------|
| ≥ +20% | 🚨 CRITICAL |
| ≥ +10% | ⬆️ HIGH |
| > 0% | 🔵 NORMAL |
| ≤ 0% | ✅ LOW |

Les signalements CRITICAL et HIGH génèrent automatiquement des notifications pour tous les agents et administrateurs.

---

## 🗄️ Base de données

- **Host** : localhost:5432
- **DB** : marketwatch_db
- **User** : marketwatch_user
- **Password** : marketwatch_pass
- **DDL auto** : update (Hibernate crée/met à jour les tables)

---

*Mémoire de Master en Informatique · Bi-Cloud · 2024-2025*
