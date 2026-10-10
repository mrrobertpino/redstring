from playwright.sync_api import sync_playwright
import json,base64,os
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1500,'height':1000})
 page.route('**/firebase-config.js',lambda route:route.fulfill(content_type='text/javascript',body='export const firebaseConfig={};'))
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('BOARD_TEST_URL','http://localhost:3200/redstring/')+'editor.html')
 page.locator('.edit-card').first.wait_for()
 assert page.locator('.edit-card').count()==8
 page.locator('[data-id=claude]').click()
 page.locator('#rotation').fill('45');page.locator('#rotation').press('Tab')
 assert '45deg' in page.locator('[data-id=claude]').get_attribute('style')
 page.locator('#width').fill('280');page.locator('#width').press('Tab')
 assert '280px' in page.locator('[data-id=claude]').get_attribute('style')
 # Move an image using an actual drag.
 card=page.locator('[data-id=claude]');box=card.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+40,y+30,steps=5);page.mouse.up()
 stored=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"))
 claude=next(i for i in stored['board']['items'] if i['id']=='claude')
 assert claude['x']>435
 page.locator('[data-id=hal]').click(modifiers=['Shift'])
 page.locator('#group').click();page.locator('#clusterForm [name=title]').fill('Thinking machines');page.locator('#clusterForm [name=reason]').fill('Shared cluster context');page.locator('#clusterForm button').click()
 assert 'Thinking machines' in page.locator('#clusterList').inner_text()
 # Add a transparent PNG through the file picker.
 image=page.evaluate("""()=>{const c=document.createElement('canvas');c.width=100;c.height=80;c.getContext('2d').fillRect(20,20,40,40);return c.toDataURL('image/png').split(',')[1]}""")
 page.locator('#files').set_input_files({'name':'transparent.png','mimeType':'image/png','buffer':base64.b64decode(image)})
 page.wait_for_function("document.querySelectorAll('.edit-card').length===9")
 assert page.locator('.edit-card img').count()==1
 page.locator('#undo').click();assert page.locator('.edit-card').count()==8
 page.locator('#redo').click();assert page.locator('.edit-card').count()==9
 # Connect from an edge to another image using pointer gestures.
 page.locator('#connect').click()
 src=page.locator('[data-id=chatgpt]').bounding_box();dst=page.locator('[data-id=surveillance]').bounding_box()
 page.mouse.move(src['x']+src['width']-3,src['y']+src['height']/2);page.mouse.down();page.mouse.move(dst['x']+3,dst['y']+dst['height']/2,steps=10);page.mouse.up()
 state=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"))
 assert len(state['board']['strings'])==7
 anchor=state['board']['strings'][-1]['a'];assert abs(max(abs(anchor['x']),abs(anchor['y']))-.5)<.001
 # Replace a sample image without losing its identity or strings.
 page.locator('#connect').click()
 page.locator('[data-id=surveillance]').click()
 before=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"))
 page.locator('#replaceImage').set_input_files({'name':'camera.png','mimeType':'image/png','buffer':base64.b64decode(image)})
 page.wait_for_function("document.querySelector('[data-id=surveillance] img')!==null")
 after=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"))
 assert after['board']['strings']==before['board']['strings']
 assert next(i for i in after['board']['items'] if i['id']=='surveillance')['x']==next(i for i in before['board']['items'] if i['id']=='surveillance')['x']
 # Cork uploads persist with layout and can be reset.
 page.locator('.background-settings summary').click()
 page.locator('#backgroundFile').set_input_files({'name':'cork.png','mimeType':'image/png','buffer':base64.b64decode(image)})
 page.wait_for_function("JSON.parse(localStorage.getItem('redstring-editor-v1')).board.surface?.startsWith('data:image/png')")
 page.locator('#resetBackground').click()
 # Local previews use edited content without publishing.
 with page.expect_popup() as popup_info:
  page.locator('#previewBoard').click()
 preview=popup_info.value
 preview.locator('#draftReturn').wait_for(state='visible')
 assert preview.locator('.card').count()==9
 assert not preview.locator('#addText').is_visible()
 preview.close()
 page.reload();page.locator('.edit-card').first.wait_for();assert page.locator('.edit-card').count()==9
 page.locator('#publish').click();assert 'not connected' in page.locator('#publishStatus').inner_text();page.locator('#publishDialog .close').click()
 page.screenshot(path='/tmp/redstring-editor.png')
 # Serve the edited board as seed plus layout to exercise public clustering.
 state=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"));edited=state['board'];edited['connections']=[[s['from'],s['to']] for s in edited['strings']]
 page.route('**/board.json',lambda route:route.fulfill(content_type='application/json',body=json.dumps(edited)))
 page.goto(os.environ.get('BOARD_TEST_URL','http://localhost:3200/redstring/'))
 page.locator('#welcome').wait_for(state='visible');page.locator('#enterBoard').click()
 page.get_by_role('button',name='Claude',exact=True).click()
 assert 'Thinking machines' in page.locator('#focusTitle').inner_text()
 assert not page.locator('#detail').is_visible()
 page.locator('#focusTitle').click()
 assert 'Shared cluster context' in page.locator('#detailContent').inner_text()
 page.get_by_role('button',name='Examine Claude',exact=True).click()
 assert 'Claude' in page.locator('#detailContent h2').inner_text()
 assert 'Added by' in page.locator('#detailContent').text_content()
 page.locator('#detail .close').click()
 page.get_by_role('button',name='Watching & being watched',exact=True).click()
 assert not page.locator('#detail').is_visible()
 page.locator('#focusTitle').click()
 assert page.locator('#evidenceImage > img').is_visible()
 assert 'Added by' in page.locator('#detailContent').text_content()
 page.locator('#detail .close').click()
 assert page.locator('.card.lifted').count()==0
 assert not errors,errors
 print('Browser passed: rotation, resizing, drag, PNG transparency format, cluster creation, edge strings, draft restoration, publish gating, welcome and combined/individual flips.')
 browser.close()
