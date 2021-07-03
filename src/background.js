import axios from 'axios'

axios.defaults.timeout = 5000

chrome.storage.sync.get({ yaleApi: "", yaleToken: "" }, (item) => {
    if (item.yaleApi && item.yaleToken) {
        axios.defaults.baseURL = item.yaleApi;
        axios.defaults.headers.common["authorization"] = "Bearer " + item.yaleToken;
    }
});

chrome.runtime.onMessage.addListener(msg => {
    if (msg.recipient == "background.js" && msg.type == "apiInfo") {
        axios.defaults.baseURL = msg.content.apiUrl
        axios.defaults.headers.common["authorization"] = "Bearer " + msg.content.apiToken;
    }
    else if (msg.recipient == "background.js" && msg.type == "checkTab") {
        check_current_tab()
    }
});

chrome.tabs.onUpdated.addListener((tabId) => {
    check_tab(tabId)
});

chrome.tabs.onActivated.addListener((tabInfo) => {
    let tabId = tabInfo.tabId
    setTimeout(() => {
        check_tab(tabId)
    }, 150);
});

function check_tab(tabId) {

    console.log("checkTab")
    chrome.browserAction.setBadgeText({ tabId: tabId, text: 'o' })
    chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#f2ce2b" }) // yello => loading

    chrome.tabs.get(tabId, (tab) => {
        let currentUrl = tab.url
        if (currentUrl[currentUrl.length - 1] == "/") {
            currentUrl = currentUrl.substring(0, currentUrl.length - 1)
        }
        axios.get("/api/v1/search/links", {
            params: { query: currentUrl },
        }).then(res => {
            let link = res.data.data[0]
            if (link) {
                chrome.browserAction.setBadgeText({ tabId: tabId, text: '√' });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#41b349" })  // green => in LinkAce
                chrome.storage.sync.set({ yalePageStatus: link.id })
            }
            else {
                chrome.browserAction.setBadgeText({ tabId: tabId, text: '' })
                chrome.storage.sync.set({ yalePageStatus: -1 })  // not in LinkAce
            }
        }, () => {
            chrome.browserAction.setBadgeText({ tabId: tabId, text: '!' });
            chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#a61b29" })  // red => something went wrong
            chrome.storage.sync.set({ yalePageStatus: -2 })  // unknown status
        })
    });

}

function check_current_tab() {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        let tabId = tabs[0].id;
        check_tab(tabId);
    });
}

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    if (!text)
        return;
    console.log(text)
    axios.get("/api/v1/search/links", {
        params: { query: text },
    }).then(res => {
        let links = res.data.data
        let suggests = []
        for (let link of links) {
            let url = link.url.replace(/&/g, '&amp;').replace(/</g, '&lt;').split(text)
            url = url.join(`<match>${text}</match>`)  // highlight user's input in url
            let title = link.title.split(text)
            title = title.join(`<match>${text}</match>`)  // hight usr's input in title
            suggests.push({ content: link.url, description: `${title} - <url>${url}</url>` })
        }
        suggest(suggests)
    })
});

chrome.omnibox.onInputEntered.addListener(text => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        let tabId = tabs[0].id;
        chrome.tabs.update(tabId, { url: text });
    });
})