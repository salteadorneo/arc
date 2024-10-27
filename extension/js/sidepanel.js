const FOLDER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>'
const FOLDER_OPEN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z"/></svg>'
const PLUS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke-width="1.5" color="currentColor" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M6 12h6m6 0h-6m0 0V6m0 6v6" /></svg>'

const GROUP_ACTIVE_CLASS = 'max-h-9'

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
  chrome.tabs.onRemoved.addListener((tabId) => {
    getTabs()
    addTabToArchive(tabId)
  })
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

let TABS = null

function getTabs () {
  chrome.windows.getCurrent({ populate: true }, (window) => {
    chrome.tabs.query({ windowId: window.id }, (tabs) => {
      TABS = tabs

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
          groupContainer.className = `flex flex-col gap-1 select-none cursor-default overflow-hidden transition-all min-h-9 ${GROUP_ACTIVE_CLASS}`

          groupContainer.onclick = () => {
            groupContainer.classList.toggle(GROUP_ACTIVE_CLASS)
            chrome.tabGroups.update(tab.groupId, { collapsed: groupContainer.classList.contains(GROUP_ACTIVE_CLASS) })
          }

          const groupTitle = document.createElement('section')
          groupTitle.className = 'group flex items-center justify-between gap-2 p-2 rounded select-none transition-colors text-sm font-medium'

          const icon = document.createElement('span')
          groupTitle.appendChild(icon)

          const title = document.createElement('h2')
          title.className = 'w-full outline-none truncate text-white mix-blend-difference'
          groupTitle.appendChild(title)

          title.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              title.blur()
            }
          })

          const editButton = document.createElement('button')
          editButton.innerHTML = 'Edit'
          editButton.className = 'hidden group-hover:grid place-content-center size-4 outline-none transition-all text-xs font-normal text-white mix-blend-difference'
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

      const hr = document.createElement('hr')
      hr.className = 'mix-blend-difference opacity-25'
      container.appendChild(hr)

      createTabElement({
        title: 'New Tab',
        icon: PLUS_ICON,
        'data-action': 'new-tab'
      }, container)

      checkButtonArchive()
    })
  })
}

function getGroupInfo (groupId) {
  chrome.tabGroups.get(groupId, (groupInfo) => {
    const container = document.querySelector(`[data-group-id="${groupId}"]`)

    if (!groupInfo.collapsed) {
      container.classList.remove(GROUP_ACTIVE_CLASS)
    }

    const groupTitle = container.querySelector('section')
    groupTitle.classList.add(`text-${groupInfo.color}-500`)

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

function createArchiveElement (tab, container) {
  if (!tab) return

  const tabElement = document.createElement('section')
  tabElement.dataset.tabId = tab.id
  tabElement.className = 'group flex items-center justify-between gap-2 p-2 rounded hover:bg-white/15 select-none transition-colors'

  const section = document.createElement('div')
  section.className = 'flex items-center gap-2 truncate'
  tabElement.appendChild(section)

  const favicon = document.createElement('img')
  favicon.src = tab.favIconUrl || ''
  favicon.className = tab.pinned ? 'size-6' : 'size-4'
  section.appendChild(favicon)

  const title = document.createElement('span')
  title.innerText = tab.title
  title.className = 'truncate text-white mix-blend-difference'
  section.appendChild(title)

  tabElement.onclick = (e) => {
    e.stopPropagation()
    chrome.tabs.create({ url: tab.url })
    removeTabFromArchive(tab.id)
    toggleArchive()
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

document.querySelectorAll('[data-action=archive]').forEach((element) => {
  element.onclick = toggleArchive
})

async function toggleArchive () {
  document.querySelector('#pinned').classList.toggle('hidden')
  document.querySelector('#tabs').classList.toggle('hidden')
  document.querySelector('#archive').classList.toggle('hidden')

  if (!document.querySelector('#archive').classList.contains('hidden')) {
    chrome.storage.local.get(['archive'], (result) => {
      const archive = result.archive || []
      document.querySelector('[data-action=archive]').disabled = !archive.length
      const container = document.querySelector('#archive')
      container.innerHTML = ''

      archive.forEach(tab => {
        createArchiveElement(tab, container)
      })

      const hr = document.createElement('hr')
      hr.className = 'mix-blend-difference opacity-25'
      container.appendChild(hr)

      const button = document.createElement('button')
      button.innerText = 'Clear Archive'
      button.className = 'group flex items-center justify-center gap-2 p-2 rounded hover:bg-white/15 select-none transition-colors'
      button.onclick = () => {
        clearArchive()
        document.querySelector('[data-action=archive]').disabled = true
        toggleArchive()
      }
      container.appendChild(button)
    })
  }
}

document.querySelectorAll('input[type="color"]').forEach((element) => {
  chrome.storage.local.get(['color'], (result) => {
    if (!result.color) return
    element.value = result.color
    document.body.style.backgroundColor = element.value
  })

  element.oninput = () => {
    document.body.style.backgroundColor = element.value
    chrome.storage.local.set({ color: element.value })
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

function addTabToArchive (tabId) {
  chrome.storage.local.get(['archive'], (result) => {
    const archive = result.archive || []
    archive.push(TABS.find(t => t.id === tabId))
    chrome.storage.local.set({ archive })
  })
}

function removeTabFromArchive (tabId) {
  chrome.storage.local.get(['archive'], (result) => {
    const archive = result.archive || []
    document.querySelector('[data-action=archive]').disabled = !archive.length
    chrome.storage.local.set({ archive: [...archive.filter(t => t.id !== tabId)] })
  })
}

function clearArchive () {
  chrome.storage.local.set({ archive: [] })
}

function checkButtonArchive () {
  chrome.storage.local.get(['archive'], (result) => {
    const archive = result.archive || []
    document.querySelector('[data-action=archive]').disabled = !archive.length
  })
}
