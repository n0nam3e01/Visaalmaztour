import { consultationUrl, mapsApiUrl } from './contact.mjs';
import { createMotion } from './motion.mjs';

const $ = selector => document.querySelector(selector);
const motion = createMotion();
const countryData = {
  schengen: {
    label: 'Шенген', eyebrow: 'Поездки в Европу',
    description: 'Расскажите, в какие страны едете и с какой целью. Поможем подготовить документы для вашей подачи на шенгенскую визу.',
    services: ['Составим список документов для вашей поездки', 'Поможем заполнить анкету', 'Проверим данные и комплект перед подачей', 'Объясним дальнейшие шаги'],
  },
  usa: {
    label: 'США', eyebrow: 'Поездки в США',
    description: 'Разберём цель поездки и вашу ситуацию. Поможем с анкетой DS-160 и подготовкой к собеседованию.',
    services: ['Обсудим планы и визовую историю', 'Поможем заполнить DS-160', 'Проверим корректность данных', 'Подготовим к этапам подачи и собеседованию'],
  },
  japan: {
    label: 'Япония', eyebrow: 'Поездки в Японию',
    description: 'Помогаем с документами для личных и групповых поездок. Уточним ваши планы и объясним порядок подачи.',
    services: ['Обсудим поездку и состав заявителей', 'Поможем собрать документы', 'Проверим анкету и данные', 'Ответим на вопросы перед подачей'],
  },
};

const menuButton = $('.menu-toggle');
const menu = $('#navigation');
function closeMenu() {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}
menuButton.addEventListener('click', event => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menu.classList.toggle('open', open);
  if (open && event.detail !== 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    menu.animate([{ opacity: 0, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' });
  }
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); menuButton.focus(); }
});
matchMedia('(min-width:900px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const pill = menu.querySelector('.nav-active-pill');
const navLinks = [...menu.querySelectorAll('a')];
let activeLink = null;
function positionPill(link) {
  activeLink = link;
  navLinks.forEach(item => item.toggleAttribute('data-active', item === link));
  navLinks.forEach(item => item === link ? item.setAttribute('aria-current', 'location') : item.removeAttribute('aria-current'));
  if (!link || !menu.offsetWidth) { pill.style.opacity = '0'; return; }
  pill.style.width = link.offsetWidth + 'px';
  pill.style.transform = 'translateX(' + (link.offsetLeft - 5) + 'px)';
  pill.style.opacity = '1';
}
const visibleSections = new Map();
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => visibleSections.set(entry.target.id, entry.isIntersecting));
  const link = navLinks.find(item => visibleSections.get(item.hash.slice(1)));
  positionPill(link || null);
}, { rootMargin: '-18% 0px -55% 0px', threshold: 0 });
navLinks.forEach(link => {
  const section = document.querySelector(link.hash);
  if (section) sectionObserver.observe(section);
  link.addEventListener('click', () => positionPill(link));
});
new ResizeObserver(() => { if (activeLink) positionPill(activeLink); }).observe(menu);

const countryDialog = $('#country-dialog');
document.querySelectorAll('[data-country]').forEach(button => button.addEventListener('click', event => {
  const data = countryData[button.dataset.country];
  $('#country-title').textContent = 'Виза: ' + data.label;
  $('#country-eyebrow').textContent = data.eyebrow;
  $('#country-description').textContent = data.description;
  $('#country-services').replaceChildren(...data.services.map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  $('#country-cta').href = consultationUrl(data.label);
  motion.openDialog(countryDialog, event);
}));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', event => motion.closeDialog(dialog, { instant: event.detail === 0 }));
  dialog.addEventListener('cancel', event => { event.preventDefault(); motion.closeDialog(dialog, { instant: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) motion.closeDialog(dialog);
  });
});
document.querySelectorAll('.privacy-open').forEach(button => button.addEventListener('click', event => motion.openDialog($('#privacy-dialog'), event)));
document.querySelectorAll('[data-whatsapp]').forEach(link => { link.href = consultationUrl(); });

const form = $('#lead-form');
const nameInput = $('#client-name');
const destinationInput = $('#lead-destination');
const messageInput = $('#whatsapp-message');
function updateDraft() {
  nameInput.setCustomValidity('');
  const name = nameInput.value.trim();
  const details = name ? 'Меня зовут ' + name + '.' : '';
  messageInput.value = new URL(consultationUrl(destinationInput.value === 'Пока выбираю' ? '' : destinationInput.value, details)).searchParams.get('text');
}
nameInput.addEventListener('input', updateDraft);
destinationInput.addEventListener('change', updateDraft);
form.addEventListener('submit', event => {
  updateDraft();
  if (nameInput.value.trim().length < 2) {
    event.preventDefault();
    nameInput.setCustomValidity('Введите имя, чтобы мы знали, как к вам обращаться.');
    nameInput.reportValidity();
  }
});
$('#quick-consult').addEventListener('click', event => {
  destinationInput.value = $('#quick-destination').value || 'Пока выбираю';
  updateDraft();
  motion.scrollTo($('#consultation'), { instant: event.detail === 0, onComplete: () => nameInput.focus({ preventScroll: true }) });
});
updateDraft();
$('#year').textContent = String(new Date().getFullYear());

async function configureMap() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return;
    const config = await response.json();
    const src = mapsApiUrl(config.googleMapsKey || '');
    if (!src) return;
    window.initVisaMap = async () => {
      try {
        const { Map } = await google.maps.importLibrary('maps');
        const { Geocoder } = await google.maps.importLibrary('geocoding');
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
        const result = await new Geocoder().geocode({ address: 'БЦ Каскад, проспект Кабанбай Батыра 6/1, Астана, Казахстан' });
        if (!result.results?.[0]) return;
        const position = result.results[0].geometry.location;
        const element = $('#api-map'); element.hidden = false;
        const map = new Map(element, { center: position, zoom: 16, mapId: 'DEMO_MAP_ID', mapTypeControl: false, streetViewControl: false });
        new AdvancedMarkerElement({ map, position, title: 'Visa Almaz Tour · БЦ Kaskad · офис 51/5' });
        $('#map-embed').hidden = true;
      } catch { $('#api-map').hidden = true; $('#map-embed').hidden = false; }
    };
    const script = document.createElement('script'); script.src = src; script.async = true; document.head.append(script);
  } catch { /* The embedded map works independently of the optional JavaScript API. */ }
}
configureMap();
