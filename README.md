# FinanceOS — Gestionnaire Financier Personnel

Application web de gestion financière personnelle, développée en HTML5 / CSS3 / JavaScript natif, sans dépendances externes ni framework.

---

## 🚀 Fonctionnalités implémentées

### 1. Gestion des transactions
- **Ajout** d'une transaction via formulaire (description, montant, type, catégorie, date)
- **Validation en temps réel** : champs obligatoires, montant > 0, catégorie selon le type sélectionné
- **Modification** de n'importe quelle transaction existante
- **Suppression** avec confirmation modale
- **Catégories dynamiques** : les catégories disponibles changent selon que la transaction est un revenu ou une dépense

### 2. Calcul du solde et suivi
- **Solde en temps réel** affiché en permanence dans la barre supérieure
- **Alerte visuelle** si le solde passe en négatif (bande d'alerte rouge)
- **Filtrage** des transactions par type, catégorie, et mois
- **Mise à jour instantanée** à chaque opération (ajout / modification / suppression)

### 3. Analyse et statistiques
- Total revenus, total dépenses, solde global
- **Moyenne des dépenses** par mois, par semaine, par jour
- Nombre de transactions et de mois couverts
- Top des catégories de dépenses avec barres de progression visuelles
- **Tableau comparatif** par période (revenus, dépenses, solde, nb transactions)

### 4. Visualisation graphique (SVG natif)
- **Diagramme donut** (répartition des dépenses par catégorie) avec légende interactive
- **Histogramme d'évolution du solde** sur les 6 derniers mois
- **Graphique groupé** Revenus vs Dépenses en vue Analytique (bascule mensuel / hebdomadaire)
- Tous les graphiques sont générés en SVG pur, sans librairie externe

### 5. Sauvegarde locale
- **Persistance via localStorage** : les données sont automatiquement sauvegardées et rechargées
- **Données de démonstration** chargées automatiquement lors de la première ouverture
- **Export CSV** avec encodage UTF-8 (BOM inclus pour compatibilité Excel)

---

## 📁 Structure des fichiers

```
financeapp/
├── index.html      → Structure HTML sémantique complète, toutes les vues
├── style.css       → Design dark premium, variables CSS, responsive (desktop/tablette/mobile)
├── app.js          → Logique applicative complète (state, calculs, rendu, événements)
└── README.md       → Documentation (ce fichier)
```

---

## ▶️ Instructions pour exécuter l'application

**Méthode 1 — Ouverture directe (recommandée pour test rapide)**
1. Décompressez l'archive `.zip`
2. Double-cliquez sur `index.html`
3. L'application s'ouvre dans votre navigateur

> ⚠️ Note : certains navigateurs (Chrome, Edge) peuvent bloquer localStorage en mode `file://`. Si les données ne persistent pas, utilisez la méthode 2.

**Méthode 2 — Serveur local (recommandée pour utilisation normale)**

Avec Python (installé sur macOS / Linux par défaut) :
```bash
cd financeapp/
python3 -m http.server 8080
```
Puis ouvrir : `http://localhost:8080`

Avec Node.js / npx :
```bash
npx serve financeapp/
```

**Navigateurs supportés** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 🗂️ Catégories disponibles

| Revenus           | Dépenses       |
|-------------------|----------------|
| Salaire           | Logement       |
| Freelance         | Alimentation   |
| Investissements   | Transport      |
| Remboursement     | Santé          |
| Autre revenu      | Loisirs        |
|                   | Vêtements      |
|                   | Éducation      |
|                   | Abonnements    |
|                   | Épargne        |
|                   | Autre dépense  |

---

## ⚙️ Format du CSV exporté

Séparateur `;` (compatible Excel français), encodage UTF-8 avec BOM.

```
ID;Date;Description;Type;Catégorie;Montant (FCFA)
abc123;2025-10-01;Salaire;Revenu;Salaire;350000
def456;2025-10-03;Loyer;Dépense;Logement;75000
```

---

## ⚠️ Limitations connues

- **Pas de multi-utilisateurs** : les données sont liées au navigateur et au domaine local
- **Pas de synchronisation cloud** : les données restent sur la machine de l'utilisateur
- **localStorage limité** : environ 5 Mo selon le navigateur (largement suffisant pour un usage personnel — des milliers de transactions)
- **Pas de graphiques animés** sur Safari mobile (les transitions SVG sont ignorées)
- **Devise fixe** en euros (€) — pas de conversion multi-devises

---

## 🔮 Améliorations possibles

- Ajout de **budgets mensuels** par catégorie avec alertes de dépassement
- **Récurrence automatique** de transactions (ex : loyer mensuel)
- **Objectifs d'épargne** avec suivi de progression
- Export / import **JSON** pour sauvegarde complète
- **Mode clair** (light mode) basculable
- **Recherche textuelle** dans les transactions
- Support **multi-comptes** (courant, épargne, etc.)

---

## 🛠️ Choix techniques

| Élément            | Choix                                      |
|--------------------|---------------------------------------------|
| Framework JS       | Aucun — Vanilla JS ES2020                  |
| Graphiques         | SVG natif (pas de Chart.js ni D3)           |
| Persistence        | localStorage (Web Storage API)              |
| Polices            | Google Fonts (Syne + Fira Code)             |
| Compatibilité      | CSS variables, Grid, Flexbox                |
| Validation         | JS natif, temps réel                        |

---

*Développé dans le cadre du projet Gestionnaire Financier Personnel.*
