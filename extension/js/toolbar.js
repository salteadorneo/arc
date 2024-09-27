const toolbar = document.createElement('toolbar')

toolbar.style.color = window.getComputedStyle(document.body).color || 'black'
toolbar.style.backgroundColor = window.getComputedStyle(document.body).backgroundColor || 'white'

const navigation = document.createElement('nav')

const back = document.createElement('button')
back.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='currentColor'><path d='m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z' /></svg>"
back.onclick = () => window.history.back()
navigation.append(back)

const forward = document.createElement('button')
forward.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='currentColor'><path d='M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z' /></svg>"
forward.onclick = () => window.history.forward()
navigation.append(forward)

const refresh = document.createElement('button')
refresh.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='currentColor'><path d='M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z' /></svg>"
refresh.onclick = () => window.location.reload()
navigation.append(refresh)

toolbar.append(navigation)

const url = document.createElement('a')
url.href = window.location.href
url.innerText = parseDomain(window.location.hostname)

url.style.color = window.getComputedStyle(document.body).color || 'black'

toolbar.append(url)

const empty = document.createElement('div')
toolbar.append(empty)

document.body.prepend(toolbar)

function parseDomain (domain) {
  if (domain.startsWith('www.')) {
    domain = domain.slice(4)
  }
  return domain
}
