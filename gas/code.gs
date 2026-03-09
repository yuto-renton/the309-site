// ============================================================
// 参零九 (THE309) 予約フォーム — Google Apps Script
// ============================================================
// フォームから届いたデータをスプレッドシートに記録し、
// 管理者へメール通知を送る。
// ============================================================

const NOTIFY_EMAIL = 'yuuto1717@gmail.com';

// ライブ値 → 表示名の対応
const LIVE_LABELS = {
  '20250419-flat': '4/19（土）西荻窪 flat',
  '20250711-tbd':  '7/11（土）都内某所',
};

// ------------------------------------------------------------
// POST リクエストを受け取るエントリーポイント
// ------------------------------------------------------------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const row = appendToSheet(payload);
    sendNotification(payload, row);
  } catch (err) {
    Logger.log('Error: ' + err.message);
  }

  // no-cors モードで fetch しているためレスポンス本文は読まれないが、
  // 200 を返すことで fetch がエラーにならない。
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------
// スプレッドシートに1行追記
// ------------------------------------------------------------
function appendToSheet(p) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('予約一覧') || ss.getActiveSheet();

  // 1行目がヘッダーでなければ挿入
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['受付日時', 'ライブ', 'お名前', '枚数', 'メール', 'メッセージ']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  const now      = new Date();
  const liveName = LIVE_LABELS[p.live] || p.live || '（未選択）';
  const rowData  = [
    now,
    liveName,
    p.name    || '',
    p.count   || '',
    p.email   || '',
    p.message || '',
  ];

  sheet.appendRow(rowData);
  return sheet.getLastRow(); // 行番号を返す（通し番号用）
}

// ------------------------------------------------------------
// 管理者へメール通知
// ------------------------------------------------------------
function sendNotification(p, row) {
  const liveName = LIVE_LABELS[p.live] || p.live || '（未選択）';
  const now      = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');

  const subject = `【参零九 予約】${liveName} — ${p.name || '（名前なし）'}`;

  const body = [
    '新しい予約が届きました。',
    '',
    '─────────────────────',
    `受付日時　: ${now}`,
    `ライブ　　: ${liveName}`,
    `お名前　　: ${p.name || '（未入力）'}`,
    `枚数　　　: ${p.count || '（未入力）'}枚`,
    `メール　　: ${p.email   || '（未入力）'}`,
    `メッセージ: ${p.message || '（なし）'}`,
    '─────────────────────',
    '',
    '▶ スプレッドシートで確認',
    SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  ].join('\n');

  MailApp.sendEmail({
    to:      NOTIFY_EMAIL,
    subject: subject,
    body:    body,
  });
}
