// ── Walls Wordle Google Apps Script ──
// Handles both score submission (POST/GET with name+score)
// and sheet data reading (GET with action=read)

var SHEET_NAME = ""; // Leave blank to use first sheet

function doGet(e) {
  var params = e.parameter;
  
  // Return sheet as CSV when action=read
  if (params.action === "read") {
    return serveCsv();
  }
  
  // Otherwise handle score submission
  if (params.name && params.score) {
    return submitScore(params.name, params.score);
  }
  
  return ContentService.createTextOutput("Walls Wordle Script OK");
}

function doPost(e) {
  var params = e.parameter;
  if (params.name && params.score) {
    return submitScore(params.name, params.score);
  }
  return ContentService.createTextOutput("OK");
}

function serveCsv() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var csv = data.map(function(row) {
    return row.map(function(cell) {
      var s = String(cell);
      // Quote cells that contain commas or quotes
      if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1 || s.indexOf("\n") !== -1) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(",");
  }).join("\n");
  
  var output = ContentService.createTextOutput(csv);
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

function submitScore(name, score) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  // Find today's date column
  var today = new Date();
  var m = today.getMonth() + 1;
  var d = today.getDate();
  var dateStr = m + "/" + d;
  
  var todayCol = -1;
  for (var c = 0; c < data[0].length; c++) {
    var h = String(data[0][c]).trim();
    if (h === dateStr || h === m + "/" + (d < 10 ? "0"+d : d) ||
        h === (m < 10 ? "0"+m : m) + "/" + d) {
      todayCol = c;
      break;
    }
  }
  
  if (todayCol === -1) {
    return ContentService.createTextOutput("Date column not found for " + dateStr);
  }
  
  // Find player row
  var playerRow = -1;
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][0]).trim().toLowerCase() === String(name).trim().toLowerCase()) {
      playerRow = r;
      break;
    }
  }
  
  if (playerRow === -1) {
    return ContentService.createTextOutput("Player not found: " + name);
  }
  
  // Write score
  sheet.getRange(playerRow + 1, todayCol + 1).setValue(Number(score));
  
  return ContentService.createTextOutput("OK: " + name + " = " + score);
}
