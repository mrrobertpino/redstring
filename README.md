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
2. In **Project settings → General → Your apps**, register a **Web app** (the `</>` icon). Do not enable Firebase Hosting; GitHub Pages hosts the site. Copy the `firebaseConfig` object. In GitHub, edit `public/firebase-config.js` using the pencil icon and fill in its `apiKey`, `authDomain`, `projectId`, and `appId`. Commit to `main`. These are public app identifiers, not a teacher password; access is controlled by the database rules.
3. In **Build → Firestore Database**, create a database in **production mode**, choosing a suitable region. In its **Rules** tab, replace the rules with the full contents of this repository's `firestore.rules`, then click **Publish**. Do not use open/test-mode rules.
4. In **Build → Authentication → Sign-in method**, enable **Email/Password**. Under **Users**, add your teacher email and a strong password. Copy that user's **User UID**. Do not put the password in GitHub or chat.
5. In **Firestore Database → Data**, create a collection named `settings` and a document with ID `access`. Add a field `teacherUids` of type **array**, with your teacher **User UID** as its first string entry. This document can only be edited through the Firebase console; visitors cannot make themselves teachers.
6. In **Authentication → Settings → Authorized domains**, add `mrrobertpino.github.io`. Wait for the GitHub Pages workflow to finish after the config commit, then refresh the board.

Students use **Add a thought** with no account. Uploaded images must be PNG, JPEG, or WebP; they are resized and compressed, and very detailed images may need reducing. Students can preview and drag drafts and select connections before sending. Pending content is readable only by teachers. Sign in through **Teacher space**, edit title/context, then approve or reject. Approvals atomically publish a card and remove its pending submission; connected viewers update automatically. Teacher accounts can be added to `teacherUids` through the console.

Test one submission from a student browser, sign in as teacher, approve it, and confirm it appears in the student browser. An unconfigured Firebase project does not provide shared storage, and local draft previews are not submissions. Keep this browser tab open while preparing a draft.

GitHub Pages is public, including approved student names and context. Only use student details suitable for public display. Public submissions should be monitored for spam and quota usage; Firebase App Check is a useful next step for a public classroom launch. Firestore's no-cost plan has usage limits. The Firebase rules enforce teacher access, not an embedded browser password.

## Development

Optional for developers only: Node.js 22+, `npm start`, `npm test`. Production deploys the `public` folder directly; there is no Node server running on GitHub Pages. The workflow runs model and static serving checks. Live Firebase permissions and approval must be verified after your project is configured.
