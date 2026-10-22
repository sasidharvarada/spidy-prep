# Spidy ECE Prep

One site to **learn, practise, simulate, test, plan and track** ECE placement preparation:
VLSI, Digital, Embedded, DSA in C, Aptitude and Core ECE. It merges the Embedded Tracker
(roadmap, checklist, hour log, 12-week plan) with the Spidy Prep lessons, coding problems and labs.

Static site: plain HTML, CSS and ES modules. No build step. Works on GitHub Pages.

## What is inside

| Area | Contents |
|---|---|
| Learn | 7 tracks, 121 modules in roadmap order. Each module has 7 tabs: Learn, Watch, Practice, Simulate, Test, Interview, Revise. 35 full lessons. |
| Practice | 944 original questions: 479 MCQ, 299 numerical, 87 concept (written answers), 35 C, 27 Verilog, 17 circuit problems. Plus 712 checklist tasks from the tracker. Every MCQ and numerical has a solution. Filter by subject, module, type, difficulty, status, role, sub-topic or your own tags. |
| Mock tests | Timed tests by role, track or module, with review and history. |
| Revision | Queue of wrong, difficult and bookmarked questions. Spaced repetition on days 1, 3, 7, 14 and 30. Flashcards. |
| ECE Lab | **Software simulations:** C compiler, Verilog simulator, circuit builder. **Interactive models:** gates, K-map, D flip-flop, FSM stepper, setup/hold, tiny CPU, register bits, PWM, UART, SPI/I2C, RTOS scheduler, RC. |
| Interview | 8 roles: My 12-week plan, VLSI Design, RTL, DV, FPGA, Firmware, Software, Core ECE. Concept questions, quick-fire, coding, projects/HR and a readiness score. |
| Planner | Pick a role, target date, hours and study days. It builds a day-by-day schedule with weekly mocks and revision. Tasks tick themselves off when you finish the work. Includes reschedule, overdue tasks, interview dates and an hours log. |
| Progress | Completion, attempts, accuracy, repeated mistakes, time, mocks, bookmarks and notes. Export/import backups. |

There is also search (press `/`), dark mode and a phone-friendly layout.

## Run it locally

```
python3 -m http.server 8000
# open http://localhost:8000
```
Double-clicking `index.html` does not work, because ES modules need a web server.

## Put it on GitHub Pages

1. Create a repository, for example `spidy-ece-prep`, and upload **everything in this folder**
   (including `.nojekyll`).
2. Settings > Pages > Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. The site appears at `https://sasidharvarada.github.io/spidy-ece-prep/`.

## Turn on cloud sync (Firebase): about 5 minutes

`firebase-config.js` already holds the config of your tracker's Firebase project
(`embedded-tracker-2032a`), so the new site reuses the same project.

1. **Enable Google sign-in:** Firebase console > Authentication > Get started > Sign-in method >
   Google > Enable > Save.
2. **Authorise your domain:** Authentication > Settings > Authorized domains > Add
   `sasidharvarada.github.io`. (`localhost` is there by default.)
3. **Publish the rules:** Firestore Database > Rules > paste in the contents of `firestore.rules` > Publish. The legacy `progress/main` document is read-only from this app; import it after signing in.
4. Open the site, click the cloud icon (top right) and choose **Sign in with Google**.

On first sign-in the site:
- merges the progress already in this browser with your cloud copy;
- imports your Embedded Tracker ticks from `progress/main`: topic ticks, checklist ticks,
  hour logs and the plan start date. The tick ids are identical, so they land on the same items.
  You can run this import again from **Progress > Import Embedded Tracker ticks**.
- imports progress from the first Spidy Prep site automatically, if it was used in this browser.

Without Firebase, everything still works and is saved in the browser. Use **Progress > Export** for backups.

**Security note:** `progress/main` is intentionally read-only to the new app and requires authentication.
Do not restore public write access. If the old unsigned-in tracker still needs to write that document,
finish migrating its data first, then publish these rules.

## Editing content

| File | What it holds |
|---|---|
| `assets/data/tracker-path.js` | Tracker study path, in the same text format as the tracker (`# track`, `## level`, `- topic \| learn \| problems`) |
| `assets/data/tracker-syl.js` | Tracker checklist (SYL) |
| `assets/data/roadmap-new.js` | New modules: SystemVerilog, UVM, synthesis, SDC, low power, PD, DFT, Linux, networks, signals, control, communication, EMT, maths… (`> note`, `= formula` lines) |
| `assets/data/qb/*.js` | Question banks. Numerical answers are computed in code; `q-explain.js` holds extra explanations |
| `assets/data/v1/*.js` | Lessons, C/Verilog/circuit problems and interview questions from the first site |
| `assets/js/registry.js` | Tracks, module order, roles, lesson and simulation mapping, external links |

After editing, run the checks (Node 18+):
```
node tools/check-content.mjs     # ids, answers, solutions
node tools/test-c.mjs            # every C reference solution, cross-checked with gcc
node tools/test-verilog.mjs      # every Verilog reference solution
node tools/test-circuits.mjs && node tools/test-kmap.mjs
```

## Honest limits

- Lessons and questions are original. External videos and sites are only linked (YouTube
  topic links are searches, so they never go stale).
- 35 modules have full lessons. The rest have study notes: topics, what to learn, problems,
  formulas and resources. These are labelled "Study notes, not a full lesson".
- There are no company labels on questions, because there is no reliable data on which
  company asks what. Use **＃ Tag** to record where *you* were asked a question, then filter by it.
- Simulations show ideal logic and models. They do not show real gate delays, noise or analog
  effects. Readiness scores are a study guide, not a prediction.
