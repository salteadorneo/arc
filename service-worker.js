chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`)

  if (command === 'open') {
    chrome.windows.getCurrent({ populate: true }, (window) => {
      chrome.sidePanel.open({ windowId: window.id })
    })
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id
    if (!tabId) return
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['js/openbar.js']
    })
  })
})
