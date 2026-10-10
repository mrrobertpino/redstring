from playwright.sync_api import sync_playwright
import json,os
base=os.environ.get('BOARD_TEST_URL','http://localhost:3206/redstring/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1500,'height':1000})
 context.route('**/firebase-config.js',lambda route:route.fulfill(content_type='text/javascript',body='export const firebaseConfig={};'))
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'editor.html');page.locator('.edit-card').first.wait_for()
 initial=page.locator('.board-pin').count()
 page.locator('#pinTool').click()
 for id in ['belief','gemini']:
  card=page.locator('[data-id='+id+']');box=card.bounding_box()
  page.mouse.click(box['x']+box['width']*.7,box['y']+box['height']*.6)
 assert page.locator('.board-pin').count()==initial+2
 state=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"));first,last=state['board']['pins'][-2:]
 page.locator('#spoolTool').click();page.locator('[data-pin="'+first['id']+'"]').click();page.locator('[data-pin="'+last['id']+'"]').click()
 state=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"));string=state['board']['strings'][-1]
 assert string['fromPin']==first['id'] and string['toPin']==last['id']
 assert string['createdAt'] and string['order']==6
 assert page.locator('#editStrings g.thread').last.get_attribute('data-string-id')==string['id']
 page.locator('.tool-settings summary').click()
 page.locator('#spoolSize').fill('110');page.locator('#pinSize').fill('90')
 assert '110px' in page.locator('#spoolTool').get_attribute('style')
 assert '90px' in page.locator('#pinTool').get_attribute('style')
 page.reload();page.locator('.edit-card').first.wait_for()
 assert page.locator('.board-pin').count()==initial+2
 assert '110px' in page.locator('#spoolTool').get_attribute('style')
 page.locator('#moveTool').click();page.locator('[data-id=belief]').click(position={'x':25,'y':45})
 page.locator('#rotation').fill('40');page.locator('#rotation').press('Tab')
 before=page.locator('[data-pin="'+first['id']+'"]').bounding_box()
 page.locator('#rotation').fill('70');page.locator('#rotation').press('Tab')
 after=page.locator('[data-pin="'+first['id']+'"]').bounding_box()
 assert before!=after
 with page.expect_popup() as pop:page.locator('#previewBoard').click()
 preview=pop.value;preview.locator('#draftReturn').wait_for(state='visible')
 assert preview.locator('#publicPins .board-pin').count()==initial+2
 assert preview.locator('#strings g.thread').last.get_attribute('data-string-id')==string['id']
 assert not errors,errors
 page.screenshot(path='/tmp/redstring-pin-tools.png')
 print('Pin placement, two-click strings, chronological paint order, resizing, reload, rotated anchors and private preview passed.')
 browser.close()
