# ============================================================
# Makefile – MarketWatch Sénégal DevOps
# Usage : make <commande>
# ============================================================

.PHONY: help dev dev-full build test docker-build docker-push \
        k8s-deploy k8s-status k8s-logs k8s-delete \
        monitoring-up monitoring-down clean

# Couleurs
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

help: ## Afficher l'aide
	@echo ""
	@echo "  $(CYAN)MarketWatch Sénégal – Commandes DevOps$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────────
# Développement local
# ─────────────────────────────────────────────
dev: ## Démarrer PostgreSQL + Redis (dev sans Docker backend/frontend)
	docker compose up postgres redis -d
	@echo "$(GREEN)✔ PostgreSQL (5432) et Redis (6379) démarrés$(RESET)"

dev-full: ## Démarrer toute la stack (backend + frontend inclus)
	docker compose up -d
	@echo "$(GREEN)✔ Stack complète démarrée – http://localhost:80$(RESET)"

# ─────────────────────────────────────────────
# Build
# ─────────────────────────────────────────────
build-backend: ## Compiler le backend (Maven)
	cd backend && mvn package -DskipTests -q
	@echo "$(GREEN)✔ JAR compilé dans backend/target/$(RESET)"

build-frontend: ## Compiler le frontend (Vite)
	cd frontend && npm ci && npm run build
	@echo "$(GREEN)✔ Build dans frontend/dist/$(RESET)"

build: build-backend build-frontend ## Compiler backend + frontend

# ─────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────
test-backend: ## Lancer les tests unitaires backend
	cd backend && mvn test

test: test-backend ## Lancer tous les tests

# ─────────────────────────────────────────────
# Docker
# ─────────────────────────────────────────────
docker-build: ## Builder les images Docker localement
	docker build -t marketwatch-backend:local ./backend
	docker build -t marketwatch-frontend:local ./frontend
	@echo "$(GREEN)✔ Images Docker buildées$(RESET)"

docker-push: ## Pousser les images sur Docker Hub (nécessite DOCKERHUB_USERNAME)
	@test -n "$(DOCKERHUB_USERNAME)" || (echo "Définir DOCKERHUB_USERNAME" && exit 1)
	docker tag marketwatch-backend:local $(DOCKERHUB_USERNAME)/marketwatch-backend:latest
	docker tag marketwatch-frontend:local $(DOCKERHUB_USERNAME)/marketwatch-frontend:latest
	docker push $(DOCKERHUB_USERNAME)/marketwatch-backend:latest
	docker push $(DOCKERHUB_USERNAME)/marketwatch-frontend:latest
	@echo "$(GREEN)✔ Images poussées sur Docker Hub$(RESET)"

# ─────────────────────────────────────────────
# Scan de sécurité
# ─────────────────────────────────────────────
scan: ## Scanner les images Docker avec Trivy
	@command -v trivy >/dev/null 2>&1 || (echo "Installer Trivy : https://aquasecurity.github.io/trivy" && exit 1)
	trivy image --severity HIGH,CRITICAL marketwatch-backend:local
	trivy image --severity HIGH,CRITICAL marketwatch-frontend:local

scan-iac: ## Scanner les fichiers IaC (k8s, docker-compose) avec Trivy
	@command -v trivy >/dev/null 2>&1 || (echo "Installer Trivy : https://aquasecurity.github.io/trivy" && exit 1)
	trivy config . --severity HIGH,CRITICAL

# ─────────────────────────────────────────────
# Kubernetes
# ─────────────────────────────────────────────
k8s-deploy: ## Déployer toute la stack sur Kubernetes
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/postgres-secret.yaml
	kubectl apply -f k8s/postgres-pvc.yaml
	kubectl apply -f k8s/postgres-deployment.yaml
	kubectl apply -f k8s/redis-deployment.yaml
	kubectl rollout status deployment/postgres -n marketwatch --timeout=120s
	kubectl rollout status deployment/redis -n marketwatch --timeout=60s
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/frontend-deployment.yaml
	kubectl apply -f k8s/ingress.yaml
	kubectl rollout status deployment/marketwatch-backend -n marketwatch --timeout=180s
	kubectl rollout status deployment/marketwatch-frontend -n marketwatch --timeout=120s
	@echo "$(GREEN)✔ Stack déployée sur Kubernetes$(RESET)"

k8s-monitoring: ## Déployer Prometheus + Grafana sur Kubernetes
	kubectl apply -f k8s/monitoring-prometheus.yaml
	kubectl apply -f k8s/monitoring-grafana.yaml
	kubectl rollout status deployment/prometheus -n marketwatch --timeout=120s
	kubectl rollout status deployment/grafana -n marketwatch --timeout=120s
	@echo "$(GREEN)✔ Monitoring déployé$(RESET)"
	@echo "  Grafana : kubectl port-forward svc/grafana 3000:3000 -n marketwatch"

k8s-status: ## Voir l'état des pods Kubernetes
	@echo "\n=== Pods ==="
	kubectl get pods -n marketwatch
	@echo "\n=== Services ==="
	kubectl get services -n marketwatch
	@echo "\n=== Ingress ==="
	kubectl get ingress -n marketwatch
	@echo "\n=== HPA ==="
	kubectl get hpa -n marketwatch

k8s-logs: ## Voir les logs du backend (dernières 100 lignes)
	kubectl logs -l app=marketwatch-backend -n marketwatch --tail=100 -f

k8s-delete: ## Supprimer tous les objets Kubernetes MarketWatch
	kubectl delete namespace marketwatch
	@echo "$(GREEN)✔ Namespace marketwatch supprimé$(RESET)"

# ─────────────────────────────────────────────
# Monitoring local (Docker Compose)
# ─────────────────────────────────────────────
monitoring-up: ## Démarrer Prometheus + Grafana (mode monitoring)
	docker compose --profile monitoring up -d
	@echo "$(GREEN)✔ Monitoring démarré$(RESET)"
	@echo "  Prometheus : http://localhost:9090"
	@echo "  Grafana    : http://localhost:3000  (admin / marketwatch2024)"

monitoring-down: ## Arrêter le monitoring
	docker compose --profile monitoring stop prometheus grafana postgres-exporter redis-exporter

# ─────────────────────────────────────────────
# Nettoyage
# ─────────────────────────────────────────────
clean: ## Arrêter et supprimer tous les conteneurs + volumes
	docker compose down -v
	@echo "$(GREEN)✔ Conteneurs et volumes supprimés$(RESET)"

clean-build: ## Supprimer les artefacts de build
	cd backend && mvn clean -q
	rm -rf frontend/dist
	@echo "$(GREEN)✔ Artefacts de build nettoyés$(RESET)"
