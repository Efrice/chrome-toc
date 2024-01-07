const storage = chrome.storage.local

const modeEl = document.getElementById("mode")

storage.get(["mode"]).then((result) => {
  if (result.mode === "dark") {
    modeEl.checked = true
  }
})

modeEl.addEventListener("change", (e) => {
  const mode = e.target.checked ? "dark" : "light"
  storage.set({ mode }).then(() => {})
  sendMessageToContent({ mode })
})

const enableEl = document.getElementById("enable")

storage.get("enable").then((result) => {
  if (result.enable === "disabled") {
    enableEl.checked = false
  }
})

enableEl.addEventListener("change", (e) => {
  const enable = e.target.checked ? "enabled" : "disabled"
  storage.set({ enable }).then(() => {})
  sendMessageToContent({ enable })
})

function sendMessageToContent(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) callback(response)
    })
  })
}
