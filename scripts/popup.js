const modeEl = document.getElementById("mode")

modeEl.addEventListener("change", (e) => {
  const mode = e.target.checked ? "dark" : "light"
  localStorage.setItem("mode", mode)
  sendMessageToContent({ mode: mode })
})

const mode = localStorage.getItem("mode")

if (mode === "dark") {
  modeEl.checked = true
  sendMessageToContent({ mode: "dark" })
}

function sendMessageToContent(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) callback(response)
    })
  })
}
