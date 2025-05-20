// Dynamically detect the browser API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.getElementById('activate').addEventListener('click', () => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('youtube.com/watch')) {
            browserAPI.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content-script.js']
            });
        }
    });
});

document.getElementById('offset').addEventListener('input', () => {
    const offset = parseInt(document.getElementById('offset').value, 10);
    console.log(offset)
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        browserAPI.tabs.sendMessage(tabs[0].id, { type: 'SET_OFFSET', offset: offset });
        localStorage.setItem('offset', offset);
    });
});

document.getElementById('autosave').addEventListener('input', () => {
    const autosaveStatus = document.getElementById('autosave').checked;
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        browserAPI.tabs.sendMessage(tabs[0].id, { type: 'SET_AUTOSAVE', autosave: autosaveStatus });
        localStorage.setItem('autosave', autosaveStatus);
    });
});

localStorage.getItem('offset') !== null
    ? document.getElementById('offset').value = localStorage.getItem('offset')
    : document.getElementById('offset').value = 5;

    localStorage.getItem('autosave') !== null
        ? document.getElementById('autosave').checked = (localStorage.getItem('autosave') === 'true')
        : document.getElementById('autosave').checked = true;
