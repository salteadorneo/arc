const search = document.createElement('search')
search.onclick = () => {
  search.style.display = 'none'
  search.style.opacity = 0
}

const form = document.createElement('form')
form.name = 'search'
form.onsubmit = event => event.preventDefault()

const input = document.createElement('input')
input.name = 'query'
input.placeholder = 'Search'
input.type = 'search'
input.autocomplete = 'off'
input.spellcheck = false

input.onclick = event => event.stopPropagation()

input.addEventListener('keydown', async event => {
  if (event.key === 'Escape') {
    search.style.display = 'none'
  }
  if (event.key === 'Enter') {
    let query = input.value
    if (isDomain(query)) {
      query = query.startsWith('http') ? query : `https://${query}`
      window.open(query, '_blank')
    } else if (query.startsWith('youtube')) {
      query = query.replace('youtube', '').trim()
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank')
    } else {
      window.open(`https://www.google.com/search?q=${query}`, '_blank')
    }
    search.style.display = 'none'
    search.style.opacity = 0
  }
})

form.append(input)

search.append(form)

document.body.prepend(search)

function isDomain (url) {
  const re = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}$|^www\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,6}$|^http/
  return re.test(url)
}
