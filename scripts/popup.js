const modeEl = document.getElementById("mode")
const mode = getStorage("mode")

if (mode === "dark") {
  modeEl.checked = true
  sendMessageToContent({ mode: "dark" })
}

modeEl.addEventListener("change", (e) => {
  const mode = e.target.checked ? "dark" : "light"
  setStorage("mode", mode)
  sendMessageToContent({ mode })
})

const enableEl = document.getElementById("enable")
const enable = getStorage("enable")

if (enable === "disabled") {
  enableEl.checked = false
  sendMessageToContent({ enable: "disabled" })
}

enableEl.addEventListener("change", (e) => {
  const enable = e.target.checked ? "enabled" : "disabled"
  setStorage("enable", enable)
  sendMessageToContent({ enable })
})

function getStorage(key) {
  return localStorage.getItem(key)
}

function setStorage(key, val) {
  return localStorage.setItem(key, val)
}

function sendMessageToContent(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) callback(response)
    })
  })
}
