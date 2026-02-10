(function() {
  var isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';
  var isLangSwitch = sessionStorage.getItem('remontco_lang_switch');
  
  if (isLangSwitch) {
    sessionStorage.removeItem('remontco_lang_switch');
  } else if (!isHomepage) {
    var navEntries = performance.getEntriesByType('navigation');
    var isReload = navEntries.length > 0 && navEntries[0].type === 'reload';
    
    if (isReload) {
      window.location.replace('/index.html');
    }
  }
})();
