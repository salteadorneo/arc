let currentTabs

function init() {
    loadOpenTabs();

    chrome.tabs.onCreated.addListener(loadOpenTabs);
    chrome.tabs.onMoved.addListener(loadOpenTabs);
    chrome.tabs.onRemoved.addListener(loadOpenTabs);
    chrome.tabs.onUpdated.addListener((a) => {
        loadOpenTabs()
        checkActiveTab()
    });
    chrome.tabs.onDetached.addListener(loadOpenTabs);
    chrome.tabs.onActivated.addListener(checkActiveTab);

    chrome.tabGroups.onCreated.addListener(loadOpenTabs)
    chrome.tabGroups.onMoved.addListener(loadOpenTabs)
    chrome.tabGroups.onRemoved.addListener(loadOpenTabs)
    chrome.tabGroups.onUpdated.addListener((group) => getGroupInfo(group.id))
}

init();

const ACTIVE_TAB = ['bg-neutral-300', 'dark:bg-neutral-800']

const chromeButtons = document.querySelectorAll("[data-chrome]");
const chromeButtonsUrl = []
chromeButtons.forEach((element) => {
    chromeButtonsUrl.push(`chrome://${element.dataset.chrome}`)

    element.onclick = () => {
        activeTabOrCreate(`chrome://${element.dataset.chrome}/`)
    };
});

function loadOpenTabs() {
    chrome.tabs.query({}, (tabs) => {
        currentTabs = tabs

        const container = document.querySelector('#tabs-container');
        container.innerHTML = '';

        const pinnedContainer = document.querySelector('#pinned');
        pinnedContainer.innerHTML = '';

        const groups = []

        tabs.forEach(tab => {
            if (chromeButtonsUrl.find(url => tab.url.startsWith(url))) {
                return
            }
            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && !groups.includes(tab.groupId)) {
                groups.push(tab.groupId)

                const groupContainer = document.createElement('section');
                groupContainer.dataset.groupId = tab.groupId;
                groupContainer.className = 'select-none cursor-default';

                const groupTitle = document.createElement('h2');
                groupContainer.appendChild(groupTitle);

                container.appendChild(groupContainer);

                getGroupInfo(tab.groupId)
            }
            createTabElement(tab, container);
        })
    });
}

function getGroupInfo(groupId) {
    chrome.tabGroups.get(groupId, (groupInfo) => {
        const container = document.querySelector(`[data-group-id="${groupId}"]`);
        const groupTitle = container.querySelector('h2');
        groupTitle.className = `flex items-center gap-2 text-sm font-bold mb-1 px-2 py-1 rounded transition-colors ${getColorClassForGroup(groupInfo.color)}`;
        const icon = '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z"/></svg>'
        //'<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>'
        groupTitle.innerHTML = `${icon} ${groupInfo.title || 'Group'}`;
    });
}

function createTabElement(tab, container) {
    const tabElement = document.createElement('section');
    tabElement.dataset.tabId = tab.id;
    tabElement.className = `group flex items-center justify-between gap-2 p-2 rounded hover:bg-neutral-400 dark:hover:bg-neutral-900 select-none transition-colors ${tab.active && { ...ACTIVE_TAB }}`;
    tabElement.draggable = true;

    const section = document.createElement('div');
    section.className = 'flex items-center gap-2 truncate';

    const favicon = document.createElement('img');
    favicon.src = tab.favIconUrl || '';
    favicon.className = tab.pinned ? 'w-6 h-6' : 'w-4 h-4';
    section.appendChild(favicon);

    if (!tab.pinned) {
        const title = document.createElement('span');
        title.innerText = tab.title;
        title.className = 'truncate';
        section.appendChild(title);
    }

    tabElement.appendChild(section);

    const closeButton = document.createElement('span');
    closeButton.innerText = '✖';
    closeButton.className = 'hidden group-hover:grid place-content-center w-4 h-4 select-none';

    closeButton.onclick = (event) => {
        event.stopPropagation();
        chrome.tabs.remove(tab.id);
    };

    if (!tab.pinned) {
        tabElement.appendChild(closeButton);
    }

    tabElement.onclick = () => {
        chrome.tabs.update(tab.id, { active: true });
    };

    tabElement.onmousedown = (event) => {
        if (event.button === 1) {
            chrome.tabs.remove(tab.id);
        }
    };

    tabElement.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', tab.id);
    });

    tabElement.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    tabElement.addEventListener('drop', (event) => {
        event.preventDefault();
        const draggedTabId = event.dataTransfer.getData('text/plain');
        if (draggedTabId) {
            const draggedTab = currentTabs.find(t => t.id === parseInt(draggedTabId));
            chrome.tabs.move(draggedTab.id, { index: tab.index });
        }
    });

    if (tab.pinned) {
        const pinnedContainer = document.querySelector('#pinned');
        pinnedContainer.appendChild(tabElement);
        return
    }

    const groupElement = container.querySelector(`[data-group-id="${tab.groupId}"]`);
    if (groupElement) {
        tabElement.classList.add('ml-3');
        groupElement.appendChild(tabElement);
        return
    }

    container.appendChild(tabElement);
}

function checkActiveTab() {
    chrome.tabs.query({}, (tabs) => {
        currentTabs = tabs
        tabs.forEach(tab => {
            const element = document.querySelector(`[data-tab-id="${tab.id}"]`);
            element?.classList.remove(...ACTIVE_TAB);
            if (tab.active) {
                element?.classList.add(...ACTIVE_TAB);
            }
        })
    });
}

document.querySelectorAll("[data-action=new-tab]").forEach((element) => {
    element.onclick = () => {
        chrome.tabs.create({});
    };
});

function activeTabOrCreate(url) {
    chrome.tabs.query({ url }, (tabs) => {
        if (tabs.length) {
            chrome.tabs.update(tabs[0].id, { active: true });
        } else {
            chrome.tabs.create({ url });
        }
    });
}

function getColorClassForGroup(color) {
    const colorClasses = {
        'blue': 'bg-blue-200 text-blue-800',
        'red': 'bg-red-200 text-red-800',
        'yellow': 'bg-yellow-200 text-yellow-800',
        'green': 'bg-green-200 text-green-800',
        'pink': 'bg-pink-200 text-pink-800',
        'purple': 'bg-purple-200 text-purple-800',
        'cyan': 'bg-cyan-200 text-cyan-800',
        'grey': 'bg-gray-200 text-gray-800'
    };
    return colorClasses[color] || 'bg-neutral-200 text-neutral-800';
}

// function openNewTab(url) {
//     if (!url.startsWith('http')) {
//         url = 'http://' + url;
//     }
//     chrome.tabs.create({ url: url });
// }

// const urlInput = document.getElementById('url-input');
// const goButton = document.getElementById('go-btn');
// const suggestionsContainer = document.getElementById('suggestions');

// goButton.onclick = () => {
//     openNewTab(urlInput.value);
//     suggestionsContainer.innerHTML = '';
// };

// function fetchHistory(query, callback) {
//     chrome.history.search({ text: query, maxResults: 5 }, callback);
// }

// function updateAutocomplete() {
//     const query = urlInput.value;
//     if (!query) {
//         suggestionsContainer.innerHTML = '';
//         return;
//     }

//     fetchHistory(query, (results) => {
//         suggestionsContainer.innerHTML = '';

//         results.forEach((result) => {
//             const suggestion = document.createElement('div');
//             suggestion.className = 'suggestion';
//             suggestion.innerText = `${result.title} - ${result.url}`;
//             suggestion.onclick = () => {
//                 urlInput.value = result.url;
//                 openNewTab(result.url);
//                 suggestionsContainer.innerHTML = '';
//             };
//             suggestionsContainer.appendChild(suggestion);
//         });
//     });
// }

// function setupAutocomplete() {
//     urlInput.addEventListener('input', updateAutocomplete);
//     urlInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') {
//             openNewTab(urlInput.value);
//             suggestionsContainer.innerHTML = '';
//         }
//     });
// }
// setupAutocomplete();