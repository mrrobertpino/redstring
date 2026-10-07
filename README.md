# Redstring

An interactive classroom corkboard: pan and zoom, open and flip cards, explore clusters, follow connections, place student drafts, and moderate submissions.

## Run

Requires Node.js 22 or later; no dependencies to install.

```sh
ADMIN_PASSWORD='choose-a-strong-password' npm start
```

Open port 3000. Without `ADMIN_PASSWORD`, viewing and submissions work but teacher sign-in is disabled. Students do not need accounts. Teacher sessions expire after an hour and are lost on restart. All approval endpoints enforce teacher authentication on the server.

Data persists in ignored `.data/board.json`. Back up this file before deployment. The seed board represents recognizable items from the supplied photo; original images, dates, contributors, and historical context still need to be provided. Public hosting requires HTTPS, a durable disk, and additional spam/rate-limit protection. This first version runs as one server process and is not yet deployed.

Student drafts are local to the current tab until sent. The shared board changes only after teacher approval. Teachers can edit titles and context before approving. Existing published-card editing, teacher position adjustment, and standalone connections/notes on existing cards are follow-up work.

## Verification

`npm test` runs an integration check against an isolated server and storage directory.
