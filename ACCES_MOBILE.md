# 📱 Accès MarketWatch sur téléphone

## Configuration pour accéder depuis un téléphone

### 1️⃣ **Démarrage du serveur de développement**

Ouvrez un terminal dans le dossier `frontend` et lancez :

```bash
npm run dev
```

Vite démarre maintenant sur **0.0.0.0:5173** (accessible depuis tout appareil sur le réseau local).

### 2️⃣ **Trouver l'adresse IP de votre ordinateur**

#### **Windows** :
```powershell
ipconfig
```
Cherchez `IPv4 Address` sous "Ethernet adapter" ou "Wireless LAN adapter" (ex: `192.168.x.x`)

#### **Mac/Linux** :
```bash
ifconfig
```
Cherchez l'adresse `inet` de votre interface réseau active

### 3️⃣ **Accéder depuis le téléphone**

Sur le téléphone (même réseau Wi-Fi que l'ordinateur), ouvrez un navigateur et tapez :

```
http://<votre-adresse-ip>:5173
```

**Exemple** : `http://192.168.1.50:5173`

---

## 🔧 **Démarrage du backend (si nécessaire)**

Si vous testez l'API, démarrez aussi le backend :

### **Option 1 : Avec Maven (terminal Java)**
```bash
cd backend
mvn spring-boot:run
```

### **Option 2 : Avec Docker**
```bash
docker compose up -d postgres redis marketwatch-backend
```

Le backend écoute sur `http://localhost:8080`

---

## ⚠️ **Problèmes courants**

### ❌ **"Impossible de se connecter"**
- ✅ Vérifiez que le téléphone est sur le **même Wi-Fi** que l'ordinateur
- ✅ Vérifiez le **pare-feu** (peut bloquer le port 5173)
- ✅ Vérifiez l'**adresse IP** avec `ipconfig`

### ❌ **"Connexion refusée (API)"**
- ✅ Le backend n'est peut-être pas démarré
- ✅ Modifiez `frontend/src/api/axios.js` pour pointer vers l'adresse IP du serveur backend

### ⚡ **Modifier l'API pour téléphone**

Si le backend n'est pas sur `localhost:8080` :

**frontend/src/api/axios.js** :
```javascript
// Détectez l'environnement
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const apiURL = isLocalhost ? 'http://localhost:8080' : `http://${window.location.hostname}:8080`

const api = axios.create({
  baseURL: apiURL
})
```

---

## 🚀 **Build Production**

Pour un déploiement en production sur serveur :

```bash
npm run build
docker compose up -d
```

La plateforme sera accessible via votre domaine/IP serveur.
