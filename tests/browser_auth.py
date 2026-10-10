from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page()
 page.route('**/firebase-config.js',lambda r:r.fulfill(content_type='text/javascript',body="export const firebaseConfig={apiKey:'test',authDomain:'test',projectId:'test',appId:'test'};"))
 page.route('**/firebase-app.js',lambda r:r.fulfill(content_type='text/javascript',body='export const initializeApp=()=>({});'))
 page.route('**/firebase-auth.js',lambda r:r.fulfill(content_type='text/javascript',body="""const auth={currentUser:null,authStateReady:async()=>{}};export const getAuth=()=>auth;export const browserLocalPersistence={};export const setPersistence=async()=>{};export const signOut=async()=>{auth.currentUser=null};export async function signInWithEmailAndPassword(){if(window.scenario==='password'){const e=Error('raw SDK error');e.code='auth/invalid-credential';throw e}auth.currentUser={uid:'teacher',isAnonymous:false}}"""))
 page.route('**/firebase-firestore.js',lambda r:r.fulfill(content_type='text/javascript',body="""export const getFirestore=()=>({});export const collection=()=>({});export const query=()=>({});export const limit=()=>({});export async function getDocsFromServer(){if(['denied','wrong'].includes(window.scenario)){const e=Error('raw SDK error');e.code='permission-denied';throw e}return {docs:[]}}"""))
 page.goto(os.environ.get('BOARD_TEST_URL','http://localhost:3207/redstring/')+'style.css')
 for scenario,expected in [('password','Email or password was not accepted'),('denied','Firestore denied teacher access'),('wrong','Firestore denied teacher access'),('success','ok')]:
  actual=page.evaluate("""async scenario=>{window.scenario=scenario;const f=await import('./firebase.js');try{await f.signIn('teacher@example.com','test-only');return 'ok'}catch(e){return e.message}}""",scenario)
  assert expected in actual,(scenario,actual)
 print('Teacher sign-in distinguishes invalid credentials, denied permissions, unauthorized accounts and successful access.')
 browser.close()
