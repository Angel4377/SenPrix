# 📱 GUIDE RAPIDE - Accéder à MarketWatch depuis un Téléphone

## ⚡ **Démarrage en 3 étapes**

### **Étape 1 : Démarrer le serveur**

Double-cliquez sur **`start-frontend-mobile.bat`** (à la racine du projet)

Vous verrez :
```
✅ Démarrage du serveur Vite...

🖥️  Desktop (localhost)  : http://localhost:5173
📱 Téléphone (local Wi-Fi): http://<votre-adresse-ip>:5173
```

### **Étape 2 : Trouver votre adresse IP**

Ouvrez **PowerShell** et tapez :
```powershell
ipconfig
```

Cherchez la ligne **IPv4 Address** (ex: `192.168.1.50`)

### **Étape 3 : Ouvrir sur le téléphone**

Sur le **même Wi-Fi** que votre ordinateur, ouvrez un navigateur et allez à :

```
http://192.168.1.50:5173
```

*(Remplacez `192.168.1.50` par votre vraie adresse IP)*

---

## 🔧 **Si vous avez besoin du backend aussi**

Ouvrez un **2e terminal** et lancez :

### Option A : Avec Maven
```bash
cd backend
mvn spring-boot:run
```

### Option B : Avec Docker
```bash
docker compose up -d postgres redis marketwatch-backend
```

---

## ✅ **Vérification**

- ✅ Vous voyez MarketWatch sur votre téléphone ?
- ✅ La page est responsive (s'adapte à l'écran) ?
- ✅ Les boutons fonctionnent ?

Si oui, **vous êtes prêt** ! 🎉

---

## ❌ **Dépannage**

**"Impossible de se connecter"**
- Le téléphone et l'ordinateur sont-ils sur le **même Wi-Fi** ? ✅
- Avez-vous copié la bonne **adresse IP** ? ✅
- Le **pare-feu Windows** peut bloquer le port 5173 (autoriser npm si demandé)

**"Page blanche ou erreur API"**
- Assurez-vous que le **backend** est lancé (`mvn spring-boot:run` ou `docker compose up`)
- Vérifiez que l'adresse IP est correcte

---

## 🚀 **Mode Production (Serveur)**

Pour un déploiement en production :

```bash
npm run build
docker compose up -d
```

Alors la plateforme sera accessible via votre **domaine/IP serveur**.
