<script>
(function() {
if (document.querySelector('.nvgd-accordion-initialized')) return;
document.querySelector('.nvgd-product-accordion') && document.querySelector('.nvgd-product-accordion').classList.add('nvgd-accordion-initialized');

document.addEventListener('DOMContentLoaded', function() {
var navigateLinks = document.querySelectorAll('.nvgd-accordion-navigate');

navigateLinks.forEach(function(link) {
link.addEventListener('click', function(e) {
e.preventDefault();
var sectionName = this.getAttribute('data-section-name');
var targetSection = document.querySelector('[id*="' + sectionName + '"]');
if (targetSection) {
targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
history.pushState(null, null, '#' + sectionName);
}
});
});

var hash = window.location.hash.substring(1);
if (hash) {
var targetSection = document.querySelector('[id*="' + hash + '"]');
if (targetSection) {
setTimeout(function() {
targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 100);
}
}
});
})();
</script>
