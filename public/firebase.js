import { firebaseConfig } from './firebase-config.js';
import { validateSubmission } from './model.js';
export const configured = ['apiKey','authDomain','projectId','appId'].every(key=>Boolean(firebaseConfig[key]));
let connection;
async function connect() {
  if (!configured) throw Error('Submissions are not connected yet. Your teacher needs to finish Firebase setup. You can still explore the board and preview a draft.');
  if(!connection) connection=(async()=>{
    const [app,auth,db]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
    ]);
    const instance=app.initializeApp(firebaseConfig);
    const authentication=auth.getAuth(instance);
    await auth.setPersistence(authentication,auth.browserLocalPersistence);
    await authentication.authStateReady();
    return {auth,db,authentication,store:db.getFirestore(instance)};
  })().catch(e=>{connection=null;throw e});
  return connection;
}
export async function subscribeBoard(receive,fail){const {db,store}=await connect();return db.onSnapshot(db.collection(store,'published'),snapshot=>receive(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),fail)}
const itemKeys=['title','name','reason','kind','content','x','y','cluster','links','date','sourceUrl','articleText'];
function itemPayload(item){const payload={};for(const key of itemKeys)payload[key]=item[key]??'';for(const key of ['width','height','rotation'])if(Number.isFinite(item[key]))payload[key]=item[key];return payload}
export async function subscribePrivate(receive,fail,create=false){const {auth,authentication,db,store}=await connect();if(!authentication.currentUser&&create)await auth.signInAnonymously(authentication);if(!authentication.currentUser){receive([]);return ()=>{}}const uid=authentication.currentUser.uid;return db.onSnapshot(db.query(db.collection(store,'submissions'),db.where('submitterUid','==',uid)),snapshot=>receive(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),fail)}
export async function submit(item){validateSubmission(item);const {auth,authentication,db,store}=await connect();if(!authentication.currentUser)await auth.signInAnonymously(authentication);const payload=itemPayload(item);payload.submitterUid=authentication.currentUser.uid;payload.status='pending';payload.createdAt=item.createdAt?.seconds!==undefined?new db.Timestamp(item.createdAt.seconds,item.createdAt.nanoseconds||0):db.serverTimestamp();await db.setDoc(db.doc(store,'submissions',item.id),payload)}
export async function signIn(email,password){const {auth,authentication,db,store}=await connect();await auth.signInWithEmailAndPassword(authentication,email,password);try{const access=await db.getDoc(db.doc(store,'settings','access'));if(!access.exists()||!access.data().teacherUids?.includes(authentication.currentUser.uid))throw Error('This account is not listed as a teacher. Add its User UID in Firebase settings/access.')}catch(e){await auth.signOut(authentication);throw e}}
export async function signOut(){const {auth,authentication}=await connect();await auth.signOut(authentication)}
export async function pending(){const {db,store}=await connect();const snapshot=await db.getDocs(db.collection(store,'submissions'));return snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))}
export async function review(item,action,edits){const {db,store}=await connect();const batch=db.writeBatch(store);if(action==='approve'){const published={...item,...edits};delete published.id;delete published.submitterUid;delete published.status;validateSubmission(published);published.approvedAt=db.serverTimestamp();batch.set(db.doc(store,'published',item.id),published)}else if(action!=='reject')throw Error('Invalid review action');batch.delete(db.doc(store,'submissions',item.id));await batch.commit()}
export async function subscribeLayout(receive,fail){const {db,store}=await connect();return db.onSnapshot(db.doc(store,'layouts','main'),snapshot=>receive(snapshot.exists()?snapshot.data():null),fail)}
export async function loadEditor(){const {db,store}=await connect();const [items,layout]=await Promise.all([db.getDocs(db.collection(store,'published')),db.getDoc(db.doc(store,'layouts','main'))]);return {published:items.docs.map(doc=>({...doc.data(),id:doc.id})),layout:layout.exists()?layout.data():null}}
export async function publishEditor(items,layout){const {validateLayout}=await import('./geometry.js');validateLayout(layout);if(items.length>200)throw Error('Too many images to publish at once.');if(JSON.stringify(items).length>8_000_000)throw Error('This update is too large. Publish fewer new images at a time.');const {db,store}=await connect();const batch=db.writeBatch(store);for(const item of items){validateSubmission(item);const payload=itemPayload(item);payload.createdAt=Number.isFinite(item.createdAt?.seconds)?new db.Timestamp(item.createdAt.seconds,item.createdAt.nanoseconds||0):db.serverTimestamp();payload.approvedAt=db.serverTimestamp();batch.set(db.doc(store,'published',item.id),payload);if(item._submissionId)batch.delete(db.doc(store,'submissions',item._submissionId))}batch.set(db.doc(store,'layouts','main'),{...layout,updatedAt:db.serverTimestamp()});await batch.commit()}

export async function subscribeSideboard(receive,fail){const {db,store}=await connect();return db.onSnapshot(db.doc(store,'settings','sideboard'),s=>receive(s.exists()?s.data():null),fail)}
export async function sideboardPosts(receive,fail){const {db,store}=await connect();return db.onSnapshot(db.query(db.collection(store,'sideboard'),db.orderBy('createdAt','desc'),db.limit(50)),s=>receive(s.docs.map(d=>({...d.data(),id:d.id}))),fail)}
export async function openSideboard(open){const {db,store}=await connect();await db.setDoc(db.doc(store,'settings','sideboard'),{openUntil:db.Timestamp.fromMillis(open?Date.now()+3600000:0)})}
export async function postSideboard(name,text){if(!name.trim()||name.length>80||!text.trim()||text.length>2000)throw Error('Add your name and a thought (up to 2,000 characters).');const {auth,authentication,db,store}=await connect();if(!authentication.currentUser)await auth.signInAnonymously(authentication);await db.addDoc(db.collection(store,'sideboard'),{name,text,submitterUid:authentication.currentUser.uid,createdAt:db.serverTimestamp()})}
export async function removeSideboard(id){const {db,store}=await connect();await db.deleteDoc(db.doc(store,'sideboard',id))}
