/**
 * Pizza Pilgrims München feedback: Google backend.
 * Writes each response to a Google Sheet (one tab per group)
 * and saves voice notes and photos to a Drive folder.
 *
 * Setup: see README. Deploy as Web app → Execute as: Me → Who has access: Anyone.
 */

const SETTINGS = {
  SHEET_ID:    'PASTE_SHEET_ID',    // from the Sheet URL: /spreadsheets/d/<THIS>/edit
  FOLDER_ID:   'PASTE_FOLDER_ID',   // from the Drive folder URL: /folders/<THIS>
  ACCESS_CODE: 'CHANGE-ME',         // the team code; blank = no code needed
  NOTIFY:      ''                    // optional email for a ping on each new response
};

const FIXED_START = ['Received', 'Site', 'Language'];
const FIXED_END   = ['Anything else', 'Voice note', 'Photos', 'Name', 'Email', 'Happy to be contacted', 'ID'];

function doGet() {
  return json_({ ok: true, service: 'pp-munich-feedback' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!codeOk_(body.code)) return json_({ ok: false, error: 'bad_code' });
    if (body.action === 'check') return json_({ ok: true });
    if (body.action !== 'submit') return json_({ ok: false, error: 'unknown_action' });

    // Media first, so the row can link to it.
    const links = saveMedia_(body);

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = tab_(String(body.tab || 'Feedback').slice(0, 90));
      const questionHeaders = (body.columns || []).map(c => String(c[0]));
      const headers = ensureHeaders_(sheet, questionHeaders);

      const values = {};
      values['Received'] = new Date();
      values['Site'] = body.site || '';
      values['Language'] = (body.lang || '').toUpperCase();
      (body.columns || []).forEach(c => values[String(c[0])] = c[1]);
      values['Anything else'] = body.comment || '';
      values['Voice note'] = links.voice || '';
      values['Photos'] = links.photos.join('\n');
      values['Name'] = body.name || '';
      values['Email'] = body.email || '';
      values['Happy to be contacted'] = body.followUp ? 'Yes' : '';
      values['ID'] = body.id || '';

      sheet.appendRow(headers.map(h => values[h] !== undefined ? values[h] : ''));
    } finally {
      lock.releaseLock();
    }

    if (SETTINGS.NOTIFY) {
      MailApp.sendEmail(SETTINGS.NOTIFY, 'New Munich feedback: ' + (body.tab || ''),
        (body.site || '') + '\n\n' + (body.comment || '(no comment)') +
        '\n\nOpen the Sheet: https://docs.google.com/spreadsheets/d/' + SETTINGS.SHEET_ID);
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function codeOk_(code) {
  if (!SETTINGS.ACCESS_CODE) return true;
  return String(code || '').trim().toUpperCase() === SETTINGS.ACCESS_CODE.trim().toUpperCase();
}

function saveMedia_(body) {
  const out = { voice: '', photos: [] };
  const hasMedia = body.voice || (body.photos && body.photos.length);
  if (!hasMedia) return out;
  const root = DriveApp.getFolderById(SETTINGS.FOLDER_ID);
  const stamp = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd HHmm');
  const folder = root.createFolder(stamp + ' · ' + (body.tab || '') + ' · ' + String(body.id || '').slice(0, 8));
  if (body.voice && body.voice.data) {
    const blob = Utilities.newBlob(Utilities.base64Decode(body.voice.data), body.voice.mime || 'audio/mp4', 'voice-note.' + (body.voice.ext || 'm4a'));
    out.voice = folder.createFile(blob).getUrl();
  }
  (body.photos || []).slice(0, 6).forEach((p, i) => {
    const blob = Utilities.newBlob(Utilities.base64Decode(p.data), 'image/jpeg', 'photo-' + (i + 1) + '.jpg');
    out.photos.push(folder.createFile(blob).getUrl());
  });
  return out;
}

function tab_(name) {
  const ss = SpreadsheetApp.openById(SETTINGS.SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Keeps a header row; adds a column for any new question, just before the fixed end columns.
function ensureHeaders_(sheet, questionHeaders) {
  let headers = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String) : [];
  if (!headers.length) {
    headers = FIXED_START.concat(questionHeaders, FIXED_END);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#00572E').setFontColor('#FFFFFF');
    return headers;
  }
  const missing = questionHeaders.filter(h => headers.indexOf(h) === -1);
  missing.forEach(h => {
    const at = headers.indexOf(FIXED_END[0]) + 1; // 1-based column of 'Anything else'
    sheet.insertColumnBefore(at);
    sheet.getRange(1, at).setValue(h).setFontWeight('bold').setBackground('#00572E').setFontColor('#FFFFFF');
    headers.splice(at - 1, 0, h);
  });
  return headers;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor to grant permissions and check the IDs are right.
function testSetup() {
  SpreadsheetApp.openById(SETTINGS.SHEET_ID).getName();
  DriveApp.getFolderById(SETTINGS.FOLDER_ID).getName();
  console.log('Sheet and folder found. Now Deploy → New deployment → Web app.');
}
