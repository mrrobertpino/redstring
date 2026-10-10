from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1600,'height':1000})
 page.route('**/firebase-config.js',lambda r:r.fulfill(content_type='text/javascript',body='export const firebaseConfig={};'))
 page.clock.install()
 page.goto(os.environ.get('BOARD_TEST_URL','http://localhost:3207/redstring/')+'editor.html')
 page.wait_for_function("document.querySelector('#backupVersions')?.options[0]?.value")
 page.locator('.version-backups summary').click()
 initial=page.locator('#backupVersions').input_value()
 initialData=page.evaluate("async id=>(await (await import('./backups.js')).loadVersion(id)).data",initial)
 assert page.locator('#delete').is_disabled()
 page.locator('[data-id=claude]').click();assert page.locator('#delete').is_enabled()
 page.locator('#rotation').fill('15');page.locator('#rotation').press('Tab');page.locator('#backupNow').click()
 page.wait_for_function("document.querySelector('#backupVersions').options.length===2")
 assert page.evaluate("async id=>(await (await import('./backups.js')).loadVersion(id)).data",initial)==initialData
 page.locator('#rotation').fill('30');page.locator('#rotation').press('Tab')
 page.clock.fast_forward(300001)
 page.wait_for_function("document.querySelector('#backupVersions').options.length===3")
 page.clock.fast_forward(300001);page.wait_for_timeout(100)
 assert page.locator('#backupVersions option').count()==3
 page.locator('#backupVersions').select_option(initial);page.locator('#restoreVersion').click()
 page.wait_for_function("document.querySelector('#backupStatus').textContent.startsWith('Restored')")
 restored=json.loads(page.evaluate("localStorage.getItem('redstring-editor-v1')"))
 assert next(i for i in restored['board']['items'] if i['id']=='claude')['rotation']==next(i for i in initialData['board']['items'] if i['id']=='claude')['rotation']
 assert 'not published' in page.locator('#backupStatus').inner_text()
 page.on('dialog',lambda d:d.accept())
 page.locator('[data-id=claude]').click();page.locator('#delete').click();assert page.locator('.edit-card').count()==7
 page.reload();page.locator('.edit-card').first.wait_for();assert page.locator('.edit-card').count()==7
 page.wait_for_function("document.querySelector('#backupVersions')?.options[0]?.value")
 assert page.locator('#backupVersions option').count()>=3
 print('Append-only backups, five-minute autosave, unchanged-board deduplication, restore without publication, visible delete and deletion persistence passed.')
 browser.close()
