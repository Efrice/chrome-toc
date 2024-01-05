console.log({ hello: chrome })

chrome.history.onVisited.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { url: "change" })
  })
})
