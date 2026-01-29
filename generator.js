const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SPREADSHEET_ID = '1UauebiLulDowhA-9LxmWGKHuk6K2XlLk_J5dBDurOGo';

const USER = 'A';

let tokenClient;
let gapiReady = false;

function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiReady = true;
        console.log('GAPI lista');
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '257011449518-cofhtqq2bi6ovi2kslv6nes0h1ukitc9.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: async (resp) => {
            gapi.client.setToken({ access_token: resp.access_token });
            await createQR();
        }
    });
}

async function generateQR() {
    if (!gapiReady) {
        alert('Google aún no está listo');
        return;
    }

    if (!gapi.client.getToken()) {
        tokenClient.requestAccessToken();
    } else {
        createQR();
    }
}

async function createQR() {

    // 1 Leer último folio
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Generator!B1',
    });

    let lastFolio = Number(res.result.values?.[0]?.[0] || 0);
    let newFolio = lastFolio + 1;
    let folioFormatted = newFolio.toString().padStart(6, '0');
    let now = new Date().toLocaleString();

    // 2 Guardar nuevo folio
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Generator!B1',
        valueInputOption: 'RAW',
        resource: {
            values: [[newFolio]],
        },
    });

    // 3 Guardar historial
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:C',
        valueInputOption: 'RAW',
        resource: {
            values: [[folioFormatted, now, USER]],
        },
    });

    // 4 Generar QR
    document.getElementById('folio').textContent = 'Folio: ' + folioFormatted;

    QRCode.toCanvas(document.getElementById('qr'), folioFormatted, {
        width: 220
    });
}


