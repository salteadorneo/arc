if (document.querySelector('search')) {
  if (!document.querySelector('search').style.display || document.querySelector('search').style.display === 'none') {
    document.querySelector('search').style.display = 'grid'
    document.querySelector('search').style.opacity = 1
    document.querySelector('search input').focus()
  } else {
    document.querySelector('search').style.display = 'none'
    document.querySelector('search').style.opacity = 0
  }
}
