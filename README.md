# Redstring

An explorable classroom corkboard hosted on GitHub Pages. No software installation is needed on your laptop. Firebase supplies shared submissions, teacher sign-in, and live publication after approval.

## See the board now

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Publish board to GitHub Pages**. If the initial run failed before Pages was enabled, use **Re-run all jobs**, or **Run workflow** on `main`.
4. When deployment finishes, open **https://mrrobertpino.github.io/redstring/**.

The board loads immediately without Firebase. It currently uses text placeholders arranged from the supplied photo. You can pan, zoom, flip cards, explore clusters, follow threads, and preview student drafts. Shared submissions and teacher sign-in remain disabled until the steps below are complete.

## Connect Firebase, entirely in your browser

1. Open https://console.firebase.google.com/ and **Create a project**. Analytics is optional. The implementation uses Firestore and Authentication only; it does not require Firebase Storage or a billing upgrade. Image submissions are compressed in the browser and stored in individual Firestore documents.
2. The supplied `redstring-d8b91` web configuration is already saved in this repository. For a different project, in **Project settings → General → Your apps**, register a **Web app** (the `</>` icon). Do not enable Firebase Hosting; GitHub Pages hosts the site. Copy the `firebaseConfig` object. In GitHub, edit `public/firebase-config.js` using the pencil icon and fill in its `apiKey`, `authDomain`, `projectId`, and `appId`. Commit to `main`. These are public app identifiers, not a teacher password; access is controlled by the database rules.
3. In **Build → Firestore Database**, create a database in **production mode**, choosing a suitable region. In its **Rules** tab, replace the rules with the full contents of this repository's `firestore.rules`, then click **Publish**. Do not use open/test-mode rules.
4. In **Build → Authentication → Sign-in method**, enable **Email/Password**. Under **Users**, add your teacher email and a strong password. Copy that user's **User UID**. Do not put the password in GitHub or chat.
5. In **Firestore Database → Data**, create a collection named `settings` and a document with ID `access`. Add a field `teacherUids` of type **array**, with your teacher **User UID** as its first string entry. This document can only be edited through the Firebase console; visitors cannot make themselves teachers.
6. In **Authentication → Settings → Authorized domains**, add `mrrobertpino.github.io`. Wait for the GitHub Pages workflow to finish after the config commit, then refresh the board.

Students use **Add a thought** with no account. Uploaded images must be PNG, JPEG, or WebP; they are resized and compressed, and very detailed images may need reducing. Students can preview and drag drafts and select connections before sending. Pending content is readable only by teachers. Sign in through **Teacher space**, edit title/context, then approve or reject. Approvals atomically publish a card and remove its pending submission; connected viewers update automatically. Teacher accounts can be added to `teacherUids` through the console.

Test one submission from a student browser, sign in as teacher, approve it, and confirm it appears in the student browser. An unconfigured Firebase project does not provide shared storage, and local draft previews are not submissions. Keep this browser tab open while preparing a draft.

GitHub Pages is public, including approved student names and context. Only use student details suitable for public display. Public submissions should be monitored for spam and quota usage; Firebase App Check is a useful next step for a public classroom launch. Firestore's no-cost plan has usage limits. The Firebase rules enforce teacher access, not an embedded browser password.

## Development

Optional for developers only: Node.js 22+, `npm start`, `npm test`. Production deploys the `public` folder directly; there is no Node server running on GitHub Pages. The workflow runs model and static serving checks. Live Firebase permissions and approval must be verified after your project is configured.


## Visual teacher studio

Open **Teacher space → Open visual board editor**, or visit `editor.html` on the site. It works as a local draft editor even before Firebase is fully configured. Drop PNG/JPEG/WebP files onto the corkboard or choose **Add images**. PNG transparency is preserved. Drag an image to move it, drag its bottom-right handle to resize it, and drag the handle above it to rotate. Holding Shift while rotating snaps to 15-degree increments. You can also type a width or rotation in the inspector. Click **Draw strings**, then drag from the edge of one image to the edge of another; anchors move with image rotation and scaling. Click a string to remove it.

Shift-click images to select several, then choose **Group selected images**. Give the cluster a title and shared context. Each image keeps its own name, date, title, and reason. On the public board, clicking a grouped image opens the cluster; **Flip cluster** shows the combined context. Clicking an image inside the cluster opens its individual flip. Ungrouped images open individually. Use **Ungroup** to make images independent again.

Changes autosave locally when browser storage permits, with undo/redo and downloadable backups. **Publish board** requires a teacher account and writes images plus the arrangement in one atomic Firebase batch. Local drafts are never automatically shown to students. Restore a downloaded backup to move a draft between browsers. A saved local draft takes precedence over the live board until replaced; coordinate edits if several teachers share the board. Images are compressed to fit Firestore, so keep your original files separately. Very large updates should be split into smaller publishes.

**If Firebase was set up before the editor was added:** copy the latest complete `firestore.rules` into **Firebase Console → Firestore Database → Rules** and click **Publish**. The new `layouts/main` rule is required for teacher arrangements and clusters. Also enable Email/Password and add your teacher UID to `settings/access.teacherUids` as described above. Firebase configuration alone does not create the database, teacher account, or security rules. Live teacher publishing has not been verified against your project yet.

## Short welcome and Charlie's audio

The public site now shows a short welcome once per tab/session and opens the board after five seconds. Visitors can enter immediately. Adjust text/duration in `public/welcome.json`. To use Charlie's actual recording, upload it under `public/audio/charlie.mp3` through GitHub, then set `audio` in `welcome.json` to `./audio/charlie.mp3`. No recording is bundled yet. When audio is configured, visitors choose **Listen to Charlie** (browser audio requires a click), then the board opens when the recording ends; **Enter the board** always skips it.

Submissions capture student name, image/link/text, reason, chosen connections and draft placement. Firebase's `createdAt` server timestamp records submission time; the review queue displays it. Only approved submissions appear publicly.
