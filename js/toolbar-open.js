if (document.querySelector('toolbar')) {
  if (!document.querySelector('toolbar').style.maxHeight || document.querySelector('toolbar').style.maxHeight === '0px') {
    document.querySelector('toolbar').style.maxHeight = '50px'
  } else {
    document.querySelector('toolbar').style.maxHeight = '0px'
  }
}
