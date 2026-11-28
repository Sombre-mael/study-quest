# Study Quest

Study Quest est un planner de révisions qui se joue. Sous le capot, c'est un
planning calme : une page bleu-vert profond, une rangée de colonnes par jour et
des cartes de session blanches. Par-dessus vient une couche jeu — chaque
session vaut de l'XP, cocher une carte fait monter de niveau, les quêtes du jour
rapportent des bonus, les badges marquent les étapes et chaque contrôle est un
boss dont la barre de vie est faite de minutes de révision.

Tout est enregistré dans le navigateur (localStorage, clé `study-planner:v2`) :
pas de compte, pas de base de données, pas de synchronisation. Le style est
pixel art — Pixelify Sans pour le texte, Press Start 2P pour les titres, angles
droits, cadres d'encre de 2 px, ombres dures décalées, grille de pixels et
scanlines discrètes en fond.

## Ce que fait l'application

- **Planifier un contrôle.** « Start your quest » demande une matière, une
  date, un temps de révision total et une durée de session, puis répartit les
  sessions sur les jours qui précèdent (`src/lib/plan.ts`).
- **Le tableau de la semaine.** Les jours défilent horizontalement sur grand
  écran ; les cartes peuvent être ajoutées, modifiées, dupliquées, cochées,
  supprimées (avec annulation) et glissées d'un jour à l'autre. Les cartes
  rattachées à un contrôle renvoient vers celui-ci.
- **Minuteur de concentration.** Le bouton lecture d'une carte, ou « Start
  focus » dans son menu, ouvre un minuteur Pomodoro plein écran (blocs de
  concentration entrecoupés de pauses). À la fin du dernier bloc, la carte est
  cochée et le temps est enregistré ; quitter plus tôt conserve les minutes
  déjà faites.
- **Limite quotidienne.** Un jour au-delà de la limite (2 h par défaut) reçoit
  un anneau d'alerte, une pastille « de trop » et un bouton **Rééquilibrer** qui
  déplace les dernières sessions vers les jours les plus proches ayant de la
  place, sans jamais dépasser la date d'un contrôle. Réglable dans More → Daily
  limit & timer.
- **Préparation à l'examen.** Chaque carte de contrôle et la page de progrès
  comparent le travail sur la matière dans les trois semaines précédant le
  contrôle à l'objectif fixé ; un remplissage clair montre ce qui reste
  planifié.
- **Journal de quêtes** (`/quests`, le bandeau de niveau dans l'en-tête) :
  niveau, rang, XP jusqu'au niveau suivant, les quatre quêtes du jour, les
  badges, les boss et le mini-jeu d'échauffement. L'XP vient du même journal
  d'étude que le planner, rien n'est stocké deux fois : un XP par minute
  étudiée plus 15 par session cochée, plus les quêtes du jour et les bonus du
  warm-up. Les niveaux suivent une courbe fixe et la série multiplie la valeur
  du jour (×1,25 dès 3 jours, ×1,5 dès 7, ×2 dès 14) — tout est dans
  `src/lib/game.ts`.
- **Mini-jeu d'échauffement.** Un memory de 30 secondes avec tes matières, qui
  rapporte jusqu'à 50 XP bonus, pour trois parties payées par jour
  (`WARM_UP_DAILY_LIMIT`) ; ensuite le plateau reste jouable mais ne rapporte
  plus rien jusqu'au lendemain.
- **Progrès** (`/stats`) : temps étudié par matière, série, sessions terminées,
  prochain contrôle et les 14 derniers jours face à la limite quotidienne.
- **Matières** (`/subjects`) : ajouter, renommer, changer la couleur et l'icône.
- **Vues semaine et mois** (`/week`, `/month`) : la semaine affiche du lundi au
  dimanche avec glisser-déposer, le mois donne tous les jours d'un coup d'œil et
  ouvre un jour sur le tableau.
- **Imprimer une semaine** (`/print?d=YYYY-MM-DD`) : une feuille blanche d'une
  page, dimensionnée pour être capturée proprement et imprimée en paysage.
- **Accueil des nouveaux.** Un planner vide (More → Start fresh) affiche un
  panneau de bienvenue à la place du tableau. Passer `seedForNewUsers` à
  `false` dans `src/data.ts` pour que les nouveaux visiteurs arrivent dessus
  plutôt que sur le plan d'exemple.
- **Guide de style** (`/styleguide`, lié depuis le menu More et les pieds de
  page) : tous les tokens et composants, rendus en direct.

## Sur téléphone

En dessous de 768 px, l'application a sa propre mise en page, pas un tableau
rétréci :

- une barre d'onglets fixe en bas (Planning, Quêtes, Progrès, Matières) avec la
  marge de sécurité de l'écran, et un en-tête allégé qui ne garde que le logo,
  le niveau et le menu More ;
- le planner passe **à un jour à la fois** : un bandeau de dates à faire
  défiler, avec un point par session et un drapeau pour les contrôles, puis les
  cartes du jour en pleine largeur, son total et ses actions Add session /
  Rééquilibrer (`src/app/MobileBoard.tsx`) ;
- la semaine empile ses sept jours en blocs compacts, le mois garde ses sept
  colonnes avec des points à la place des noms de cartes ;
- les dialogues deviennent des feuilles qui montent du bas, avec un pied de
  dialogue au-dessus de la barre gestuelle du téléphone.

## Lancer le projet

Nécessite Node 20+ et pnpm. Aucune étape avec Bun.

```sh
pnpm install       # installe à partir de pnpm-lock.yaml
pnpm run dev       # Vite + le Worker dans workerd, sur http://localhost:5182
pnpm run build     # dist/client (assets) + dist/study_planner/index.js (Worker)
pnpm run typecheck # tsc --noEmit
```

`pnpm-workspace.yaml` autorise les scripts de build de `esbuild` et `workerd` ;
pnpm 11 refuse une installation qui les laisserait non approuvés.

## Héberger sur GitHub Pages

Le site est statique, il se publie donc tel quel : `.github/workflows/pages.yml`
construit le projet et dépose `dist/client` sur Pages à chaque push sur `main`.
Il suffit de choisir **GitHub Actions** comme source dans Settings → Pages.

L'application est servie sous `https://sombre-mael.github.io/study-quest/` : le
workflow construit avec `SITE_BASE=/study-quest/`, et `src/lib/router.tsx`
ajoute puis retire ce préfixe autour de routes qui restent écrites `/quests`,
`/week`… `scripts/postbuild.mjs` copie enfin `index.html` en `404.html` pour
qu'un lien profond ou un rechargement ouvre l'application au lieu du 404 de
GitHub.

## Héberger sur Vercel

`vercel.json` décrit tout : `pnpm run build`, sortie `dist/client`, et un
rewrite vers `index.html` pour les routes côté client. Sans `SITE_BASE`, le
`base` reste `/`, donc l'import du dépôt dans Vercel fonctionne sans réglage.
Pense à autoriser pnpm 11 (le `packageManager` de `package.json` s'en charge)
et à Node 22 ou plus.

## Comment c'est construit

React 19 avec Vite 8, Tailwind CSS v4 (tokens `@theme` dans `src/styles.css`),
Motion pour les animations, et un petit Worker Cloudflare qui sert l'application.

- `src/app/` — les écrans : `Board` (grand écran), `MobileBoard` (téléphone),
  `MobileTabBar`, `DayColumn`, `SessionCard`, `WeekView`, `MonthView`, `Hero`,
  `FocusTimer`, `QuestsPage`, `MemoryGame`, `GameHud`, `StatsPage`,
  `SubjectsPage`, `PrintWeek`, `Onboarding`, `StyleGuide`, et les boîtes de
  dialogue (`PlanDialog`, `ItemDialog`, `SubjectDialog`, `SettingsDialog`).
- `src/components/` — le design system : `Button`, `IconButton`, `Panel`,
  `Dialog`, `Menu`, `Field` / `Segmented` / sélecteurs, `Pill`, `SubjectChip`,
  `ReadinessMeter`, `ProgressRing`, `Charts`, `StatTile`, `Toast`, `Logo`.
  Tous visibles sur `/styleguide`.
- `src/lib/store.ts` — le reducer et la persistance localStorage (un
  enregistrement `v1` est migré). Remplacer son load/save par des appels API
  pour garder les plans en base.
- `src/lib/game.ts` — XP, niveaux, rangs, bonus de série, quêtes du jour,
  badges, boss et plafond/récompense du warm-up. `src/lib/insights.ts` contient
  la charge d'un jour, le rééquilibrage, la préparation, la série et le temps
  par matière ; `src/lib/focus.ts` découpe une session en blocs Pomodoro ;
  `src/lib/plan.ts` répartit les sessions.
- `src/lib/router.tsx` — un routeur minimal basé sur l'History API (`useRoute`,
  `navigate`, `Link`) ; le Worker sert `index.html` pour toutes les routes.
- `src/data.ts` — tous les textes, les matières par défaut, couleurs et icônes,
  les options de limite quotidienne et de minuteur, le plan d'exemple et
  l'historique d'étude d'exemple.
- `src/worker/index.ts` — `GET /api/health`, un 404 JSON pour les autres chemins
  `/api`, et l'application pour tout le reste.

Les animations respectent le réglage système « réduire les animations ».

