window.addEventListener("DOMContentLoaded", function () {
  var hash = location.hash;
  if (hash) {
    location.hash = "";
    location.hash = hash;
  }
});
