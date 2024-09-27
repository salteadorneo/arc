if (document.querySelector('toolbar')) {
  if (document.querySelector('toolbar').clientHeight === 0) {
    document.querySelector('toolbar').style.maxHeight = '500px'
  } else {
    document.querySelector('toolbar').style.maxHeight = '0px'
  }
}
