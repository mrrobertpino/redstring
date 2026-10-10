# Redstring

An explorable classroom corkboard hosted on GitHub Pages. No software installation is needed on your laptop. Firebase supplies shared submissions, teacher sign-in, and live publication after approval.

## See the board now

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Publish board to GitHub Pages**. If the initial run failed before Pages was enabled, use **Re-run all jobs**, or **Run workflow** on `main`.
4. When deployment finishes, open **https://mrrobertpino.github.io/redstring/**.

The board loads immediately without Firebase. It currently uses text placeholders arranged from the supplied photo. You can pan, zoom, examine cards, explore clusters, follow threads, and preview student drafts. Shared submissions and teacher sign-in remain disabled until the steps below are complete.

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

Shift-click images to select several, then choose **Group selected images**. Give the cluster a title and shared context. Each image keeps its own name, date, title, and reason. On the public board, clicking a grouped image opens the cluster; click the faint title to examine its combined information card. Clicking an image inside the cluster opens its individual information card. Ungrouped images open individually. Use **Ungroup** to make images independent again.

Changes autosave locally when browser storage permits, with undo/redo and downloadable backups. **Publish board** requires a teacher account and writes images plus the arrangement in one atomic Firebase batch. Local drafts are never automatically shown to students. Restore a downloaded backup to move a draft between browsers. A saved local draft takes precedence over the live board until replaced; coordinate edits if several teachers share the board. Images are compressed to fit Firestore, so keep your original files separately. Very large updates should be split into smaller publishes.

**If Firebase was set up before the editor was added:** copy the latest complete `firestore.rules` into **Firebase Console → Firestore Database → Rules** and click **Publish**. The new `layouts/main` rule is required for teacher arrangements and clusters. Also enable Email/Password and add your teacher UID to `settings/access.teacherUids` as described above. Firebase configuration alone does not create the database, teacher account, or security rules. Live teacher publishing has not been verified against your project yet.

## Short welcome and Charlie's audio

The public site now shows a short welcome once per tab/session and opens the board after five seconds. Visitors can enter immediately. Adjust text/duration in `public/welcome.json`. To use Charlie's actual recording, upload it under `public/audio/charlie.mp3` through GitHub, then set `audio` in `welcome.json` to `./audio/charlie.mp3`. No recording is bundled yet. When audio is configured, visitors choose **Listen to Charlie** (browser audio requires a click), then the board opens when the recording ends; **Enter the board** always skips it.

Submissions capture student name, image/link/text, reason, chosen connections and draft placement. Firebase's `createdAt` server timestamp records submission time; the review queue displays it. Only approved submissions appear publicly.


## Physical-board appearance

The viewer and studio now share a wide 2:1 framed cork surface. Cork, image shadows, edge pins, and red thread all move with the camera. The built-in cork is an approximation; the supplied photographs are visual references, not embedded as a photographic backdrop. The seed images remain placeholders. The photo-inspired seed positions and varied sizes leave the same kind of open space as the physical board.

For saved older drafts, use **Match photo spacing** in the studio to apply the new seed-image positions/sizes. This is undoable and keeps image content, other uploads and existing strings. **Replace image** swaps a selected placeholder for its actual PNG while preserving identity, position, rotation and string anchors. **Preview board** opens the current local draft in a separate tab, clearly marked as private, without publishing. Existing local drafts are preserved rather than automatically rearranged.

The built-in background needs no upload or Firebase change. Under **Board background**, you can optionally upload a clean photograph of cork (without pictures or strings), or return to the built-in surface. A custom background is saved with the layout when you publish; copy the updated complete `firestore.rules` to Firebase before publishing one, since the layout rules now allow the optional `surface` field. The surface image is fitted across the board, while the built-in cork texture repeats. Original image cutouts and precise teacher arrangement are still needed for a close 1:1 reproduction.


## Black pins and chronological red strings

In the teacher studio, the bottom-right dock has a **pin box** immediately left of the **red string spool**. Click the pin box, then click anywhere on an image to add a pin. Click the spool, click one black pin, then click a different black pin to connect them. Escape or the move-arrow button returns to arranging images. The previous edge-drag string gesture also works. Alt-click a pin to remove it and attached strings; undo restores the operation.

New strings record an ISO creation time and a monotonically increasing `order`. Rendering sorts by that order, so a newly created string paints over all older strings at crossings. Pins store normalized positions within each image and stay attached as it moves, rotates, or scales. Existing strings are migrated with their previous paint order and unknown (`null`) creation time; no historical date is invented. This prepares chronology for a later 3D view but does not implement a 3D model or archive yet. Creation times are recorded in the editing browser; the shared layout's publication time remains Firebase's server timestamp.

Open **Tool button sizes & images** in the inspector to resize each dock button independently (44–160 pixels), or upload the actual spool/pin-box icon PNGs. The bundled defaults are drawn SVG illustrations. Icon appearance and extra pins save in the local draft, backup and published layout. Public visitors can see the pins and strings; authoring tools remain in the teacher studio.

Before publishing the new pin/tool fields, replace the Firestore Rules tab contents with the latest complete `firestore.rules` and click **Publish**. Existing teacher-only write permissions remain in place. Live Firebase publishing cannot be verified from this environment; browser interaction checks and seven Node tests pass.


## Private student webs and Sideboard
Enable **Authentication → Sign-in method → Anonymous** as well as Email/Password, then publish the complete current `firestore.rules`. Students need no account form: Firebase assigns their browser an identity. Pending submissions are readable only by that identity and teachers; published items are readable by everyone. Returning in the same browser restores pending ideas. Clearing browser data or switching browsers loses access to that anonymous identity. Local unsent drafts are browser-local, so use a separate browser profile on shared computers.

Use **Picture**, **Text**, or **Link → Place on board** to add private ideas, automatically sent for approval. Connections are optional. Pending items have a label and can be dragged again; submitted placement changes save to Firebase. Teachers can approve the proposed position or choose **Arrange in studio**, edit it, and publish. Replace the image with a scanned cutout afterward to preserve identity and connections.

**Explore tools → The Sideboard** is a separate public discussion area. It is closed by default. In Teacher space, open it for up to one hour or close it immediately. Posts become public immediately and teachers can remove them. It accepts plain text only; do not open it for an unrestricted audience unless you are ready to moderate. The database checks the closing time even if a browser's clock is incorrect. The main board always requires teacher approval.

Exploration now frames items or clusters before opening an image beside its metadata card. Source links and manually supplied article text are supported; articles are not fetched automatically. Splay is a temporary radial fan: the central group stays anchored, other groups spread outward, the corkboard drops away, and the camera keeps the original board center centered while fitting the entire spread. The timeline filters recorded additions of current pieces and strings, and does not reconstruct deleted items or previous arrangements. Copyright links to robertpino.com appear on the board and teacher studio.

Quick entry uses a name and content, with optional title and picture/link description. Placing an item sends it privately for review when Firebase is available; otherwise it stays local, with **Retry sending** in that item’s information card. Tap your item and choose **Connect with red string**, then tap another item. Connections are optional. Picture URLs require the source website to permit cross-origin downloads; file upload is the fallback.

On desktop, **Place on board** returns to the board: tap a position, choose **Place at top left**, or wait eight seconds for the default placement. Default items form a row from the top left. On screens up to 650px wide, placement is automatic and the item is sent privately immediately. Students need only content and their name; titles/descriptions and connections are optional.

Teacher access now uses the owner's Firebase UID directly in `teacher()` in `firestore.rules`: `iUeZkMpKJnQz1Sc1GyxU5zNgSrb2`. Publish the complete current rules in project redstring-d8b91. The old settings/access document is no longer needed for access. Sign-in verifies permission with a server read of the review queue before opening the studio; only the rules grant teacher access.
