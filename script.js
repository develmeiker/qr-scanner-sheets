const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let tokenClient;
let gapiReady = false;
let codeReader;
let isScanning = false;
let scannedText = '';

const preview = document.getElementById('preview');
const addButton = document.getElementById('addToList');

/* =========================
   GOOGLE API INIT
========================= */

function gapiLoaded() {
    console.log('gapiLoaded OK');
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: 'AIzaSyAKU5XQB2wDOjx6zzToWbbXvEJpXEWi7DY',
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiReady = true;
    console.log('GAPI lista');
}

function gisLoaded() {
    console.log('gisLoaded OK');
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '257011449518-cofhtqq2bi6ovi2kslv6nes0h1ukitc9.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response) => {
            gapi.client.setToken({ access_token: response.access_token });
            console.log('Token OAuth listo');
        },
    });
}

/* =========================
   SHEETS HELPERS
========================= */

async function qrExistsInSheet(qr) {
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1UauebiLulDowhA-9LxmWGKHuk6K2XlLk_J5dBDurOGo',
        range: 'Sheet1!A:A',
    });

    const values = response.result.values || [];
    return values.some(row => row[0] === qr);
}

async function appendToSheet() {
    const now = new Date().toLocaleString();

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: '1UauebiLulDowhA-9LxmWGKHuk6K2XlLk_J5dBDurOGo',
        range: 'Sheet1!A:C',
        valueInputOption: 'RAW',
        resource: {
            values: [[scannedText, now, '']],
        },
    });

    alert('QR guardado correctamente');
}

/* =========================
   QR SCAN
========================= */

document.getElementById('startScan').addEventListener('click', () => {
    if (isScanning) return;

    codeReader = new ZXing.BrowserQRCodeReader();
    codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
        if (result) {
            scannedText = result.text;
            document.getElementById('scannedText').textContent = scannedText;

            if (!gapiReady) {
                alert('Google aún se está inicializando');
                return;
            }

            if (!gapi.client.getToken()) {
                tokenClient.requestAccessToken();
                return;
            }

            const isDuplicate = await qrExistsInSheet(scannedText);

            if (isDuplicate) {
                preview.classList.add('duplicate');
                preview.classList.remove('success');
                addButton.disabled = true;
                addButton.textContent = 'QR duplicado';
            } else {
                preview.classList.remove('duplicate');
                preview.classList.add('success');
                addButton.disabled = false;
                addButton.textContent = 'Guardar QR';
            }

            preview.style.display = 'block';
        }

        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(err);
        }
    });

    document.getElementById('video').style.display = 'block';
    isScanning = true;
});

/* =========================
   SAVE BUTTON
========================= */

addButton.addEventListener('click', async () => {
    if (!scannedText) return;

    await appendToSheet();
    preview.style.display = 'none';
    scannedText = '';
});
