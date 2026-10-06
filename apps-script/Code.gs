/**
 * Приём ответов формы базы знаний Simple Čeština в Google Таблицу.
 *
 * Лист «Ответы» всегда показывает последнюю отправку формы: разделы цветными строками,
 * под ними вопрос, ответ и статус. Повторная отправка перезаписывает лист целиком.
 * Лист «Сводка» хранит журнал отправок: когда, кто утвердил, сколько вопросов отвечено.
 *
 * Обновление скрипта: вставить этот файл вместо старого, сохранить, затем
 * «Развернуть» → «Управление развертываниями» → карандаш → «Версия: Новая версия» → «Развернуть».
 * Адрес /exec при этом не меняется.
 */
var SPREADSHEET_ID = '10MYDwpKC3bNZ7RDWctokqdV_AMSW0NvlKmk1IxBVLRc';
var SECRET = 'smenite-menya';

var C_HEAD = '#1f4e8c', C_SECTION = '#dde8f6', C_OK = '#dcf1e5', C_EMPTY = '#f9dddd', C_LINE = '#d3dae4';

function setup() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  render_(sheet_(ss, 'Ответы'), []);
  summaryHeader_(sheet_(ss, 'Сводка'));
  Logger.log('Готово: ' + ss.getUrl());
}

function doGet() {
  return json_({ ok: true, service: 'simple-kb-form' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return json_({ ok: false, error: 'доступ запрещён' });
    if (!Array.isArray(data.entries) || data.entries.length > 300) return json_({ ok: false, error: 'неверные данные' });

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var rows = render_(sheet_(ss, 'Ответы'), data.entries);

    var answered = data.entries.filter(function (x) { return String(x.a || '').trim() !== ''; }).length;
    var sum = sheet_(ss, 'Сводка');
    summaryHeader_(sum);
    var when = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd.MM.yyyy HH:mm');
    sum.getRange(sum.getLastRow() + 1, 1, 1, 4).setNumberFormat('@').setValues([[when, clip_(data.who, 200), answered + ' из ' + data.entries.length, rows]]);

    return json_({ ok: true, rows: data.entries.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Ищет лист без учёта регистра и приводит название к нужному.
function sheet_(ss, name) {
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getName().toLowerCase() === name.toLowerCase()) {
      if (all[i].getName() !== name) all[i].setName(name);
      return all[i];
    }
  }
  return ss.insertSheet(name);
}

function summaryHeader_(sh) {
  var head = ['Отправлено', 'Кто утвердил', 'Отвечено', 'Строк в листе'];
  if (sh.getRange(1, 1).getValue() !== head[0]) {
    sh.clear();
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground(C_SECTION);
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 4, 170);
  }
}

// Перерисовывает лист «Ответы» целиком. Возвращает число строк.
function render_(sh, entries) {
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.setHiddenGridlines(true);

  var table = [['Вопрос', 'Ответ', 'Статус']];
  var sectionRows = [], statusRows = [];
  var cur = null;
  entries.forEach(function (x) {
    if (x.section !== cur) {
      cur = x.section;
      table.push([clip_(cur, 200), '', '']);
      sectionRows.push(table.length);
    }
    var a = String(x.a == null ? '' : x.a).trim();
    table.push([clip_(x.q, 400), clip_(a, 5000), a ? '✓ есть ответ' : 'нет ответа']);
    statusRows.push([table.length, !!a]);
  });

  var n = table.length;
  var all = sh.getRange(1, 1, n, 3);
  all.setNumberFormat('@').setValues(table);
  all.setWrap(true).setVerticalAlignment('top').setFontFamily('Arial').setFontSize(10);
  all.setBorder(true, true, true, true, true, true, C_LINE, SpreadsheetApp.BorderStyle.SOLID);

  sh.setColumnWidth(1, 430);
  sh.setColumnWidth(2, 560);
  sh.setColumnWidth(3, 120);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, 3).setBackground(C_HEAD).setFontColor('#ffffff').setFontWeight('bold');

  sectionRows.forEach(function (r) {
    var rg = sh.getRange(r, 1, 1, 3);
    rg.merge().setBackground(C_SECTION).setFontWeight('bold').setFontSize(11).setVerticalAlignment('middle');
  });
  statusRows.forEach(function (s) {
    sh.getRange(s[0], 3).setBackground(s[1] ? C_OK : C_EMPTY).setFontColor(s[1] ? '#17734a' : '#a3262b').setFontWeight('bold');
    sh.getRange(s[0], 1).setFontWeight('bold');
  });
  sh.autoResizeRows(1, n);
  return n;
}

function clip_(s, n) {
  return String(s == null ? '' : s).slice(0, n);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
