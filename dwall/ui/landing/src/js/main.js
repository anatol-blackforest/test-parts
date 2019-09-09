document.addEventListener("DOMContentLoaded", detectBrowser);

window.addEventListener('scroll', stickyHeader);

var globalScroll = 0;

function stickyHeader() {
  var header = document.getElementById('nav-header');
  var scroll = typeof window.scrollY === 'undefined' ? window.pageYOffset : window.scrollY;
  var headerHeight = 72;

  if (scroll > headerHeight && scroll <= globalScroll) {
    header.style.animation = 'slidein 0.5s';
    header.style.top = 0;
    header.classList.add('sticky');

  } else if (scroll > globalScroll && scroll > headerHeight) {
    header.style.animation = 'slideout 0.4s';
    header.style.top = '-200px';

  } else {
    header.style.animation = 'slideout 0.4s';
    header.style.top = 0;
    header.classList.remove('sticky');
  }

  globalScroll = scroll;
}

function submitRequestForDWallToUse(event) {
  event.preventDefault();
  var http = new XMLHttpRequest();
  http.open('POST', '/getDwall', true);
  http.setRequestHeader('Content-type', 'application/json');
  var params = {
    email: event.target.elements.email.value,
    name: event.target.elements.name.value
  }
  http.send(JSON.stringify(params));
  http.onload = function () {
    alert(http.responseText);
  }
  event.target.reset();
}

scrollToGetDWall = function (event) {
  event.preventDefault();
  document.getElementById('tryDWall').scrollIntoView(true);
};

function detectBrowser() {
  var ua = window.navigator.userAgent;

  if (ua.indexOf('Trident/') !== -1) {
    var b = document.getElementsByTagName('body')[0];
    b.classList.add('ie');
  }
}
