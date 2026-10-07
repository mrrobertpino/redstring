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
    await auth.setPersistence(authentication,auth.browserSessionPersistence);
    await authentication.authStateReady();
    return {auth,db,authentication,store:db.getFirestore(instance)};
  })().catch(e=>{connection=null;throw e});
  return connection;
}
export async function subscribeBoard(receive,fail){const {db,store}=await connect();return db.onSnapshot(db.collection(store,'published'),snapshot=>receive(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),fail)}
export async function submit(item){validateSubmission(item);const {db,store}=await connect();const payload={};for(const key of ['title','name','reason','kind','content','x','y','cluster','links','date'])payload[key]=item[key];payload.createdAt=db.serverTimestamp();await db.addDoc(db.collection(store,'submissions'),payload)}
export async function signIn(email,password){const {auth,authentication,db,store}=await connect();await auth.signInWithEmailAndPassword(authentication,email,password);try{const access=await db.getDoc(db.doc(store,'settings','access'));if(!access.exists()||!access.data().teacherUids?.includes(authentication.currentUser.uid))throw Error('This account is not listed as a teacher. Add its User UID in Firebase settings/access.')}catch(e){await auth.signOut(authentication);throw e}}
export async function signOut(){const {auth,authentication}=await connect();await auth.signOut(authentication)}
export async function pending(){const {db,store}=await connect();const snapshot=await db.getDocs(db.collection(store,'submissions'));return snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))}
export async function review(item,action,edits){const {db,store}=await connect();const batch=db.writeBatch(store);if(action==='approve'){const published={...item,...edits};delete published.id;validateSubmission(published);published.approvedAt=db.serverTimestamp();batch.set(db.doc(store,'published',item.id),published)}else if(action!=='reject')throw Error('Invalid review action');batch.delete(db.doc(store,'submissions',item.id));await batch.commit()}
export async function subscribeLayout(receive,fail){const {db,store}=await connect();return db.onSnapshot(db.doc(store,'layouts','main'),snapshot=>receive(snapshot.exists()?snapshot.data():null),fail)}
export async function loadEditor(){const {db,store}=await connect();const [items,layout]=await Promise.all([db.getDocs(db.collection(store,'published')),db.getDoc(db.doc(store,'layouts','main'))]);return {published:items.docs.map(doc=>({...doc.data(),id:doc.id})),layout:layout.exists()?layout.data():null}}
export async function publishEditor(items,layout){const {validateLayout}=await import('./geometry.js');validateLayout(layout);if(items.length>200)throw Error('Too many images to publish at once.');if(JSON.stringify(items).length>8_000_000)throw Error('This update is too large. Publish fewer new images at a time.');const {db,store}=await connect();const batch=db.writeBatch(store);for(const item of items){validateSubmission(item);const payload={};for(const key of ['title','name','reason','kind','content','x','y','cluster','links','date'])payload[key]=item[key];payload.createdAt=Number.isFinite(item.createdAt?.seconds)?new db.Timestamp(item.createdAt.seconds,item.createdAt.nanoseconds||0):db.serverTimestamp();payload.approvedAt=db.serverTimestamp();batch.set(db.doc(store,'published',item.id),payload)}batch.set(db.doc(store,'layouts','main'),{...layout,updatedAt:db.serverTimestamp()});await batch.commit()}
