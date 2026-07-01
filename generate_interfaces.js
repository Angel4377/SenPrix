const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

// Colors
const BLUE_DARK = "1F3864";
const BLUE_MID = "2E5FA3";
const BLUE_LIGHT = "D5E8F0";
const BLUE_HEADER = "2E75B6";
const GREEN = "375623";
const ORANGE = "C55A11";
const GREY_BG = "F2F2F2";
const WHITE = "FFFFFF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BLUE_DARK })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: BLUE_MID })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: BLUE_HEADER })]
  });
}

function h4(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: ORANGE })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    alignment: opts.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}

function sectionDivider(color = BLUE_MID) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    children: []
  });
}

function actorTitle(title, icon, color) {
  return new Paragraph({
    spacing: { before: 300, after: 160 },
    shading: { fill: color, type: ShadingType.CLEAR },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: BLUE_DARK, space: 4 }
    },
    children: [
      new TextRun({ text: `  ${icon}  ${title}`, bold: true, size: 28, font: "Arial", color: BLUE_DARK })
    ]
  });
}

// Table helper: features table for each interface
function featuresTable(headers, rows, colWidths) {
  const makeCell = (text, isHeader = false, shade = null) =>
    new TableCell({
      borders,
      width: { size: colWidths[0], type: WidthType.DXA },
      shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text, bold: isHeader, size: isHeader ? 20 : 20, font: "Arial", color: isHeader ? WHITE : "333333" })]
      })]
    });

  const makeRow = (cells, isHeader = false, shades = []) =>
    new TableRow({
      tableHeader: isHeader,
      children: cells.map((c, i) => {
        const cell = new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: (isHeader ? { fill: BLUE_DARK, type: ShadingType.CLEAR } : shades[i] ? { fill: shades[i], type: ShadingType.CLEAR } : undefined),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: c, bold: isHeader, size: 20, font: "Arial", color: isHeader ? WHITE : "222222" })]
          })]
        });
        return cell;
      })
    });

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      makeRow(headers, true),
      ...rows.map((r, i) => makeRow(r, false, i % 2 === 0 ? colWidths.map(() => GREY_BG) : []))
    ]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ========== DOCUMENT CONTENT ==========

const children = [];

// Cover / Title
children.push(
  new Paragraph({ spacing: { before: 1440, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MarketWatch Sénégal", bold: true, size: 48, font: "Arial", color: BLUE_DARK })] }),
  new Paragraph({ spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Plateforme Participative de Régulation des Prix", size: 28, font: "Arial", color: BLUE_MID })] }),
  sectionDivider(BLUE_DARK),
  new Paragraph({ spacing: { before: 200, after: 1440 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Interfaces Web et Mobile par Acteur", bold: true, size: 36, font: "Arial", color: BLUE_HEADER })] }),
);

// ========== INTRO ==========
children.push(
  h1("Introduction"),
  para(
    "La plateforme MarketWatch Sénégal repose sur une architecture multi-acteurs où chaque profil dispose d'interfaces adaptées à ses responsabilités et à ses conditions d'usage. L'écosystème numérique distingue deux grandes familles d'interfaces : l'interface web, destinée aux acteurs institutionnels disposant d'équipements fixes (postes de travail, ordinateurs portables), et l'application mobile (iOS et Android), conçue pour les utilisateurs en mobilité. Cette dualité web/mobile garantit une couverture fonctionnelle complète tout en tenant compte des contraintes de connectivité propres au contexte sénégalais.",
    { justify: true }
  ),
  para(
    "Quatre acteurs principaux structurent la plateforme : l'Administration (Direction du Commerce Intérieur), les Commerçants (grossistes et détaillants), les Consommateurs et associations, et les Services de Contrôle (brigades économiques). Chacun dispose d'un espace fonctionnel distinct, sécurisé par un système d'authentification à rôles, tout en s'inscrivant dans un écosystème partagé de données en temps réel.",
    { justify: true }
  ),
  sectionDivider(),
  pageBreak(),
);

// ========== ACTEUR 1 : ADMINISTRATION ==========
children.push(
  h1("Acteur 1 — Administration (Direction du Commerce Intérieure)"),
  para(
    "L'Administration représente le pilier décisionnel de la plateforme. Elle fixe la mercuriale officielle, valide les alertes critiques et supervise l'ensemble de l'écosystème de surveillance. Ses besoins en matière d'interface privilegient la puissance analytique, la visualisation agrégée et le pilotage stratégique, ce qui oriente naturellement vers une interface web riche.",
    { justify: true }
  ),
);

children.push(h2("Interface Web — Tableau de Bord Administratif"));
children.push(
  para("L'interface web de l'Administration constitue le centre névralgique de la plateforme. Elle est accessible via un navigateur standard depuis le siège de la DCI ou les directions régionales, sous authentification sécurisée (identifiants + double authentification)."),
);

children.push(h3("Module 1.A — Gestion de la Mercuriale"));
children.push(
  para("Ce module permet la saisie, la validation et la diffusion des prix officiels. L'administrateur accède à un formulaire structuré par produit, région et période. Un workflow de validation multi-niveaux (agent de saisie → chef de service → directeur) garantit la fiabilité des données avant publication."),
  bullet("Formulaire de saisie des prix par produit et région"),
  bullet("Workflow de validation multi-niveaux avec notifications internes"),
  bullet("Publication instantanée avec diffusion push, SMS et email"),
  bullet("Historique complet des évolutions tarifaires avec horodatage"),
  bullet("Import en masse depuis fichiers Excel/CSV"),
  bullet("Comparaison automatique avec la mercuriale précédente (delta de prix)"),
);

children.push(h3("Module 1.B — Tableau de Bord de Supervision en Temps Réel"));
children.push(
  para("Le tableau de bord centralise l'ensemble des indicateurs de performance du marché. Il se compose de trois zones principales : une carte de chaleur géolocalisée, un bandeau d'indicateurs clés, et un panneau d'alertes actives."),
  bullet("Carte de chaleur des anomalies par région et par produit"),
  bullet("Indicateurs clés : volume de signalements, taux de résolution, écarts moyens"),
  bullet("Alertes automatiques lors du dépassement de seuils configurables"),
  bullet("Filtres avancés par produit, région, période, et seuil d'écart"),
  bullet("Graphiques d'évolution temporelle des prix et des signalements"),
  bullet("Vue comparée régions / produits / périodes"),
);

children.push(h3("Module 1.C — Rapports Analytiques et Intelligence des Données"));
children.push(
  bullet("Rapports périodiques personnalisables (hebdomadaire, mensuel, trimestriel)"),
  bullet("Moteur d'analyse prédictive des tendances tarifaires"),
  bullet("Détection automatique des anomalies statistiques et zones à risque"),
  bullet("Export des données aux formats CSV, PDF et Excel"),
  bullet("Tableau de bord exécutif pour la Direction avec KPIs synthétiques"),
);

children.push(new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }));

// Table recap acteur 1
children.push(
  featuresTable(
    ["Fonctionnalité", "Interface", "Priorité"],
    [
      ["Gestion de la mercuriale (saisie, validation, publication)", "Web", "Critique"],
      ["Tableau de bord temps réel (carte de chaleur, alertes)", "Web", "Critique"],
      ["Import en masse (Excel/CSV)", "Web", "Haute"],
      ["Rapports analytiques et export", "Web", "Haute"],
      ["Analyse prédictive des tendances", "Web", "Moyenne"],
      ["Historique tarifaire avec horodatage", "Web", "Haute"],
    ],
    [5400, 2000, 1626]
  ),
  new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
  para("Tableau 3 : Récapitulatif des fonctionnalités web de l'Administration", { color: "666666", size: 20 }),
);

children.push(sectionDivider(), pageBreak());

// ========== ACTEUR 2 : COMMERÇANTS ==========
children.push(
  h1("Acteur 2 — Commerçants (Grossistes et Détaillants)"),
  para(
    "Les commerçants sont les acteurs centraux de l'offre. Ils sont légalement tenus d'afficher et de respecter les prix plafonds fixés par l'Administration. Confrontés à une méconnaissance fréquente des tarifs actualisés (difficulté D5), ils ont besoin d'outils légers et accessibles, aussi bien sur leur ordinateur en magasin que sur leur téléphone portable lors de leurs approvisionnements.",
    { justify: true }
  ),
);

children.push(h2("Interface Web — Espace Commerçant"));
children.push(
  para("L'espace web du commerçant est simplifié par rapport à celui de l'Administration. Il est optimisé pour une consultation rapide et une mise à jour des prix pratiqués, sans nécessiter de formation approfondie."),
  bullet("Consultation instantanée de la mercuriale en vigueur par produit et région"),
  bullet("Publication des prix pratiqués sur le point de vente"),
  bullet("Outil de vérification de conformité : le commerçant saisit son prix et reçoit un indicateur vert/orange/rouge"),
  bullet("Historique de ses propres publications et signalements reçus"),
  bullet("Notifications en cas de mise à jour de la mercuriale (produits suivis)"),
  bullet("Accès au profil du point de vente (coordonnées, catégorie, zone)"),
);

children.push(h2("Application Mobile — Commerçant Connect"));
children.push(
  para("L'application mobile est l'outil principal des commerçants en mobilité, notamment lors des achats chez les grossistes ou dans les marchés d'approvisionnement. Elle offre les mêmes fonctionnalités essentielles que l'interface web, dans un format adapté aux smartphones d'entrée de gamme."),
  bullet("Consultation des prix officiels hors-ligne (mise en cache automatique)"),
  bullet("Vérification rapide de conformité : scan du produit ou recherche par nom"),
  bullet("Publication de prix depuis le point de vente avec géolocalisation"),
  bullet("Alertes push à chaque mise à jour de la mercuriale"),
  bullet("Mode hors-ligne avec synchronisation différée (adapté aux zones à faible connectivité)"),
  bullet("Interface disponible en français et en wolof pour une adoption maximale"),
);

children.push(new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }));

children.push(
  featuresTable(
    ["Fonctionnalité", "Web", "Mobile"],
    [
      ["Consultation de la mercuriale officielle", "Oui", "Oui (hors-ligne)"],
      ["Publication des prix pratiqués", "Oui", "Oui + géolocalisation"],
      ["Vérification de conformité (vert/orange/rouge)", "Oui", "Oui + scan code-barres"],
      ["Notifications mise à jour mercuriale", "Oui", "Oui (push)"],
      ["Historique des publications", "Oui", "Consultation"],
      ["Mode hors-ligne", "Non", "Oui"],
    ],
    [4600, 2213, 2213]
  ),
  new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
  para("Tableau 4 : Fonctionnalités web vs mobile pour les Commerçants", { color: "666666", size: 20 }),
);

children.push(sectionDivider(), pageBreak());

// ========== ACTEUR 3 : CONSOMMATEURS ==========
children.push(
  h1("Acteur 3 — Consommateurs et Associations de Consommateurs"),
  para(
    "Les consommateurs constituent le moteur participatif de la plateforme. Ce sont eux qui transforment MarketWatch Sénégal d'un simple portail d'information en un véritable outil de régulation citoyenne. Leur interface doit être ultra-accessible, intuitive et motivante, en tenant compte de la diversité des profils (niveaux d'alphabétisation variés, smartphones d'entrée de gamme, connectivité intermittente).",
    { justify: true }
  ),
);

children.push(h2("Interface Web — Portail Citoyen"));
children.push(
  para("Le portail web citoyen est conçu pour les associations de consommateurs et les utilisateurs disposant d'un accès à un ordinateur (cybercafés, entreprises, institutions). Il offre une expérience plus riche que l'application mobile, avec des fonctionnalités avancées de comparaison et de suivi."),
  bullet("Consultation des prix officiels par produit, région et point de vente"),
  bullet("Carte interactive des points de vente avec prix pratiqués et notations"),
  bullet("Comparateur de prix entre commerces d'une même zone géographique"),
  bullet("Formulaire de signalement enrichi : produit, prix constaté, adresse, photo"),
  bullet("Suivi en temps réel du statut des signalements déposés"),
  bullet("Tableau de bord de la participation citoyenne (signalements, badges, classements)"),
  bullet("Accès aux rapports publics sur l'évolution des prix par région"),
);

children.push(h2("Application Mobile — MarketWatch Citoyen"));
children.push(
  para("L'application mobile est le canal privilégié d'engagement des consommateurs. Elle a été conçue selon les principes du design inclusif, avec une interface épurée à 3 fonctions principales : Consulter, Comparer, Signaler."),
);

children.push(h3("Consultation des Prix"));
children.push(
  bullet("Recherche de produits par nom, catégorie ou scan de code-barres"),
  bullet("Affichage du prix officiel vs prix le plus bas dans la zone"),
  bullet("Localisation automatique des points de vente proches"),
  bullet("Mode hors-ligne avec données mises en cache"),
);

children.push(h3("Comparaison des Offres"));
children.push(
  bullet("Carte interactive des points de vente géolocalisés"),
  bullet("Comparateur de prix entre 2 à 5 commerces sélectionnés"),
  bullet("Indicateur d'écart par rapport au prix officiel (en % et en FCFA)"),
  bullet("Filtres par distance, catégorie de produit, et seuil d'écart"),
);

children.push(h3("Signalement des Anomalies"));
children.push(
  para("Le système de signalement en 3 étapes est le cœur participatif de l'application. Il a été simplifié au maximum pour encourager la participation citoyenne et réduire le taux d'abandon."),
  bullet("Étape 1 — Sélection du produit (liste déroulante ou scan)"),
  bullet("Étape 2 — Saisie du prix constaté et du nom du commerce"),
  bullet("Étape 3 — Géolocalisation automatique + photo optionnelle"),
  bullet("Validation communautaire : confirmation par d'autres utilisateurs proches"),
  bullet("Accusé de réception immédiat + suivi du statut de traitement"),
);

children.push(h3("Gamification et Engagement Citoyen"));
children.push(
  bullet("Points de contribution attribués à chaque signalement validé"),
  bullet("Badges citoyens : Vigile de quartier, Sentinelle du marché, Champion de la transparence"),
  bullet("Classement mensuel des contributeurs les plus actifs par région"),
  bullet("Notifications de récompenses et d'avancement de niveau"),
);

children.push(new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }));

children.push(
  featuresTable(
    ["Fonctionnalité", "Web", "Mobile"],
    [
      ["Consultation des prix officiels", "Oui", "Oui (hors-ligne)"],
      ["Carte des points de vente", "Oui (enrichie)", "Oui (géolocalisée)"],
      ["Comparateur de prix", "Oui", "Oui (simplifié)"],
      ["Signalement d'anomalie", "Oui (formulaire complet)", "Oui (3 étapes guidées)"],
      ["Suivi des signalements", "Oui", "Oui (push)"],
      ["Validation communautaire", "Non", "Oui"],
      ["Gamification (badges, points)", "Tableau de bord", "Oui (temps réel)"],
      ["Mode hors-ligne", "Non", "Oui"],
    ],
    [4600, 2213, 2213]
  ),
  new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
  para("Tableau 5 : Fonctionnalités web vs mobile pour les Consommateurs", { color: "666666", size: 20 }),
);

children.push(sectionDivider(), pageBreak());

// ========== ACTEUR 4 : BRIGADES ==========
children.push(
  h1("Acteur 4 — Services de Contrôle (Brigades Économiques)"),
  para(
    "Les brigades économiques sont les agents de terrain de la régulation. Leur mission est d'effectuer les contrôles physiques chez les commerçants, de constater les infractions et d'alimenter la plateforme avec les résultats de leurs interventions. Leur interface doit répondre à deux contextes d'usage : le bureau pour la planification stratégique, et le terrain pour la collecte en temps réel.",
    { justify: true }
  ),
);

children.push(h2("Interface Web — Poste de Commandement des Brigades"));
children.push(
  para("L'interface web des brigades est dédiée à la planification des missions, à l'analyse des signalements et au suivi des infractions. Elle est complémentaire à l'interface web de l'Administration, avec un accès restreint aux données relevant de leur périmètre d'intervention."),
  bullet("Tableau de bord des signalements prioritaires : carte de chaleur filtrée par zone d'intervention"),
  bullet("Planificateur de missions : création, affectation et suivi des contrôles planifiés"),
  bullet("Module de gestion des infractions : dossiers, preuves, sanctions, suivi jusqu'à clôture"),
  bullet("Reporting : génération automatique des rapports d'activité au format PDF"),
  bullet("Statistiques de performance : nombre de contrôles, taux d'infractions, délai moyen de traitement"),
  bullet("Coordination inter-brigades : partage d'alertes entre régions"),
);

children.push(h2("Application Mobile — Brigade Terrain"));
children.push(
  para("L'application mobile des brigades est l'outil de travail des agents sur le terrain. Elle fonctionne en mode offline pour garantir la continuité des opérations dans les zones à faible couverture réseau, avec synchronisation automatique dès le retour en zone connectée."),
);

children.push(h3("Réception et Priorisation des Alertes"));
children.push(
  bullet("Notifications push des signalements à traiter, triés par niveau de priorité"),
  bullet("Carte des signalements actifs dans la zone d'intervention de l'agent"),
  bullet("Score de priorité calculé automatiquement : gravité × fréquence × distance"),
  bullet("Historique des interventions précédentes sur un même point de vente"),
);

children.push(h3("Conduite du Contrôle Terrain"));
children.push(
  bullet("Fiche de contrôle numérique : identification du commerce, produits contrôlés, prix constatés"),
  bullet("Capture photo des étiquettes de prix et des documents présentés par le commerçant"),
  bullet("Géolocalisation automatique de l'intervention"),
  bullet("Formulaire de constat d'infraction pré-structuré (numéro d'infraction, articles de loi, montant de l'amende)"),
  bullet("Signature électronique du commerçant sur l'écran tactile"),
  bullet("Génération immédiate du procès-verbal au format PDF"),
);

children.push(h3("Synchronisation et Reporting"));
children.push(
  bullet("Synchronisation automatique des rapports terrain dès le retour en zone réseau"),
  bullet("Transmission en temps réel au tableau de bord de l'Administration"),
  bullet("Suivi de la résolution des infractions (paiement amende, régularisation des prix)"),
  bullet("Mode hors-ligne complet : toutes les fonctions disponibles sans connexion"),
);

children.push(new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }));

children.push(
  featuresTable(
    ["Fonctionnalité", "Web", "Mobile Terrain"],
    [
      ["Tableau de bord des signalements prioritaires", "Oui (global)", "Oui (zone agent)"],
      ["Planification des missions de contrôle", "Oui (complet)", "Consultation"],
      ["Fiche de contrôle numérique", "Non", "Oui"],
      ["Capture photo sur le terrain", "Non", "Oui"],
      ["Génération du procès-verbal PDF", "Oui (post-intervention)", "Oui (immédiat)"],
      ["Géolocalisation des interventions", "Non", "Oui (automatique)"],
      ["Suivi des infractions et sanctions", "Oui (complet)", "Oui (résumé)"],
      ["Mode hors-ligne", "Non", "Oui (complet)"],
      ["Reporting de performance", "Oui", "Consultation"],
    ],
    [4600, 2213, 2213]
  ),
  new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
  para("Tableau 6 : Fonctionnalités web vs mobile pour les Services de Contrôle", { color: "666666", size: 20 }),
);

children.push(sectionDivider(), pageBreak());

// ========== SYNTHESE ==========
children.push(
  h1("Synthèse : Matrice des Interfaces par Acteur"),
  para(
    "Le tableau ci-dessous offre une vue consolidée de la répartition des interfaces pour chacun des quatre acteurs de la plateforme MarketWatch Sénégal. Cette matrice met en évidence la complémentarité des canaux web et mobile, et justifie le choix d'une architecture multi-canal adaptée aux réalités d'usage de chaque profil.",
    { justify: true }
  ),
  new Paragraph({ spacing: { before: 160, after: 100 }, children: [] }),
);

children.push(
  featuresTable(
    ["Acteur", "Interface Web", "Application Mobile", "Mode Hors-ligne"],
    [
      ["Administration (DCI)", "Tableau de bord analytique, gestion mercuriale, rapports", "Non requis", "Non"],
      ["Commerçants", "Consultation conformité, publication prix, historique", "Vérification, publication, alertes push", "Oui (consultation)"],
      ["Consommateurs", "Portail citoyen, comparateur avancé, suivi signalements", "Consulter, Comparer, Signaler, Gamification", "Oui (cache données)"],
      ["Services de Contrôle", "Planification missions, gestion infractions, reporting", "Fiche terrain, PV numérique, alertes, géolocalisation", "Oui (complet)"],
    ],
    [2200, 2900, 2526, 1400]
  ),
  new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
  para("Tableau 7 : Matrice de synthèse des interfaces web et mobile par acteur", { color: "666666", size: 20 }),
);

children.push(
  new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),
  h2("Justification des choix technologiques"),
  para(
    "Le choix d'une architecture duale web/mobile s'inscrit dans une logique d'accessibilité maximale et de séparation des contextes d'usage. L'interface web, riche et puissante, répond aux besoins de supervision et d'analyse des acteurs institutionnels (Administration, brigades au bureau) dotés d'un accès fixe à Internet. L'application mobile, légère et résiliente, est conçue pour les acteurs en mobilité (consommateurs, commerçants en déplacement, agents terrain) dans un contexte où la connectivité peut être intermittente.",
    { justify: true }
  ),
  para(
    "Le mode hors-ligne, disponible pour les consommateurs, les commerçants et les brigades, est une exigence non-fonctionnelle critique au regard des réalités de couverture réseau au Sénégal, notamment dans les zones périurbaines et rurales. La synchronisation différée garantit l'intégrité des données collectées, quelle que soit la qualité de la connexion.",
    { justify: true }
  ),
  sectionDivider(BLUE_DARK),
);

// Footer note
children.push(
  new Paragraph({ spacing: { before: 300, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MarketWatch Sénégal — Mémoire de Master — ISI, DITI 5 — Année académique 2025/2026", size: 18, font: "Arial", color: "888888", italics: true })]
  }),
  new Paragraph({ spacing: { before: 40, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Étudiant : FAYE Nguénar  |  Encadreur : WADE Moussa", size: 18, font: "Arial", color: "888888", italics: true })]
  }),
);

// ========== DOCUMENT ==========
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_MID },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLUE_HEADER },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } },
            children: [new TextRun({ text: "MarketWatch Sénégal — Interfaces Web et Mobile", size: 18, font: "Arial", color: "666666", italics: true })]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } },
            children: [
              new TextRun({ text: "Page ", size: 18, font: "Arial", color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "888888" }),
              new TextRun({ text: " / ", size: 18, font: "Arial", color: "888888" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Arial", color: "888888" }),
            ]
          })
        ]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/sessions/blissful-focused-newton/mnt/outputs/interfaces_web_mobile_MarketWatch.docx', buffer);
  console.log('Document créé avec succès.');
});
