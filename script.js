const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let tokenClient;
let gisInited = false;
let codeReader;
let scannedItems = [];
let isScanning = false;
let scannedText = '';
let gapiReady = false;

const preview = document.getElementById('preview');
const addButton = document.getElementById('addToList');

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: 'AIzaSyAKU5XQB2wDOjx6zzToWbbXvEJpXEWi7DY',
        discoveryDocs: [DISCOVERY_DOC],
    });

    gapiReady = true;
    console.log('GAPI lista')
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '257011449518-cofhtqq2bi6ovi2kslv6nes0h1ukitc9.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response) => {
            if (response.error !== undefined) {
                throw (response);
            }
            gapi.client.setToken(response.access_token);
            appendToSheet();
        },
    });
    gisInited = true;
}

document.getElementById('startScan').addEventListener('click', () => {
    if (!isScanning) {
        codeReader = new ZXing.BrowserQRCodeReader();
        codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
            if (result) {
                scannedText = result.text;
                document.getElementById('scannedText').textContent = scannedText;

                // VALIDACIÓN DE DUPLICADOS
                if (scannedItems.includes(scannedText)) {
                    preview.classList.add('duplicate');
                    addButton.disabled = true;
                    addButton.textContent = 'Duplicado';
                } else {
                    preview.classList.remove('duplicate');
                    addButton.disabled = false;
                    addButton.textContent = 'Agregar a Lista';
                }

                preview.style.display = 'block';
            }

            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
            }
        });

        document.getElementById('video').style.display = 'block';
        isScanning = true;
    }
});

addButton.addEventListener('click', () => {
    if (!scannedText) return;

    scannedItems.push(scannedText);
    updateList();

    preview.style.display = 'none';
    scannedText = '';

    if (scannedItems.length > 0) {
        document.getElementById('sendToSheets').style.display = 'block';
    }
});

document.getElementById('sendToSheets').addEventListener('click', () => {

    if (!gapiReady || !tokenClient) {
        alert('Google aún se está inicializando, espera unos segundos');
        return;
    }

    if (!gapi.client.getToken()) {
        tokenClient.requestAccessToken();
    } else {
        appendToSheet();
    }
});


function updateList() {
    let list = document.getElementById('scannedList');
    list.innerHTML = '';

    scannedItems.forEach((item, index) => {
        let li = document.createElement('li');
        li.textContent = item;

        let removeBtn = document.createElement('button');
        removeBtn.textContent = 'Eliminar';
        removeBtn.addEventListener('click', () => {
            scannedItems.splice(index, 1);
            updateList();

            if (scannedItems.length === 0) {
                document.getElementById('sendToSheets').style.display = 'none';
            }
        });

        li.appendChild(removeBtn);
        list.appendChild(li);
    });
}

async function appendToSheet() {
    if (scannedItems.length === 0) return;

    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: '1UauebiLulDowhA-9LxmWGKHuk6K2XlLk_J5dBDurOGo',
            range: 'Sheet1!A:A',
            valueInputOption: 'RAW',
            resource: {
                values: scannedItems.map(item => [item]),
            },
        });

        alert('Datos enviados a Sheets exitosamente');
        scannedItems = [];
        updateList();
        document.getElementById('sendToSheets').style.display = 'none';

    } catch (err) {
        console.error('Error al enviar a Sheets:', err);
        alert('Error al enviar datos');
    }
}


