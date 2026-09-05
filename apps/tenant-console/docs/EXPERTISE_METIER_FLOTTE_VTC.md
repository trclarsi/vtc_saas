# Fonctionnalités attendues d'une console de gestion de flotte VTC

Point de vue métier (gestion de flotte / VTC), indépendant de l'implémentation actuelle.
Objectif : lister ce qu'un Admin Tenant / Manager opérationnel / Fleet Manager attend
réellement d'un outil de ce type, pour évaluer les écarts avec `tenant-console` et prioriser
la suite. Ce document est une **référence métier**, pas un engagement d'implémentation — voir
[`DESIGN_ROADMAP.md`](./DESIGN_ROADMAP.md) pour ce qui est réellement construit.

## 1. Où se situe `tenant-console` aujourd'hui

Construit : Chauffeurs (CRUD + validation), Véhicules (CRUD + statut), Réservations (liste +
annulation), Utilisateurs (invitation), Tableau de bord (compteurs), Paramètres tenant, Profil.

Absent : dispatch temps réel / carte, facturation, conformité documentaire, maintenance,
analytics/rapports, notifications. C'est normal à ce stade (frontend seul, pas de backend) —
la section 2 sert à situer ces manques dans une vision d'ensemble, pas à les traiter comme des
bugs.

## 2. Modules attendus dans ce métier

### 2.1 Gestion de flotte (véhicules)
- Fiche véhicule enrichie : documents (carte grise, assurance, visite technique) avec **dates
  d'expiration et alertes avant échéance** — c'est le manque le plus critique en Afrique de
  l'Ouest où le contrôle technique et l'assurance sont des points de blocage réglementaire.
- Suivi kilométrage / consommation carburant, historique d'affectation aux chauffeurs.
- Planning de maintenance préventive (vidange, pneus) avec seuils (km ou date).
- Historique d'incidents/accidents par véhicule.

### 2.2 Gestion des chauffeurs
- Documents obligatoires avec expiration : permis de conduire, carte professionnelle VTC,
  casier judiciaire — même logique d'alerte que les véhicules.
- Notation / évaluation (moyenne des courses, taux d'acceptation, taux d'annulation côté
  chauffeur).
- Historique de courses et gains par chauffeur.
- Statut de présence en temps réel (en ligne / en course / hors ligne) — déjà modélisé
  (`availabilityStatus`) mais pas encore visualisé sur une carte.

### 2.3 Dispatch et réservations
- **Vue carte temps réel** : position des véhicules disponibles, chauffeurs en course — c'est
  l'écran le plus attendu dans ce métier, celui que Bolt/Yango/Uber affichent en premier à un
  opérateur.
- Calendrier/planning des réservations (vue jour/semaine), pas seulement une liste triable.
- Affectation manuelle chauffeur/véhicule à une réservation (actuellement `driverId`/`vehicleId`
  existent dans le modèle mais aucun écran ne permet de les définir).
- Réservations récurrentes (trajet domicile-travail quotidien, fréquent en B2B VTC).
- Gestion des no-show / retards.

### 2.4 Facturation et paiements
- Calcul de tarif par course (déjà anticipé par `pricingModel`/`pricingConfig` dans `Tenant`,
  mais aucun écran ne l'exploite encore).
- Factures clients (surtout en B2B — comptes entreprise avec facturation mensuelle groupée).
- Suivi des commissions/reversements chauffeurs, historique de paiement.
- Rapprochement mobile money (Wave, Orange Money) — incontournable dans le contexte Dakar,
  plus utilisé que la carte bancaire pour ce type de service.

### 2.5 Rapports et analytics
- Export de rapports (CSV/PDF) : revenus, utilisation flotte, performance chauffeurs.
- Tendances dans le temps (le manque déjà identifié en Partie 2 du roadmap — écarté faute de
  endpoint d'historique, mais c'est un vrai besoin métier à terme).
- Heatmap de la demande (zones/heures de forte activité) — utile pour repositionner la flotte.

### 2.6 Notifications et communication
- Centre de notifications in-app (document véhicule bientôt expiré, chauffeur en attente de
  validation depuis N jours, réservation non affectée proche de son créneau).
- Notifications sortantes (SMS/email) aux chauffeurs et passagers — hors périmètre frontend
  seul, mais l'écran de configuration (modèles de message, préférences) est un vrai écran
  admin à prévoir.

### 2.7 Support et incidents
- Registre de réclamations/litiges (passager mécontent, dispute de tarif).
- Fiche incident liée à une réservation/véhicule/chauffeur.

## 3. KPI et indicateurs de tableau de bord

Organisés par question à laquelle un dispatcher/manager doit pouvoir répondre en un coup d'œil.

### Opérationnel (aujourd'hui, temps réel)
- Véhicules disponibles / en course / indisponibles (ratio, pas juste un total)
- Chauffeurs en ligne / en course / hors ligne
- Réservations en cours, réservations dans l'heure sans chauffeur affecté (alerte)
- Taux de complétion du jour (terminées / total prévu)

### Utilisation de la flotte (tendance)
- Taux d'utilisation véhicule (heures en course / heures disponibles)
- Kilométrage moyen par véhicule / par période
- Temps d'immobilisation (maintenance + indisponibilité)

### Demande et qualité de service
- Réservations par jour/semaine (tendance)
- Taux d'annulation (par le passager vs par l'opérateur, ce sont deux signaux différents)
- Taux de no-show
- Délai moyen d'affectation chauffeur (temps entre création et affectation)
- Heures de pointe (distribution horaire)

### Chauffeurs
- Note moyenne, taux d'acceptation, taux d'annulation par chauffeur
- Chauffeurs en attente de validation depuis plus de N jours (déjà présent en partie —
  alerte actuelle du tableau de bord va dans ce sens)
- Top / bottom performers (à manier avec précaution — utile en interne, jamais public)

### Financier
- Revenu du jour / de la semaine / du mois
- Revenu moyen par course, par véhicule, par chauffeur
- Commissions dues aux chauffeurs (en attente de versement)
- Répartition par mode de paiement (mobile money vs espèces vs entreprise)

### Conformité (le plus souvent oublié, le plus coûteux si ignoré)
- Nombre de véhicules avec document expiré ou expirant sous 30 jours
- Nombre de chauffeurs avec document expiré ou expirant sous 30 jours
- Incidents ouverts non résolus

## 4. Sites et apps de référence

| Référence | Ce qu'il y a à en tirer |
|---|---|
| **Yango** (opérateur / back-office) | Le plus pertinent pour Dakar : c'est un concurrent direct actif sur ce marché précis, à étudier en priorité pour comprendre les attentes locales (paiement mobile money, tarification zone). |
| **Bolt Fleet / Bolt Business** | Dispatch et gestion de flotte pensés pour l'Afrique/Europe de l'Est, marché comparable à Dakar en maturité. Bonne référence pour la carte temps réel et la fiche chauffeur. |
| **Uber Fleet / Uber for Business** | Référence sur la clarté du dashboard analytics et la gestion de comptes entreprise (facturation groupée) — pertinent pour le futur module 2.4. |
| **Careem** (Moyen-Orient) | Marché émergent comparable, bonne référence sur l'onboarding chauffeur et la conformité documentaire (permis, assurance) très encadrée localement. |
| **Samsara** | Référence déjà utilisée dans ce projet — excellente pour la maintenance préventive et le suivi véhicule (documents, kilométrage, alertes d'échéance). |
| **Fleetio** | Le plus proche du module "gestion de flotte" pur (2.1) — densité d'information, planning de maintenance, historique par véhicule. |
| **Onfleet** | Référence sur le dispatch et le suivi de tournée en temps réel, UI de carte très lisible. |
| **Route4Me** | Optimisation de tournées — pertinent si un jour le produit gère des courses groupées/livraisons. |
| **Stripe Dashboard** | Déjà utilisé dans ce projet pour les patterns de données/filtres — reste la meilleure référence pour un futur module facturation (2.4), clarté des montants et des statuts de paiement. |
| **Linear** | Déjà la référence d'interaction de `tenant-console` (panneaux latéraux, transitions) — à garder pour tout nouvel écran plutôt que d'introduire un nouveau style. |

## 5. Priorisation suggérée (à discuter, pas décidée)

Du point de vue métier pur (sans contrainte technique) :

1. **Affectation chauffeur/véhicule à une réservation** — le modèle de données le permet déjà
   (`driverId`/`vehicleId` sur `Reservation`), aucun écran ne l'exploite. C'est le trou le plus
   visible entre le modèle et l'usage réel.
2. **Alertes de conformité documentaire** (véhicules + chauffeurs) — risque réglementaire
   concret, pas un confort.
3. **Vue carte temps réel** — c'est l'écran le plus identifiant du métier, mais suppose une
   source de géolocalisation (backend + app chauffeur) qui n'existe pas encore.
4. **Facturation** — dépend du choix du mode de paiement (mobile money en priorité pour Dakar),
   donc dépend d'une décision produit avant tout travail frontend.

Cette priorisation n'engage rien : elle sert de base de discussion pour la suite du roadmap
frontend, une fois le Groupe D (confort) repris ou en parallèle si le besoin métier prime.
