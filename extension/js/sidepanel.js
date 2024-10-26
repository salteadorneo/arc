const EDIT_ICON = "<svg xmlns='http://www.w3.org/2000/svg' height='18' viewBox='0 -960 960 960' width='18' fill='currentColor'><path d='M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z' /></svg>"
const FOLDER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>'
const FOLDER_OPEN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z"/></svg>'

const BROWSER = navigator.userAgent.includes('Edg')
  ? 'edge'
  : navigator.userAgent.includes('OPR')
    ? 'opera'
    : navigator.userAgent.includes('Brave')
      ? 'brave'
      : 'chrome'

function init () {
  getTabs()

  chrome.tabs.onCreated.addListener(getTabs)
  chrome.tabs.onMoved.addListener(getTabs)
  chrome.tabs.onRemoved.addListener(getTabs)
  chrome.tabs.onUpdated.addListener(() => {
    getTabs()
    checkActiveTab()
  })
  chrome.tabs.onDetached.addListener(getTabs)
  chrome.tabs.onActivated.addListener(checkActiveTab)

  chrome.tabGroups.onCreated.addListener(getTabs)
  chrome.tabGroups.onMoved.addListener(getTabs)
  chrome.tabGroups.onRemoved.addListener(getTabs)
  chrome.tabGroups.onUpdated.addListener((group) => getGroupInfo(group.id))
}

init()

const browserUrls = []
const browserButtons = document.querySelectorAll('[data-browser]')
browserButtons.forEach((element) => {
  browserUrls.push(`${BROWSER}://${element.dataset.browser}`)

  element.onclick = () => {
    activeTabOrCreate(`${BROWSER}://${element.dataset.browser}/`)
  }

  element.onmousedown = (event) => {
    if (event.button === 1) {
      const tabId = parseInt(element.dataset.tabId)
      chrome.tabs.remove(tabId)
      element.classList.remove('bg-white/15')
      delete element.dataset.tabId
    }
  }
})

function getTabs () {
  chrome.windows.getCurrent({ populate: true }, (window) => {
    chrome.tabs.query({ windowId: window.id }, (tabs) => {
      const container = document.querySelector('#tabs')
      container.innerHTML = ''

      const pinnedContainer = document.querySelector('#pinned')
      pinnedContainer.innerHTML = ''

      const groups = []

      tabs.forEach(tab => {
        if (browserUrls.find(url => tab.url.startsWith(url))) {
          browserButtons.forEach((element) => {
            if (tab.url.startsWith(`${BROWSER}://${element.dataset.browser}`)) {
              element.dataset.tabId = tab.id
            }
          })
          return
        }
        if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && !groups.includes(tab.groupId)) {
          groups.push(tab.groupId)

          const groupContainer = document.createElement('section')
          groupContainer.dataset.groupId = tab.groupId
          groupContainer.className = 'flex flex-col gap-1 select-none cursor-default overflow-hidden transition-all min-h-7 max-h-7'

          groupContainer.onclick = () => {
            groupContainer.classList.toggle('max-h-7')
            chrome.tabGroups.update(tab.groupId, { collapsed: groupContainer.classList.contains('max-h-7') })
          }

          const groupTitle = document.createElement('section')
          groupTitle.className = 'group flex items-center gap-2 text-sm font-bold px-2 py-1 rounded transition-colors'

          const icon = document.createElement('span')
          groupTitle.appendChild(icon)

          const title = document.createElement('h2')
          title.className = 'w-full outline-none truncate'
          groupTitle.appendChild(title)

          title.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              title.blur()
            }
          })

          const editButton = document.createElement('button')
          editButton.innerHTML = EDIT_ICON
          editButton.className = 'hidden group-hover:grid place-content-center size-4 outline-none transition-all'
          groupTitle.appendChild(editButton)

          editButton.onclick = (event) => {
            event.stopPropagation()
            title.contentEditable = true
            title.classList.remove('truncate')
            title.focus()
            document.execCommand('selectAll', false, null)
          }

          groupContainer.appendChild(groupTitle)
          container.appendChild(groupContainer)

          getGroupInfo(tab.groupId)
        }
        createTabElement(tab, container)
      })

      createTabElement({
        title: 'New Tab',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke-width="1.5" color="currentColor" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M6 12h6m6 0h-6m0 0V6m0 6v6" /></svg>',
        'data-action': 'new-tab'
      }, container)
    })
  })
}

function getGroupInfo (groupId) {
  chrome.tabGroups.get(groupId, (groupInfo) => {
    const container = document.querySelector(`[data-group-id="${groupId}"]`)

    if (!groupInfo.collapsed) {
      container.classList.remove('max-h-7')
    }

    const groupTitle = container.querySelector('section')
    groupTitle.classList.add(...getColorClassForGroup(groupInfo.color).split(' '))

    const icon = groupTitle.querySelector('span')
    icon.innerHTML = groupInfo.collapsed ? FOLDER_ICON : FOLDER_OPEN_ICON

    const title = groupTitle.querySelector('h2')
    title.innerHTML = `${groupInfo.title || 'Group'}`

    title.onblur = () => {
      title.contentEditable = false
      title.classList.add('truncate')
      chrome.tabGroups.update(groupId, { title: title.innerText })
    }
  })
}

function createTabElement (tab, container) {
  const tabElement = document.createElement('section')
  tabElement.dataset.tabId = tab.id
  tabElement.className = 'group flex items-center justify-between gap-2 p-2 rounded hover:bg-white/15 select-none transition-colors'
  if (tab.active) {
    tabElement.classList.add('bg-white/15')
  }
  if (tab.pinned) {
    tabElement.classList.add('bg-white/5')
  }
  tabElement.draggable = true

  if (tab['data-action']) {
    tabElement.dataset.action = tab['data-action']
  }

  const section = document.createElement('div')
  section.className = 'flex items-center gap-2 truncate'
  tabElement.appendChild(section)

  if (tab.pinned) {
    section.classList.add('w-full', 'justify-center')
  }

  if (tab.icon) {
    const icon = document.createElement('span')
    icon.innerHTML = tab.icon
    section.appendChild(icon)
  } else {
    const favicon = document.createElement('img')
    favicon.src = tab.favIconUrl || ''
    favicon.className = tab.pinned ? 'size-6' : 'size-4'
    section.appendChild(favicon)
  }

  if (!tab.pinned) {
    const title = document.createElement('span')
    title.innerText = tab.title
    title.className = 'truncate text-white mix-blend-difference'
    section.appendChild(title)

    if (!tab.icon) {
      const closeButton = document.createElement('button')
      closeButton.innerText = '✖'
      closeButton.className = 'hidden group-hover:grid place-content-center size-4 outline-none transition-all text-white mix-blend-difference'
      tabElement.appendChild(closeButton)

      closeButton.onclick = (e) => {
        e.stopPropagation()
        if (!tab.id) return
        chrome.tabs.remove(tab.id)
      }
    }
  }

  tabElement.onclick = async (event) => {
    event.stopPropagation()
    if (!tab.id) {
      const url = `${BROWSER}://newtab`
      await chrome.tabs.create({ url })
      return
    }
    chrome.tabs.update(tab.id, { active: true })
  }

  tabElement.onmousedown = (event) => {
    event.stopPropagation()
    if (event.button === 1) {
      if (!tab.id || tab.pinned) return
      chrome.tabs.remove(tab.id)
    }
  }

  tabElement.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', tab.id)
  })

  tabElement.addEventListener('dragover', (event) => {
    event.preventDefault()
  })

  tabElement.addEventListener('drop', async (event) => {
    event.preventDefault()
    const draggedTabId = event.dataTransfer.getData('text/plain')
    if (draggedTabId) {
      const tabs = await chrome.tabs.query({})
      const draggedTab = tabs.find(t => t.id === parseInt(draggedTabId))
      chrome.tabs.move(draggedTab.id, { index: tab.index })

      if (draggedTab.groupId !== tab.groupId) {
        chrome.tabs.group({ groupId: tab.groupId, tabIds: draggedTab.id })
      }
      if (draggedTab.pinned !== tab.pinned) {
        chrome.tabs.update(draggedTab.id, { pinned: tab.pinned })
      }
    }
  })

  if (tab.pinned) {
    const pinnedContainer = document.querySelector('#pinned')
    pinnedContainer.appendChild(tabElement)

    if (pinnedContainer.childElementCount >= 8) {
      pinnedContainer.classList.add('grid-cols-4')
      pinnedContainer.classList.remove('grid-flow-col', 'justify-stretch')
    } else {
      pinnedContainer.classList.remove('grid-cols-4')
      pinnedContainer.classList.add('grid-flow-col', 'justify-stretch')
    }
    return
  }

  const groupElement = container.querySelector(`[data-group-id="${tab.groupId}"]`)
  if (groupElement) {
    tabElement.classList.add('ml-3')
    groupElement.appendChild(tabElement)
    return
  }

  container.appendChild(tabElement)
}

function checkActiveTab () {
  chrome.windows.getCurrent({ populate: true }, (window) => {
    chrome.tabs.query({ windowId: window.id }, (tabs) => {
      tabs.forEach(tab => {
        const element = document.querySelector(`[data-tab-id="${tab.id}"]`)
        element?.classList.remove('bg-white/15')
        if (tab.active) {
          element?.classList.add('bg-white/15')
        }
      })
    })
  })
}

document.querySelectorAll('[data-action=new-tab]').forEach((element) => {
  element.onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    const url = element.dataset.url || `${BROWSER}://newtab`

    const newTab = await chrome.tabs.create({ url })

    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      chrome.tabs.group({ groupId: tab.groupId, tabIds: newTab.id })
    }
  }
})

document.querySelectorAll('[data-action=new-group]').forEach((element) => {
  element.onclick = async () => {
    chrome.tabs.create({}, (tab) => {
      chrome.tabs.group({ tabIds: [tab.id] }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: 'Group' })
      })
    })
  }
})

document.querySelectorAll('input[type="color"]').forEach((element) => {
  element.oninput = () => {
    document.body.style.backgroundColor = element.value
  }
})

function activeTabOrCreate (url) {
  chrome.windows.getCurrent({ populate: true }, (window) => {
    chrome.tabs.query({ url, windowId: window.id }, (tabs) => {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, { active: true })
      } else {
        chrome.tabs.create({ url, windowId: window.id })
      }
    })
  })
}

function getColorClassForGroup (color) {
  const colorClasses = {
    blue: 'bg-blue-200 text-blue-800',
    red: 'bg-red-200 text-red-800',
    yellow: 'bg-yellow-200 text-yellow-800',
    green: 'bg-green-200 text-green-800',
    pink: 'bg-pink-200 text-pink-800',
    purple: 'bg-purple-200 text-purple-800',
    cyan: 'bg-cyan-200 text-cyan-800',
    grey: 'bg-gray-200 text-gray-800'
  }
  return colorClasses[color] || 'bg-neutral-200 text-neutral-800'
}
