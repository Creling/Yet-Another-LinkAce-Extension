import axios from 'axios'
import { setupCache } from 'axios-cache-adapter'


const cache = setupCache({
    maxAge: 1 * 60 * 1000,
    exclude: { query: false }
})
var api = axios.create({
    adapter: cache.adapter
})

api.defaults.timeout = 5000
api.defaults.timeout = 5000

var lastOmniboxInputEvent = null

chrome.storage.sync.get({ yaleApi: "", yaleToken: "" }, (item) => {
    if (item.yaleApi && item.yaleToken) {
        api.defaults.baseURL = item.yaleApi;
        api.defaults.headers.common["authorization"] = "Bearer " + item.yaleToken;
    }
});

chrome.runtime.onMessage.addListener(msg => {
    if (msg.recipient == "background.js" && msg.type == "apiInfo") {
        api.defaults.baseURL = msg.content.apiUrl
        api.defaults.headers.common["authorization"] = "Bearer " + msg.content.apiToken;
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
    }, 0);
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    if (lastOmniboxInputEvent)
        clearTimeout(lastOmniboxInputEvent)
    lastOmniboxInputEvent = setTimeout(() => {
        deal_omnibox_input(text, suggest)
    }, 250); // aviod to occur onInputChanged event too frquently
});

chrome.omnibox.onInputEntered.addListener(text => {
    chrome.tabs.update({ url: text });
})

function check_tab(tabId) {
    console.log("checkTab")
    chrome.browserAction.setBadgeText({ tabId: tabId, text: 'o' })
    chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#f2ce2b" }) // yello => loading

    chrome.tabs.get(tabId, (tab) => {
        try {
                var currentUrl = tab.url
        }
        catch {
            setTimeout(() => {
                check_tab(tabId)
            }, 50);
            return
        }
        if (currentUrl[currentUrl.length - 1] == "/") {
            currentUrl = currentUrl.substring(0, currentUrl.length - 1)
        }
        api.get("/api/v1/search/links", {
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

function deal_omnibox_input(text, suggest) {
    console.log("search")
    let inputs = text.split(" ")
    let urls = []
    let tags = []
    let lists = []
    let intersectionSearchPromises = [] // search results will be intersected
    let unionSearchPromises = [] // search results will be united
    for (let input of inputs) {
        if (input[0] == '#' && input.length > 1) {
            let tag = input.slice(1)
            tags.push(tag)
            intersectionSearchPromises.push(
                new Promise(resolve => {
                    api.get('/api/v1/search/tags', {
                        params: { query: tag }
                    }).then(res => {
                        let tagId = Object.keys(res.data)[0];
                        const length = cache.store.length()
                        console.log(res)
                        console.log('Cache store length:', length)
                        api.get(`/api/v1/tags/${tagId}/links`).then(res => resolve(res.data.data))
                    })
                }))
        }
        else if (input[0] == '@' && input.length > 1) {
            let list = input.slice(1)
            lists.push(list)
            intersectionSearchPromises.push(
                new Promise(resolve => {
                    api.get('/api/v1/search/lists', {
                        params: { query: list }
                    }).then(res => {
                        let listId = Object.keys(res.data)[0];
                        api.get(`/api/v1/lists/${listId}/links`).then(res => resolve(res.data.data))
                    })
                }))
        }
        else if (input) {
            urls.push(input)
            intersectionSearchPromises.push(
                new Promise(resolve => {
                    api.get("/api/v1/search/links", {
                        params: { query: input }
                    }).then(res => { resolve(res.data.data) })
                }))
        }
    }

    let links = []

    Promise.all(intersectionSearchPromises).then(results => {
        if (!results)
            return;
        let minResult = results[0]
        results.forEach(result => {
            if (result.length < minResult.length)
                minResult = result
        })
        minResult.forEach(link => {
            let status = []
            results.forEach(result => {
                if (result.includes(link)) {
                    status.push(true)
                }
            })
            const allIn = status.every(s => { return s == true })
            allIn && !links.includes(link) && links.push(link)
        })

        let suggests = []
        // console.log(links)
        // let suggests = []
        // urls.sort((a, b) => b.length - a.length)
        // for (let inputUrl of urls) {
        //     console.log("inputUrl")
        //     console.log(inputUrl)
        //     for (let link of links) {
        //         let url = link.url.replace(/&/g, '&amp;').replace(/</g, '&lt;').split(inputUrl)
        //         console.log(url)
        //         url = url.join(`<match>${inputUrl}</match>`)  // highlight user's input in url
        //         let title = link.title.split(inputUrl)
        //         title = title.join(`<match>${inputUrl}</match>`)  // hight usr's input in title
        //         suggests.push({ content: link.url, description: `${title} - <url>${url}</url>` })
        //     }
        // }
        for (let link of links) {
            let url = link.url.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            let title = link.title
            suggests.push({ content: link.url, description: `${title} - <url>${url}</url>` })
        }
        suggest(suggests)

    }).catch(err => {
        console.log(err)
    })
}