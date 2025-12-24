# Tontine API

API REST pour gérer des tontines avec authentification JWT.

## 🚀 Stack Technique

- **Backend**: Node.js + Express
- **Base de données**: PostgreSQL + Sequelize ORM
- **Authentification**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Sécurité**: Helmet, CORS, Rate Limiting
- **Tests**: Jest + Supertest

## 📋 Prérequis

- Node.js (v18+)
- PostgreSQL (v14+)
- npm ou yarn

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone git@github.com:rup1n13-san/tontine-api.git
cd tontine-api
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Installer PostgreSQL

Suivez le guide: [docs/POSTGRESQL_INSTALL.md](docs/POSTGRESQL_INSTALL.md)

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Modifiez le fichier `.env` avec vos paramètres:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tontine_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 5. Créer la base de données

```bash
sudo -u postgres psql
CREATE DATABASE tontine_db;
\q
```

## 🏃 Démarrage

### Mode développement

```bash
npm run dev
```

### Mode production

```bash
npm start
```

### Tests

```bash
npm test
```

## 📡 Endpoints API

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Tontines
- `POST /api/tontines` - Créer une tontine
- `GET /api/tontines` - Lister les tontines
- `GET /api/tontines/:id` - Détails d'une tontine
- `POST /api/tontines/:id/join` - Rejoindre une tontine
- `POST /api/tontines/:id/pay` - Effectuer un paiement

### Health Check
- `GET /health` - Vérifier l'état de l'API

## 📁 Structure du Projet

```
tontine-api/
├── src/
│   ├── config/          # Configuration (DB, etc.)
│   ├── controllers/     # Logique métier
│   ├── middlewares/     # Middlewares Express
│   ├── models/          # Modèles Sequelize
│   ├── routes/          # Routes API
│   ├── services/        # Services métier
│   ├── utils/           # Utilitaires
│   ├── validators/      # Validation Joi
│   └── index.js         # Point d'entrée
├── test/                # Tests Jest
├── docs/                # Documentation
└── package.json
```

## 🧪 Tests avec Postman

Une collection Postman est disponible dans `docs/postman_collection.json`

## 📝 License

ISC
