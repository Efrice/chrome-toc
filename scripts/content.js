console.log("TOC.")

createTOC()

let cacheURL = location.href

chrome.runtime.onMessage.addListener((message) => {
  if (message.enable) {
    toggleEnable()
  } else if (message.mode) {
    setMode()
  } else if (message.url && isDiffURL(cacheURL, location.href)) {
    createTOC()
    cacheURL = location.href
  }
})

function createTOC() {
  let h2s = null
  let h3s = null
  let times = 0
  let timer = main()

  function main() {
    return setInterval(() => {
      times++
      h2s = Array.from(document.querySelectorAll("h2"))
      h3s = Array.from(document.querySelectorAll("h3"))
      if (times > 10) {
        clearInterval(timer)
      }
      if (h2s.length >= 3 || h3s.length >= 3) {
        clearInterval(timer)

        const tree = generateTree(h2s, h3s)
        if (tree.length > 0) {
          appendToc(getAnchors(tree))
          toggleEnable()
          setMode()
        }
      }
    }, 1000)
  }

  function generateTree(h2s, h3s) {
    const h2sInfo = h2s.map((h2) => getElementInfo(h2)).filter((h2) => h2.id)
    const h3sInfo = h3s.map((h3) => getElementInfo(h3)).filter((h3) => h3.id)
    if (h2sInfo.length === 0) {
      return h3sInfo
    }

    for (let i = 0; i < h2sInfo.length - 1; i++) {
      h2sInfo[i].nextTop = h2sInfo[i + 1].top
    }

    for (let i = 0; i < h2sInfo.length; i++) {
      for (let j = 0; j < h3sInfo.length; j++) {
        if (
          h2sInfo[i].top < h3sInfo[j].top &&
          h2sInfo[i].nextTop > h3sInfo[j].top
        ) {
          h2sInfo[i]["children"].push(h3sInfo[j])
        }
      }
    }
    return h2sInfo
  }

  function getAnchors(tree) {
    let result = []
    for (let i = 0; i < tree.length; i++) {
      const anchor = createAnchor(tree[i])
      const children = tree[i].children
      if (children.length > 0) {
        const ul = document.createElement("ul")
        children.forEach((c) => ul.appendChild(createAnchor(c)))
        anchor.appendChild(ul)
      }
      result.push(anchor)
    }
    return result
  }

  function createAnchor(elInfo) {
    const anchor = document.createElement("li")
    const a = document.createElement("a")
    a.href = elInfo.href
    a.innerText = elInfo.title
    anchor.id = elInfo.id
    a.addEventListener("click", (e) => {
      document
        .querySelector("#toc.toc")
        .querySelectorAll("li")
        .forEach((li) => {
          if (li.id !== e.target.parentElement.id) {
            li.classList.remove("active")
          } else {
            li.classList.add("active")
          }
        })
    })
    anchor.appendChild(a)
    return anchor
  }

  function getElementInfo(el) {
    return createElementInfo(el)
  }

  function createElementInfo(el) {
    const id = el.id || el.dataset.id
    return {
      title: formatTitle(el.innerText),
      id,
      href: removeHash(location.href) + "#" + id,
      top: el.getBoundingClientRect().top,
      nextTop: Infinity,
      children: [],
    }
  }

  function appendToc(anchors) {
    const toc = createToc()
    toc.appendChild(createContent(anchors))
    document.body.appendChild(toc)
  }

  function createToc() {
    let toc = document.querySelector("#toc.toc")
    if (toc) {
      toc.removeChild(toc.querySelector(".content"))
    } else {
      toc = document.createElement("div")
      toc.id = "toc"
      toc.className = "toc"
      toc.appendChild(createControl())
    }

    return toc
  }

  function createControl() {
    const control = document.createElement("div")
    control.className = "control"
    const icon = document.createElement("span")
    icon.className = "icon"
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <path fill="#333333" d="M3 4h18v2H3zm6 7h12v2H9zm-6 7h18v2H3z"/>
      </svg>
      `
    control.appendChild(icon)
    control.addEventListener("mousedown", handleMouseDown)
    return control
  }

  function createContent(anchors) {
    const content = document.createElement("div")
    content.className = "content"
    const ul = document.createElement("ul")
    anchors.map((a) => ul.appendChild(a))
    content.appendChild(ul)
    return content
  }

  let dragged = false
  let tocStartPos = { x: 0, y: 0 }
  let tocMovePos = { x: 0, y: 0 }

  function handleMouseDown(e) {
    tocStartPos = {
      x: e.clientX,
      y: e.clientY,
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    dragged = false

    e.stopPropagation()
    e.preventDefault()
  }

  function handleMouseMove(e) {
    tocMovePos = {
      x: tocMovePos.x + e.clientX - tocStartPos.x,
      y: tocMovePos.y + e.clientY - tocStartPos.y,
    }

    document.querySelector(
      ".toc"
    ).style.transform = `translate(${tocMovePos.x}px, ${tocMovePos.y}px)`
    tocStartPos = {
      x: e.clientX,
      y: e.clientY,
    }

    dragged = true
  }

  function handleMouseUp(e) {
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)

    if (!dragged && e.target.tagName !== "DIV") {
      document.querySelector(".toc").classList.toggle("expand")
    }
  }

  function formatTitle(title) {
    return title.replace(/[^\u4e00-\u9fa5\d\.\、\-\）\(\)a-z A-Z]/g, "")
  }

  function removeHash(href) {
    return href.replace(/#[^\/]*$/, "")
  }
}

function isDiffURL(url1, url2) {
  return url1.replace(/#[^\/]*$/, "") !== url2.replace(/#[^\/]*$/, "")
}

var observer = new MutationObserver(function (mutationsList, observer) {
  // 遍历 mutationsList 来检查 URL 的变化
  mutationsList.forEach(function (mutation) {
    // 在 mutation 中检查 URL 的变化，这取决于你的页面结构
    if (mutation.type === 'childList' && isDiffURL(cacheURL, location.href)) {
      createTOC()
      cacheURL = location.href
    }
  })
})

var observerConfig = {
  childList: true,
  subtree: true
}

observer.observe(document.body, observerConfig)

const storage = chrome.storage.local
function setMode() {
  const toc = document.querySelector("#toc.toc")
  storage.get(["mode"]).then((result) => {
    if (result.mode === "dark") {
      toc.classList.add("dark")
    } else {
      toc.classList.remove("dark")
    }
  })
}

function toggleEnable() {
  const toc = document.querySelector("#toc.toc")
  storage.get(["enable"]).then((result) => {
    if (result.enable === "disabled") {
      toc.classList.add("disabled")
    } else {
      toc.classList.remove("disabled")
    }
  })
}
