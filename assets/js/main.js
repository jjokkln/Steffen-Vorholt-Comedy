
const EVENTS = [
  {
    title: "Brain Loading – Die Comedy-Improshow",
    show: "Brain Loading",
    slug: "brain-loading",
    date: "2026-02-12",
    day: "12",
    month: "Feb 2026",
    time: "20:00",
    entry: "19:00",
    city: "Oberhausen",
    location: "Druckluft",
    provider: "Eventbrite",
    status: "archive",
    statusLabel: "Archiv",
    ticketUrl: "https://www.eventbrite.de/e/brain-loading-die-comedy-improshow-in-oberhausen-tickets-1597741952189",
    color: "green"
  },
  {
    title: "Brain Loading – Die beste Impro-Comedyshow in NRW",
    show: "Brain Loading",
    slug: "brain-loading",
    date: "2026-04-09",
    day: "09",
    month: "Apr 2026",
    time: "20:00",
    entry: "19:00",
    city: "Neuss",
    location: "Further Str. 127",
    provider: "Rausgegangen",
    status: "archive",
    statusLabel: "Archiv",
    ticketUrl: "https://t.rausgegangen.de/tickets/brain-loading-63",
    color: "green"
  },
  {
    title: "Brain Loading – nächster Termin",
    show: "Brain Loading",
    slug: "brain-loading",
    date: "",
    day: "—",
    month: "Admin",
    time: "",
    entry: "",
    city: "Bochum / Dortmund / Düsseldorf / Essen / Köln",
    location: "Location wird gepflegt",
    provider: "Externer Ticketanbieter",
    status: "draft",
    statusLabel: "Termin pflegen",
    ticketUrl: "",
    color: "green"
  },
  {
    title: "Comedy Eiskalt – Open Mic",
    show: "Comedy Eiskalt",
    slug: "comedy-eiskalt",
    date: "",
    day: "—",
    month: "Admin",
    time: "20:00",
    entry: "",
    city: "Bergisch Gladbach",
    location: "Eissportarena Bergisch Gladbach",
    provider: "Externer Ticketanbieter",
    status: "draft",
    statusLabel: "Termin pflegen",
    ticketUrl: "",
    color: "ice"
  },
  {
    title: "Comedy Check-In – Dein Boarding",
    show: "Comedy Check-In",
    slug: "comedy-check-in",
    date: "",
    day: "—",
    month: "Admin",
    time: "",
    entry: "",
    city: "NRW",
    location: "wechselnde Location",
    provider: "Externer Ticketanbieter",
    status: "draft",
    statusLabel: "Termin pflegen",
    ticketUrl: "",
    color: "orange"
  }
];

const SHOW_META = {
  "Brain Loading": { slug: "brain-loading", color: "green", label: "Impro-Comedy" },
  "Comedy Eiskalt": { slug: "comedy-eiskalt", color: "ice", label: "Open Mic" },
  "Comedy Check-In": { slug: "comedy-check-in", color: "orange", label: "Boarding-Show" }
};

function targetForEvent(e){
  return e.ticketUrl || (location.pathname.includes("/shows/") ? "../admin/termine.html" : "admin/termine.html");
}

function eventCard(e){
  const url = targetForEvent(e);
  return `
    <article class="card event-card" data-show="${e.show}" data-city="${e.city}">
      <div>
        <div class="event-top">
          <div>
            <h4>${e.title}</h4>
            <p>${e.show}<br>${e.city} · ${e.location}</p>
            <span class="status ${e.status}">${e.statusLabel}</span>
          </div>
          <div class="datebox"><strong>${e.day}</strong><span>${e.month}</span></div>
        </div>
      </div>
      <div>
        <p>${e.time ? "Showbeginn: " + e.time : "Uhrzeit wird gepflegt"}${e.entry ? " · Einlass: " + e.entry : ""}<br>${e.provider}</p>
        <a class="btn secondary" href="${url}" target="${e.ticketUrl ? "_blank" : "_self"}" rel="noreferrer">${e.ticketUrl ? "Ticketlink öffnen" : "Im Admin pflegen"}</a>
      </div>
    </article>`;
}

function filteredEventsFromContainer(container){
  const showOnly = container.dataset.showOnly;
  const statusOnly = container.dataset.statusOnly;
  let items = EVENTS;
  if(showOnly) items = items.filter(e => e.show === showOnly || e.slug === showOnly);
  if(statusOnly) items = items.filter(e => e.status === statusOnly);
  return items;
}

function renderEvents(limit){
  document.querySelectorAll("[data-events-grid]").forEach(grid => {
    let items = filteredEventsFromContainer(grid);
    if(typeof limit === "number" && !grid.dataset.noLimit) items = items.slice(0, limit);
    grid.innerHTML = items.length ? items.map(eventCard).join("") : `<div class="booking-empty">Noch keine Termine gepflegt.</div>`;
  });
}

function setupFilters(){
  const filterWrap = document.querySelector("[data-filters]");
  const grid = document.querySelector("[data-events-grid]");
  if(!filterWrap || !grid) return;
  filterWrap.addEventListener("click", e => {
    const btn = e.target.closest("[data-filter]");
    if(!btn) return;
    filterWrap.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    grid.innerHTML = EVENTS
      .filter(ev => filter === "all" || ev.show === filter || ev.city.includes(filter))
      .map(eventCard)
      .join("");
  });
}

function bookingRow(e){
  const url = targetForEvent(e);
  return `
  <article class="booking-row">
    <div class="booking-date"><strong>${e.day}</strong><span>${e.month}</span></div>
    <div>
      <h4>${e.title}</h4>
      <p>${e.show} · ${e.city} · ${e.location}</p>
      <span class="status ${e.status}">${e.statusLabel}</span>
    </div>
    <a class="btn secondary" href="${url}" target="${e.ticketUrl ? "_blank" : "_self"}" rel="noreferrer">${e.ticketUrl ? "Tickets" : "Pflegen"}</a>
  </article>`;
}

function renderBookingList(){
  document.querySelectorAll("[data-booking-list]").forEach(list => {
    const showOnly = list.dataset.showOnly;
    let items = EVENTS;
    if(showOnly) items = items.filter(e => e.show === showOnly || e.slug === showOnly);
    list.innerHTML = items.length ? items.map(bookingRow).join("") : `<div class="booking-empty">Noch keine Termine für diese Show gepflegt.</div>`;
  });
}

function renderSummary(){
  const el = document.querySelector("[data-booking-summary]");
  if(!el) return;
  const shows = ["Brain Loading","Comedy Eiskalt","Comedy Check-In"];
  el.innerHTML = shows.map(show => {
    const count = EVENTS.filter(e => e.show === show).length;
    const meta = SHOW_META[show];
    return `<a class="summary-card" href="shows/${meta.slug}-termine.html"><strong>${count}</strong><span>${show}<br>${meta.label}</span></a>`;
  }).join("");
}

function renderCalendar(){
  const grid = document.querySelector("[data-calendar-grid]");
  if(!grid) return;

  const cells = [
    "", "", "", "", "", "", "01",
    "02", "03", "04", "05", "06", "07", "08",
    "09", "10", "11", "12", "13", "14", "15",
    "16", "17", "18", "19", "20", "21", "22",
    "23", "24", "25", "26", "27", "28", "29",
    "30", "31", "", "", "", "", ""
  ];

  const eventByDay = {};
  EVENTS.forEach(e => {
    if(!e.date) return;
    const day = e.date.slice(-2);
    eventByDay[day] = eventByDay[day] || [];
    eventByDay[day].push(e);
  });

  grid.innerHTML = `
    ${["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => `<div class="calendar-weekday">${d}</div>`).join("")}
    ${cells.map(day => {
      const items = day && eventByDay[day] ? eventByDay[day] : [];
      return `<div class="calendar-cell ${day ? "" : "dim"}">
        <div class="calendar-cell-number">${day}</div>
        ${items.map(e => `<a class="calendar-event ${e.color}" href="${targetForEvent(e)}" target="${e.ticketUrl ? "_blank" : "_self"}">${e.show}<br>${e.city}</a>`).join("")}
      </div>`;
    }).join("")}
  `;
}

function fakeSubmit(message){
  alert(message + " – final: Supabase speichern + E-Mail senden.");
}

function setupHeroLayoutToggle(){
  const hero = document.querySelector("[data-home-hero]");
  const toggle = document.querySelector("[data-hero-layout-toggle]");
  if(!hero || !toggle) return;

  const buttons = [...toggle.querySelectorAll("[data-hero-mode]")];
  const storageKey = "homeHeroMode";

  function applyMode(mode, persist = false){
    const nextMode = mode === "full" ? "full" : "card";
    hero.classList.toggle("is-full-video", nextMode === "full");
    buttons.forEach(button => {
      const isActive = button.dataset.heroMode === nextMode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if(persist){
      try{
        localStorage.setItem(storageKey, nextMode);
      }catch(error){
        // The comparison still works when browser storage is unavailable.
      }
    }
  }

  let savedMode = "card";
  try{
    savedMode = localStorage.getItem(storageKey) || "card";
  }catch(error){
    savedMode = "card";
  }
  applyMode(savedMode);

  toggle.addEventListener("click", event => {
    const button = event.target.closest("[data-hero-mode]");
    if(!button) return;
    applyMode(button.dataset.heroMode, true);
  });
}

renderEvents();
setupFilters();
renderBookingList();
renderSummary();
renderCalendar();
setupHeroLayoutToggle();
