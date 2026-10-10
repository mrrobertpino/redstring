from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1400,'height':900})
 ctx.route('**/firebase-config.js',lambda r:r.fulfill(content_type='text/javascript',body='export const firebaseConfig={};'))
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 url=os.environ.get('BOARD_TEST_URL','http://localhost:3207/redstring/')
 page.goto(url);page.locator('#enterBoard').click()
 def add(title,link):
  page.locator('#addText').click()
  for field,value in [('name','Student'),('content','My idea')]:page.locator(f'#form [name={field}]').fill(value)
  page.locator('#form details').first.locator('summary').click();page.locator('#form [name=title]').fill(title)
  page.locator('#preview').click();page.locator('#placeDefault').click()
  card=page.locator('.private-item',has_text=title);card.wait_for();page.wait_for_timeout(800);card.click();page.locator('#connectDraft').click();page.locator(f'.card[data-item="{link}"]').click();page.wait_for_timeout(800)
 add('First private idea','hal')
 page.wait_for_timeout(800)
 item=json.loads(page.evaluate("localStorage.getItem('redstring-private-drafts')"))[0]
 card=page.locator(f'.card[data-item="{item["id"]}"]');box=card.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+90,y+60,steps=8);page.mouse.up()
 moved=json.loads(page.evaluate("localStorage.getItem('redstring-private-drafts')"))[0];assert moved['x']>item['x']
 add('Connected private idea',item['id'])
 assert page.locator('.private-item').count()==2
 assert page.locator('#strings g').count()>=7
 page.reload();page.locator('.private-item').first.wait_for();assert page.locator('.private-item').count()==2
 other=browser.new_context();other.route('**/firebase-config.js',lambda r:r.fulfill(content_type='text/javascript',body='export const firebaseConfig={};'))
 fresh=other.new_page();fresh.goto(url);fresh.locator('.card').first.wait_for();assert fresh.locator('.private-item').count()==0
 page.locator('#viewTab').click();page.locator('#splay').click();assert page.locator('#splay').inner_text()=='Fold back';page.locator('#splay').click()
 page.locator('#sideboard summary').click();assert page.locator('#sideboardForm').is_hidden()
 assert page.locator('.copyright').inner_text()=='© Robert Pino * robertpino.com'
 page.set_viewport_size({'width':390,'height':844});assert page.locator('#addText').bounding_box()['y']<150
 page.locator('#addText').click();page.locator('#form [name=name]').fill('Phone student');page.locator('#form [name=content]').fill('Simple mobile idea');page.locator('#preview').click();page.locator('.private-item').nth(2).wait_for();assert page.locator('#placementBar').is_hidden()
 assert not errors,errors
 print('Private multi-item webs, linked drafts, drag persistence, browser isolation, temporary splay, closed Sideboard and mobile controls passed.')
 browser.close()
