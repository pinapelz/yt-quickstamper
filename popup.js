document.getElementById('activate').addEventListener('click', () => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0].url.includes('youtube.com/watch')) {
            browser.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content-script.js']
            });
        } else {
            alert("Please open a YouTube video to use the Timestamp Tool.");
        }
    });
});

document.getElementById('offset').addEventListener('input', () => {
    const offset = parseInt(document.getElementById('offset').value, 10);
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, { type: 'SET_OFFSET', offset: offset });
        localStorage.setItem('offset', offset);
    });
});

localStorage.getItem('offset') !== null ? document.getElementById('offset').value = localStorage.getItem('offset') : document.getElementById('offset').value = 5;