chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open') {
    chrome.windows.getCurrent({ populate: true }, (window) => {
      chrome.sidePanel.open({ windowId: window.id })
    })
  }

  if (command === 'toolbar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (!tabId) return

      chrome.scripting.executeScript({
        target: { tabId },
        files: ['js/toolbar-open.js']
      })
    })
  }
})
