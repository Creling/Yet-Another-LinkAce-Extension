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
    console.log("update")
    check_tab(tabId)
});

function check_tab(tabId) {
    chrome.browserAction.setBadgeText({ tabId: tabId, text: 'o' })
    chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#f2ce2b" }) // yello => loading

    chrome.tabs.get(tabId, (tab) => {
        console.log("gettab")
        let currentUrl = tab.url
        if (currentUrl[currentUrl.length - 1] == "/") {
            currentUrl = currentUrl.substring(0, currentUrl.length - 1)
        }
        axios.get("/api/v1/search/links", {
            params: { query: currentUrl },
        }).then(res => {
            console.log(res)
            let link = res.data.data[0]
            if (link) {

                console.log(link)
                chrome.browserAction.setBadgeText({ tabId: tabId, text: '√' });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#41b349" })  // green => in LinkAce
                chrome.storage.sync.set({ yalePageStatus: link.id })  
            }
            else {
                console.log("no result")
                chrome.browserAction.setBadgeText({ tabId: tabId, text: '' })
                chrome.storage.sync.set({ yalePageStatus: -1 })  // not in LinkAce
            }
        }, () => {
            console.log("err")
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