/* ============================================================
   BLAIR · Black LA AI & Intelligence Resource
   The Captain for blacklatechweek.com

   Drop-in. Adds one <div id="blair-root"> to the end of <body>
   and touches nothing else on the page. No dependencies, no
   build step, no framework.

   Install:
     <link rel="stylesheet" href="/assets/blair/blair.css">
     <script defer src="/assets/blair/blair.js"></script>

   Optional configuration — set before the script runs:
     window.BLAIR_BASE       "/assets/blair/"  where voice-map.json lives
     window.BLAIR_LIVE_VOICE true              generate speech on demand
     window.BLAIR_SPEAK_URL  "/api/speak"      the TTS endpoint
     window.BLAIR_VOICE_MAP  { key: url }      pre-recorded lines
     window.BLAIR_ON_LEAD    fn(entry)         called when someone signs up

   BLAIR stores nothing. Names typed into her live in memory for
   the length of the visit and are gone on refresh — she points
   people at the site's own mailing list rather than collecting
   anything herself.
   ============================================================ */
(function () {
"use strict";

if (document.getElementById("blair-root")) return;          // already mounted

var CFG = {
  base:  window.BLAIR_BASE || "/assets/blair/",
  live:  !!window.BLAIR_LIVE_VOICE,
  speak: window.BLAIR_SPEAK_URL || "/api/speak"
};

/* ---------- the display face, only if the page hasn't already got it ---------- */
(function () {
  try {
    if (document.querySelector('link[href*="Michroma"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Michroma&display=swap";
    document.head.appendChild(l);
  } catch (e) {}
})();

/* =========================================================
   MARKUP
   ========================================================= */
var MIC_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/></svg>';
var SEND_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></svg>';

var root = document.createElement("div");
root.id = "blair-root";
root.innerHTML =
  '<div class="blair-dock" id="blair-dock" data-size="small">' +
    '<button class="blair-launcher" id="blair-launcher" type="button" aria-expanded="false" aria-controls="blair-panel">' +
      '<span class="blair-pill">Questions? Ask BLAIR</span>' +
      '<span class="blair-orb"><span class="blair-ring"></span><span class="blair-ring"></span><span class="blair-ring"></span><b>B</b></span>' +
    '</button>' +
    '<section class="blair-panel" id="blair-panel" aria-label="Chat with BLAIR" hidden>' +
      '<header class="blair-head">' +
        '<div>' +
          '<span class="blair-name">BLAIR</span>' +
          '<span class="blair-role">Black L.A. Tech Week &middot; Captain</span>' +
        '</div>' +
        '<div class="blair-ctl">' +
          '<button class="blair-btn" id="blair-voice" type="button" aria-pressed="false" title="Read replies aloud">&#128266; Voice</button>' +
          '<button class="blair-btn" id="blair-expand" type="button" title="Expand" aria-label="Expand">&#10530;</button>' +
          '<button class="blair-btn" id="blair-close" type="button" title="Close" aria-label="Close">&#10005;</button>' +
        '</div>' +
      '</header>' +
      '<div class="blair-log" id="blair-log" role="log" aria-live="polite" aria-label="Conversation with BLAIR"></div>' +
      '<div class="blair-chips" id="blair-chips"></div>' +
      '<p class="blair-prov">Everything BLAIR says comes from what Black L.A. Tech Week has published. For the deeper read, <a href="#organizations">meet the twelve orgs</a>.<span id="blair-vsrc" class="blair-vsrc" hidden></span></p>' +
      '<form class="blair-ask" id="blair-ask">' +
        '<input id="blair-input" class="blair-input" type="text" autocomplete="off" placeholder="Ask BLAIR anything&hellip;" aria-label="Ask BLAIR">' +
        '<button class="blair-icon" id="blair-mic" type="button" title="Speak your question" aria-label="Speak your question" hidden>' + MIC_SVG + '</button>' +
        '<button class="blair-icon send" id="blair-send" type="submit" title="Send" aria-label="Send">' + SEND_SVG + '</button>' +
      '</form>' +
    '</section>' +
  '</div>';
document.body.appendChild(root);

var $ = function (id) { return document.getElementById(id); };

/* =========================================================
   DATA — the twelve orgs and the people who run them,
   as published on blacklatechweek.com
   ========================================================= */
var ORGS = [
  ["Hidden Genius Project","Training and mentoring young Black men in software and entrepreneurship","https://www.hiddengeniusproject.org/"],
  ["TEC Leimert","Leimert Park's tech and entrepreneurship center","https://www.tecleimert.org/"],
  ["Out of Office","Community and travel for Black creatives and technologists","https://www.takemeoutofoffice.com/"],
  ["Black Professional Network LA","Professional network for Black talent across LA","https://mybpn.org/losangeles/"],
  ["NSBE LA","National Society of Black Engineers, LA chapter","https://www.nsbeprola.org/"],
  ["Black Education Expo","College and career pathways for Black students","https://www.blackeducationexpo.com/"],
  ["We Are Science","STEM access and science literacy programming","http://wearescience.org"],
  ["Paradym","Design and creative practice","https://paradym.myportfolio.com/work"],
  ["Ocean AI","AI and lifestyle programming","https://www.oceanlifestyle.org/"],
  ["The Gathering Spot","Members' club and cultural hub","https://thegatheringspot.place/"],
  ["K-Scope","AI products and tooling","https://www.kscope.ai/"],
  ["Genfinity","Cybersecurity training and services","https://genfinitycyber.com"]
];

var ORG_TAGS = {
  "Hidden Genius Project":["youth","students","engineering","entrepreneurship","mentorship","training"],
  "TEC Leimert":["entrepreneurship","community","workspace","local","training"],
  "Out of Office":["creative","community","networking","design"],
  "Black Professional Network LA":["career","networking","professional","hiring","mentorship"],
  "NSBE LA":["engineering","students","career","networking"],
  "Black Education Expo":["students","youth","education","career"],
  "We Are Science":["science","education","youth","students"],
  "Paradym":["design","creative","product"],
  "Ocean AI":["ai","creative","community","product"],
  "The Gathering Spot":["networking","community","professional","entrepreneurship"],
  "K-Scope":["ai","product","engineering","entrepreneurship"],
  "Genfinity":["cybersecurity","training","career","engineering"]
};

var ORG_LIST = ORGS.map(function (o) {
  return '<li><a href="' + o[2] + '" target="_blank" rel="noopener">' + o[0] + '</a> — ' + o[1] + '</li>';
}).join("");

function orgByName(n) {
  for (var i = 0; i < ORGS.length; i++) { if (ORGS[i][0] === n) return ORGS[i]; }
  return null;
}

/* An org's FIRST tag is what it is primarily for, so it scores higher —
   "engineering" leads with NSBE rather than a youth programme that also
   happens to teach engineering. */
function routeOrgs(tags, n) {
  if (!tags || !tags.length) return [];
  var scored = [];
  for (var name in ORG_TAGS) {
    var t = ORG_TAGS[name], s = 0;
    for (var i = 0; i < tags.length; i++) {
      if (t.indexOf(tags[i]) > -1) s += (t[0] === tags[i]) ? 3 : 1;
    }
    if (s > 0) scored.push({ name: name, s: s });
  }
  scored.sort(function (a, b) { return b.s - a.s; });
  return scored.slice(0, n || 3).map(function (x) { return orgByName(x.name); }).filter(Boolean);
}

function orgLines(list) {
  if (!list.length) return "";
  return "<ul>" + list.map(function (o) {
    return '<li><a href="' + o[2] + '" target="_blank" rel="noopener">' + o[0] + '</a> — ' + o[1] + '</li>';
  }).join("") + "</ul>";
}

/* =========================================================
   KNOWLEDGE BASE
   Only what the site actually publishes. Where the site is
   silent, BLAIR says so instead of filling the gap.
   ========================================================= */
var KB = [
  { id:"dates",
    k:["when","date","dates","2026","next","happening","time of year","schedule","upcoming"],
    a:'<p>The 2025 edition — the first one — ran <b>October 12–16, 2025</b>, and registration for all of it is closed.</p><p>The site is currently showing <b>OCT 12–18</b> without a year attached. I won\'t guess whether that\'s next year\'s window until it\'s announced properly.</p>',
    c:["What happened each night?","Where is it held?","How do I get involved?"] },

  { id:"where",
    k:["where","venue","address","location","adams","held","place","neighborhood","west adams"],
    a:'<p>All four 2025 nights ran out of <b>5211 W Adams Blvd, Los Angeles, CA 90016</b> — West Adams, a few minutes from Leimert Park.</p><p class="k">The venue name isn\'t published; the address is the address.</p>',
    c:["How do I get there?","What happened each night?","Who runs this?"] },

  { id:"travel",
    k:["parking","park","transit","metro","bus","drive","uber","lyft","getting there","how do i get there","rideshare","train"],
    a:'<p>Nothing about parking or transit is published, so I won\'t make it up.</p><p>What I can tell you: the address is <b>5211 W Adams Blvd, 90016</b>, in West Adams. Plan around it the way you\'d plan any West Adams evening — and check <a href="https://www.instagram.com/blacklatechweek/" target="_blank" rel="noopener">Instagram</a> closer to the date, which is where logistics get posted.</p>',
    c:["Where is it held?","When is the next one?"] },

  { id:"access",
    k:["accessible","accessibility","wheelchair","ada","disability","asl","interpreter","captions","mobility"],
    a:'<p>No accessibility information is published on the site — I\'d rather say that plainly than guess at it.</p><p>For a real answer, ask the organizers directly on <a href="https://www.instagram.com/blacklatechweek/" target="_blank" rel="noopener">Instagram</a> or <a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a>. It\'s a fair question and it should be on the site.</p>',
    c:["How do I contact them?","Where is it held?"] },

  { id:"program",
    k:["event","events","program","lineup","night","nights","sessions","agenda","happened","2025","what was","talks","workshops"],
    a:'<p>Four nights, four different doors:</p><ul><li><b>Mon Oct 13</b> — Black L.A. Mixer · 6–10 PM</li><li><b>Tue Oct 14</b> — Engineering the Future · 6–10 PM</li><li><b>Wed Oct 15</b> — Breaking into IT &amp; Cybersecurity · 7–11 PM</li><li><b>Thu Oct 16</b> — Tech Unplugged · 7–11 PM</li></ul><p class="k">2,000+ people across the week. No session descriptions or speaker lists were published for any of them.</p>',
    c:["Show me photos","Which night was for me?","When is the next one?"] },

  { id:"orgs",
    k:["org","orgs","organization","organizations","coalition","directory","member","members","community","twelve"],
    a:'<p>Twelve Black organizations run this together — it\'s a coalition, not one institution:</p><ul>' + ORG_LIST + '</ul>',
    c:["Which one fits me?","Who are the leads?"] },

  { id:"partners",
    k:["partner","partners","supporter","supporters","sponsors of","friends","media partner","emerging la","afro tech","kbla","ai chicks","compton"],
    a:'<p>Alongside the twelve orgs, the site credits <b>AI Chicks</b>, <b>CF / Compton Fest</b>, <b>KBLA 1580</b>, <b>Makala Lee Photography</b> and <b>Micah The Kreator</b>, plus friends at Emerging LA, Black Tech Meetup and AfroTech.</p>',
    c:["Which orgs are involved?","Show me photos"] },

  { id:"song",
    k:["song","music","anthem","track","spotify","theme","tech check","micah","kreator","playlist","listen"],
    a:'<p>There is an official one — <b>Tech Check</b> by <b>Micah The Kreator</b>. It\'s embedded on this page, and it\'s on <a href="https://open.spotify.com/track/0vceUrghTXKl8y9CDs106N" target="_blank" rel="noopener">Spotify</a>.</p>',
    c:["Show me photos","What is Black LA Tech Week?"] },

  { id:"leads",
    k:["lead","leads","leadership","team","founder","organizer","organizers","runs","charge","kelly","stephen","marble","barrios","paris","rashidi","chair"],
    a:'<p>Four co-leads: <b>Stephen Barrios</b> (/dev/color), <b>Paris McCoy</b> (TEC Leimert), <b>Kelly Marble</b> (Ocean AI) and <b>Rashidi Jones</b> (TEC Leimert), with ten partner-org representatives behind them.</p><p>The full roster is on this page — every name links to their org.</p>',
    c:["Which orgs are involved?","How do I get involved?"] },

  { id:"newcomer",
    k:["new","break into","breaking in","start","beginner","no experience","career change","switch","getting started","degree","bootcamp","junior","entry","self taught"],
    a:'<p>You\'re the person this week was built for. Wednesday night in 2025 was literally <b>Breaking into IT &amp; Cybersecurity</b> — no degree required to walk in.</p><p>Tell me what area you\'re aiming at and I\'ll name the two or three orgs that actually fit.</p>',
    c:["Find my org","Are there jobs posted?","How do I get involved?"] },

  { id:"jobs",
    k:["job","jobs","hiring","role","roles","opening","openings","career","careers","apprenticeship","internship","recruit","resume","cv"],
    a:'<p>There\'s no roles board on the site yet — no openings are posted anywhere here. I\'d rather tell you that than send you to a dead page.</p><p>Where LA roles actually circulate: <a href="https://mybpn.org/losangeles/" target="_blank" rel="noopener">Black Professional Network LA</a> and <a href="http://devcolor.org" target="_blank" rel="noopener">/dev/color</a>.</p>',
    c:["Find my org","I\'m hiring","How do I contact them?"] },

  { id:"student",
    k:["student","students","college","university","school","teen","youth","kid","child","high school","scholarship"],
    a:'<p>Four of the twelve work directly with students and young people:</p>' + orgLines(routeOrgs(["students","youth","education"], 4)),
    c:["Find my org","I\'m new to tech","How do I get involved?"] },

  { id:"cyber",
    k:["cyber","cybersecurity","security","infosec","hacking","soc","pentest","it support","help desk","comptia"],
    a:'<p>Cybersecurity has a real front door here. <a href="https://genfinitycyber.com" target="_blank" rel="noopener">Genfinity</a> runs training and services, and the 2025 week gave it a full night — <b>Breaking into IT &amp; Cybersecurity</b>, Wednesday Oct 15.</p>',
    c:["Find my org","Are there jobs posted?"] },

  { id:"ai",
    k:["ai","artificial intelligence","machine learning","ml","llm","data","data science","prompt"],
    a:'<p>Two of the twelve are AI-first:</p>' + orgLines(routeOrgs(["ai"], 3)),
    c:["Find my org","Which orgs are involved?"] },

  { id:"design",
    k:["design","designer","ux","ui","creative","brand","art","product design","portfolio"],
    a:'<p>The creative side of the coalition:</p>' + orgLines(routeOrgs(["design","creative"], 3)),
    c:["Find my org","Which orgs are involved?"] },

  { id:"engineering",
    k:["engineer","engineering","developer","software","coding","backend","frontend","devops","hardware","stem"],
    a:'<p>For engineers specifically:</p>' + orgLines(routeOrgs(["engineering"], 4)) + '<p class="k">Tuesday of the 2025 week — <b>Engineering the Future</b> — was the engineering night.</p>',
    c:["Find my org","Are there jobs posted?"] },

  { id:"founder",
    k:["founder","startup","company","business","entrepreneur","raise","raising","funding","investor","vc","pitch deck","incubator"],
    a:'<p>For founders and operators:</p>' + orgLines(routeOrgs(["entrepreneurship"], 4)) + '<p class="k">No investor programming or demo day is published for the week — that\'s a gap, not a secret.</p>',
    c:["Find my org","How do I get involved?"] },

  { id:"speak",
    k:["speak","speaker","speaking","panel","talk","present","keynote","workshop host","teach","moderate"],
    a:'<p>There\'s no public call for speakers or submission form yet.</p><p>The route that works: pitch the co-leads directly through <a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> or <a href="https://www.instagram.com/blacklatechweek/" target="_blank" rel="noopener">Instagram</a>, and get on the mailing list so you hear it when programming opens.</p>',
    c:["Put me on the list","How do I contact them?"] },

  { id:"sponsor",
    k:["sponsor","sponsorship","brand","partnership","fund","support financially","deck","tiers","exhibit","booth"],
    a:'<p>No public sponsorship deck or tier sheet exists yet — worth knowing before you plan around one.</p><p><a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> is the right channel for partnership conversations. The 2025 week put 2,000+ people through the door across five events with twelve org partners, if you need the numbers.</p>',
    c:["Put me on the list","How do I contact them?"] },

  { id:"volunteer",
    k:["volunteer","volunteering","help out","crew","staff","give back","mentor","mentoring"],
    a:'<p>Most volunteering happens <b>inside the twelve orgs</b>, not at the coalition level — they\'re the ones running programming year-round.</p><p>Tell me what you\'d want to help with and I\'ll point you at the right two or three.</p>',
    c:["Find my org","Put me on the list"] },

  { id:"involved",
    k:["involved","join","participate","contribute","partner with","host","apply","submit","mailing list","newsletter","subscribe"],
    a:'<p>Three ways in, in order of how fast they move:</p><ul><li><b>Join the mailing list</b> at the bottom of this page — that\'s the official channel.</li><li><b>Go direct to an org</b> — most of the work happens inside the twelve.</li><li><b>Speaking or sponsorship</b> — pitch the co-leads on social; no public deck yet.</li></ul>',
    c:["Find my org","Put me on the list","Which orgs are involved?"] },

  { id:"photos",
    k:["photo","photos","gallery","picture","pictures","recap","video","youtube","recording","footage","images"],
    a:'<p>The 2025 mixer gallery is live — shot by <b>Makala Lee</b>: <a href="https://makala-lee-photos.client-gallery.com/gallery/black-la-tech-week-mixer/tech-unplugged-demos-to-dancefloor-10162025" target="_blank" rel="noopener">Demos to Dancefloor →</a></p><p>Video lands on <a href="https://www.youtube.com/@BlackLATechWeek" target="_blank" rel="noopener">YouTube</a>.</p>',
    c:["What happened each night?","Is there a song?"] },

  { id:"contact",
    k:["contact","email","reach","phone","dm","message","talk to","get in touch","social","instagram","linkedin","press","media"],
    a:'<p>There\'s no public email or phone — everything runs through social:</p><ul><li><a href="https://www.instagram.com/blacklatechweek/" target="_blank" rel="noopener">Instagram</a> — fastest</li><li><a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> — partnership, sponsorship, press</li><li><a href="https://www.youtube.com/@BlackLATechWeek" target="_blank" rel="noopener">YouTube</a></li></ul>',
    c:["How do I get involved?","Put me on the list"] },

  { id:"survey",
    k:["survey","feedback","review","suggest","complaint","improve"],
    a:'<p>If you were there in 2025, the attendee survey is still open: <a href="https://form.jotform.com/252897518879078" target="_blank" rel="noopener">Submit feedback →</a></p>',
    c:["When is the next one?"] },

  { id:"about",
    k:["what is","about","tell me about","explain","blatw","black la tech week","why","purpose","mission","first"],
    a:'<p><b>Black L.A. Tech Week</b> is Los Angeles\' largest Black tech conference. The first one ran October 2025 — twelve Black organizations, five events, 2,000+ people through the door in one week.</p><p>The rest of the year, this site is the coalition\'s front door: the twelve orgs, their events, and how to reach them.</p>',
    c:["Which orgs are involved?","What happened each night?","Find my org"] },

  { id:"ticket",
    k:["ticket","tickets","cost","price","free","pay","rsvp","register","registration","how much","admission"],
    a:'<p>2025 registration is <b>closed</b> — all four nights have ended. Nothing is on sale right now, and the event pages never said whether 2025 was free or paid, so I won\'t claim either.</p>',
    c:["Put me on the list","When is the next one?"] },

  { id:"captain",
    k:["who are you","what are you","your name","captain","blair","front desk","concierge","help me","what can you do","options","ai","bot","robot","human","chatbot","assistant"],
    a:'<p>I\'m BLAIR — the <i>Black LA AI &amp; Intelligence Resource</i>. I know the week, the twelve orgs, the people who run them, and how to get you to the right one.</p><p>I can <b>find your org</b>, point you at the <b>mailing list</b>, or just answer questions.</p><p class="k">I run on scripted logic over what this site publishes — no live model behind me. That\'s why I say "I don\'t know" instead of inventing an answer.</p>',
    c:["Find my org","Which orgs are involved?","Put me on the list"] }
];

/* =========================================================
   INTENT MATCHING
   ========================================================= */
var STOP = {"the":1,"a":1,"an":1,"is":1,"are":1,"do":1,"does":1,"i":1,"you":1,"to":1,"of":1,"for":1,"in":1,"on":1,"at":1,"and":1,"it":1,"me":1,"my":1,"can":1,"there":1,"any":1,"be":1,"was":1,"were":1,"this":1,"that":1};

function norm(s) { return (" " + s.toLowerCase().replace(/[^a-z0-9\s']/g, " ") + " ").replace(/\s+/g, " "); }

function match(q) {
  var t = norm(q);
  var words = t.trim().split(" ").filter(function (w) { return w.length > 1 && !STOP[w]; });
  if (!words.length) return null;
  var best = null, bestScore = 0;
  KB.forEach(function (e) {
    var score = 0;
    e.k.forEach(function (key) {
      if (key.indexOf(" ") > -1) {
        if (t.indexOf(key) > -1) score += key.split(" ").length * 2.4;
      } else {
        for (var i = 0; i < words.length; i++) {
          if (words[i] === key) score += 2;
          else if (words[i].length > 3 && key.length > 3 && (words[i].indexOf(key) === 0 || key.indexOf(words[i]) === 0)) score += 1.1;
        }
      }
    });
    if (score > bestScore) { bestScore = score; best = e; }
  });
  return bestScore >= 2 ? best : null;
}

/* =========================================================
   TRANSCRIPT
   ========================================================= */
var S = { log: $("blair-log"), chips: $("blair-chips"), input: $("blair-input"), orb: null, flow: null };

var DEFAULT_CHIPS = [
  "What is Black LA Tech Week?", "When is the next one?",
  "Which orgs are involved?",    "Find my org",
  "Are there jobs posted?",      "How do I get involved?"
];

function setChips(list) {
  if (!S.chips) return;
  S.chips.innerHTML = "";
  (list && list.length ? list : DEFAULT_CHIPS).forEach(function (label) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "blair-chip"; b.textContent = label;
    b.addEventListener("click", function () { handle(label); });
    S.chips.appendChild(b);
  });
}

function bubble(who, html) {
  var d = document.createElement("div");
  d.className = "blair-msg in " + (who === "you" ? "you" : "cap");
  d.innerHTML = '<span class="blair-who">' + (who === "you" ? "You" : "BLAIR") + '</span>' +
                '<div class="blair-bub">' + html + '</div>';
  S.log.appendChild(d);
  S.log.scrollTop = S.log.scrollHeight;
  if (who !== "you") speak(html);
  return d;
}

function captain(html, chips, delay) {
  var t = document.createElement("div");
  t.className = "blair-msg cap in";
  t.innerHTML = '<span class="blair-who">BLAIR</span><div class="blair-bub blair-typing"><span></span><span></span><span></span></div>';
  S.log.appendChild(t);
  S.log.scrollTop = S.log.scrollHeight;
  if (S.chips) S.chips.innerHTML = "";
  setTimeout(function () {
    t.remove();
    bubble("cap", html);
    setChips(chips);
  }, delay || 520);
}

function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function first(s) { return esc(String(s).trim().split(/\s+/)[0] || "friend"); }

/* =========================================================
   GUIDED FLOWS
   ========================================================= */
var GOALS = {
  "Breaking into tech":   ["career","training","mentorship"],
  "Hiring or recruiting": ["career","networking","professional","hiring"],
  "I'm a student":        ["students","youth","education"],
  "Building a company":   ["entrepreneurship","community","product"],
  "Just want to connect": ["networking","community","creative"]
};
var AREAS = {
  "Engineering":        ["engineering"],
  "Cybersecurity":      ["cybersecurity"],
  "AI or data":         ["ai"],
  "Design or creative": ["design","creative"],
  "Not sure yet":       []
};
var ROLES = {
  "Attending":        { noun:"an attendee",   a:'<p>Easiest one. The mailing list at the bottom of this page is how dates reach you first.</p>' },
  "Speaking":         { noun:"a speaker",     a:'<p>No public call for speakers exists yet, so the real move is pitching the co-leads on <a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> — and being on the mailing list when programming opens.</p>' },
  "Sponsoring":       { noun:"a sponsor",     a:'<p>There\'s no public deck or tier sheet yet. <a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> is the channel — and the number that matters is 2,000+ attendees across five events with twelve org partners.</p>' },
  "Volunteering":     { noun:"a volunteer",   a:'<p>Most of it runs through the twelve orgs rather than the coalition. I can point you at the right ones — just ask me to find your org.</p>' },
  "As a partner org": { noun:"a partner org", a:'<p>Partner-org conversations go to the co-leads directly — <a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> is the channel. Twelve orgs ran 2025.</p>' }
};

function pick(map, text) {
  var t = text.toLowerCase().trim(), k;
  for (k in map) { if (k.toLowerCase() === t) return k; }
  for (k in map) { if (t && k.toLowerCase().indexOf(t) > -1) return k; }
  for (k in map) {
    var words = k.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i].length > 3 && t.indexOf(words[i]) > -1) return k;
    }
  }
  return null;
}

/* BLAIR keeps nothing. A signup lives here for the length of the visit so
   she can talk to you like she remembers, and is gone on refresh. The
   mailing list on the page is the only thing that actually records anyone. */
var visit = [];
function noteInterest(entry) {
  visit.push(entry);
  try { if (typeof window.BLAIR_ON_LEAD === "function") window.BLAIR_ON_LEAD(entry); } catch (e) {}
}

/* Send someone to the site's own mailing-list form rather than collecting
   an address in a chat window. */
function toMailingList() {
  var form = document.querySelector('form[name="newsletter"], .newsletter form, .newsletter');
  if (form && form.scrollIntoView) { form.scrollIntoView({ behavior: "smooth", block: "center" }); return true; }
  return false;
}

var FLOWS = {
  /* --- which of the twelve fits me --- */
  match: {
    steps: [
      { key:"goal", chips:Object.keys(GOALS),
        ask:function () { return '<p>Twelve orgs is a lot of doors. Two questions and I\'ll narrow it to three.</p><p><b>What brings you here?</b></p>'; } },
      { key:"area", chips:Object.keys(AREAS),
        ask:function () { return '<p><b>And what area are you working in?</b></p>'; } }
    ],
    done: function (d) {
      var goal = pick(GOALS, d.goal), area = pick(AREAS, d.area);
      var tags = (GOALS[goal] || []).concat(AREAS[area] || []);
      var hits = routeOrgs(tags, 3);
      if (!hits.length) hits = routeOrgs(["community","networking"], 3);
      var head = goal
        ? '<p><b>' + esc(goal) + '</b>' + (area && AREAS[area].length ? ' · <b>' + esc(area) + '</b>' : '') + ' — these are your doors:</p>'
        : '<p>Start with these:</p>';
      captain(head + orgLines(hits) +
        '<p class="k">Go direct — most of the real work happens inside the orgs, not at the coalition level.</p>',
        ["Put me on the list","Which orgs are involved?","How do I contact them?"], 760);
    }
  },

  /* --- keep me posted --- */
  register: {
    steps: [
      { key:"role", chips:Object.keys(ROLES),
        ask:function () { return '<p>Dates for the next one aren\'t announced yet. <b>How are you coming in?</b></p>'; } },
      { key:"name",
        ask:function () { return '<p><b>And your name?</b> First name is plenty.</p>'; }, skip:true }
    ],
    done: function (d) {
      var role = pick(ROLES, d.role) || "Attending";
      var info = ROLES[role];
      noteInterest({ role: role, name: d.name || "", at: Date.now() });
      var who = d.name ? (", " + first(d.name)) : "";
      var moved = toMailingList();
      captain('<p>Noted' + who + ' — you\'re coming in as <b>' + esc(info.noun) + '</b>.</p>' + info.a +
        '<p>' + (moved ? 'I\'ve scrolled you to the mailing list' : 'The mailing list is at the bottom of this page') +
        ' — that form is the one that actually reaches the organizers. <b>I don\'t store anything you tell me;</b> this conversation disappears when you close the tab.</p>',
        ["Find my org","Which orgs are involved?","How do I contact them?"], 780);
    }
  }
};

function startFlow(name) {
  S.flow = { id: name, i: 0, data: {} };
  var st = FLOWS[name].steps[0];
  captain(st.ask({}), st.chips || []);
}

function advanceFlow(text) {
  var def = FLOWS[S.flow.id];
  var step = def.steps[S.flow.i];
  var v = text.trim();
  if (step.skip && /^(skip|none|n\/a|pass|no)$/i.test(v)) v = "";
  S.flow.data[step.key] = v.slice(0, 110);
  S.flow.i++;
  if (S.flow.i < def.steps.length) {
    var next = def.steps[S.flow.i];
    captain(next.ask(S.flow.data), next.chips || []);
  } else {
    var d = S.flow.data; S.flow = null;
    def.done(d);
  }
}

/* ---------- fixed lines, named so the voice build can find them ---------- */
var SAY = {
  greeting: '<p><b>Welcome to Black L.A. Tech Week.</b> I\'m BLAIR — the <i>Black LA AI &amp; Intelligence Resource</i>.</p><p>I can find the org that fits you, tell you what happened in 2025, or point you at the right way in.</p>',
  hello:    '<p>Welcome in. I\'m BLAIR — I know the week, the twelve orgs, and who to send you to.</p><p>What brings you by?</p>',
  thanks:   '<p>Anytime. BLAIR is always on.</p>',
  whatAmI:  '<p>Scripted logic — no live model behind me. I only know what\'s published on this site, which is why I say "I don\'t know" instead of inventing an answer.</p>',
  hiring:   '<p>Nothing is posted on the site yet, so there\'s no board to send you to.</p><p><a href="https://mybpn.org/losangeles/" target="_blank" rel="noopener">Black Professional Network LA</a> is where LA roles actually circulate, and <a href="http://linkedin.com/company/109058311" target="_blank" rel="noopener">LinkedIn</a> reaches the co-leads.</p>',
  unknown:  '<p>I don\'t have a good answer for that one — I only speak for what\'s actually published, and I\'d rather say so than guess.</p><p>What I can do:</p><ul><li><b>Find your org</b> — two questions, three doors</li><li><b>Tell you what happened in 2025</b></li><li><b>Point you at the mailing list</b></li></ul>'
};

/* =========================================================
   ROUTER
   ========================================================= */
function handle(text) {
  text = (text || "").trim();
  if (!text) return;
  bubble("you", esc(text));

  if (S.flow) { advanceFlow(text); return; }

  var t = norm(text);

  if (/find my org|match me|which one fits|fits me|org for me|right org for|which org (fits|is right|should)|what org (fits|is right|should)|where do i (fit|start|belong)|recommend an org|help me choose|which night was for me/.test(t)) {
    startFlow("match"); return;
  }
  if (/are you (a |an )?(ai|bot|robot|human|real|person|chatbot)/.test(t)) {
    captain(SAY.whatAmI, DEFAULT_CHIPS); return;
  }
  if (/put me on|on the list|notify me|let me know when|keep me posted|waitlist|sign me up|register me|rsvp|mailing list|newsletter|subscribe/.test(t)) {
    startFlow("register"); return;
  }
  if (/^\s*(hi|hey|hello|yo|sup|good morning|good evening|howdy)\b/.test(t)) {
    captain(SAY.hello, DEFAULT_CHIPS); return;
  }
  if (/thank|thanks|appreciate|dope|nice|cool|love it|good look/.test(t)) {
    captain(SAY.thanks, DEFAULT_CHIPS); return;
  }
  if (/i'?m hiring|we'?re hiring|looking to hire|need to hire|post a (job|role)/.test(t)) {
    captain(SAY.hiring, ["Put me on the list","Find my org"]); return;
  }

  var hit = match(text);
  if (hit) { captain(hit.a, hit.c); return; }

  captain(SAY.unknown, ["Find my org","Put me on the list","What is Black LA Tech Week?","When is the next one?"]);
}

$("blair-ask").addEventListener("submit", function (e) {
  e.preventDefault();
  var v = S.input.value; S.input.value = "";
  handle(v);
});

bubble("cap", SAY.greeting);
setChips(DEFAULT_CHIPS);

/* =========================================================
   VOICE
   Resolution order: a pre-recorded line → live TTS through the
   site's own /api/speak function → the browser's synthesizer.
   No API key ever reaches the browser.
   ========================================================= */
var VOICE_KEY = "blatw.blair.voice";
var VOICE_MAP = window.BLAIR_VOICE_MAP || {};
var voiceOn = false;
var speechOK = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
var player = null;

var dock     = $("blair-dock");
var panel    = $("blair-panel");
var launcher = $("blair-launcher");
var voiceBtn = $("blair-voice");
var micBtn   = $("blair-mic");
var orbEl    = root.querySelector(".blair-orb");

function plain(html) {
  var d = document.createElement("div"); d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/* Stable key for a spoken line. The offline ElevenLabs build hashes the
   same way, so changing BLAIR's copy simply falls back to synthesis until
   that line is re-recorded. */
function vkey(t) {
  var h = 5381;
  for (var i = 0; i < t.length; i++) { h = ((h << 5) + h + t.charCodeAt(i)) >>> 0; }
  return "b" + h.toString(36);
}

function markSource(kind) {
  var el = $("blair-vsrc");
  if (!el) return;
  el.hidden = !voiceOn;
  var v = picked ? picked.name : null;
  el.textContent = kind === "recorded" ? " · recorded voice"
                 : kind === "live"     ? " · generated live"
                 : (v ? " · " + v : " · synthesized");
  el.dataset.kind = kind;
}

var actx = null, analyser = null, levelData = null, levelRaf = null, fakeTimer = null;

function setSpeaking(on) {
  if (orbEl) orbEl.classList.toggle("speaking", !!on);
  if (!on) {
    document.documentElement.style.setProperty("--blair-level", 0);
    if (levelRaf) { cancelAnimationFrame(levelRaf); levelRaf = null; }
    if (fakeTimer) { clearInterval(fakeTimer); fakeTimer = null; }
  }
}

/* Real amplitude for recorded / ElevenLabs audio. */
function meter(el) {
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    actx = actx || new AC();
    if (actx.state === "suspended") actx.resume();
    var src = actx.createMediaElementSource(el);
    analyser = actx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    levelData = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser); analyser.connect(actx.destination);
    (function tick() {
      if (!analyser) return;
      analyser.getByteFrequencyData(levelData);
      var sum = 0;
      for (var i = 0; i < levelData.length; i++) sum += levelData[i];
      var v = Math.min(1, (sum / levelData.length) / 90);
      document.documentElement.style.setProperty("--blair-level", v.toFixed(3));
      levelRaf = requestAnimationFrame(tick);
    })();
    return true;
  } catch (e) { return false; }
}

/* speechSynthesis exposes no audio node, so the ring breathes on a timer
   rather than pretending to measure something it cannot see. */
function fakeLevel() {
  if (fakeTimer) clearInterval(fakeTimer);
  var t = 0;
  fakeTimer = setInterval(function () {
    t += 0.35;
    var v = 0.34 + Math.abs(Math.sin(t)) * 0.4 + Math.random() * 0.12;
    document.documentElement.style.setProperty("--blair-level", Math.min(1, v).toFixed(3));
  }, 110);
}

/* Browsers refuse audio that was not started by a gesture. A captain whose
   first sound arrives after a fetch never unlocks, and silently falls back
   to the robot synth. One silent play on the first interaction fixes it. */
var audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    var a = new Audio("data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA");
    a.volume = 0;
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function () {});
  } catch (e) {}
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { actx = actx || new AC(); if (actx.state === "suspended") actx.resume(); }
  } catch (e) {}
}
["click","keydown","touchstart"].forEach(function (ev) {
  document.addEventListener(ev, unlockAudio, { once: false, passive: true, capture: true });
});

function stopSpeaking() {
  try { if (player) { player.pause(); player = null; } } catch (e) {}
  try { if (speechOK) window.speechSynthesis.cancel(); } catch (e) {}
  if (analyser) { try { analyser.disconnect(); } catch (e) {} analyser = null; }
  setSpeaking(false);
}

/* macOS ships genuinely good voices; the default is rarely one of them. */
var picked = null;
var VOICE_RANK = [
  "Samantha","Ava","Allison","Susan","Zoe","Nicky","Karen","Moira","Tessa","Serena",
  "Google US English","Microsoft Aria","Microsoft Jenny","Microsoft Michelle","Zira"
];
function scoreVoice(v) {
  var n = (v.name || ""), lower = n.toLowerCase(), sc = 0;
  if (/premium|enhanced|siri/i.test(n)) sc += 60;
  if (/^en[-_]us/i.test(v.lang || "")) sc += 20;
  else if (/^en/i.test(v.lang || "")) sc += 10;
  if (v.localService) sc += 8;
  for (var i = 0; i < VOICE_RANK.length; i++) {
    if (lower.indexOf(VOICE_RANK[i].toLowerCase()) > -1) { sc += (VOICE_RANK.length - i) * 3; break; }
  }
  if (/compact|novelty|whisper|bells|bubbles|organ|zarvox|trinoids|boing/i.test(lower)) sc -= 80;
  return sc;
}
function bestVoice() {
  if (picked) return picked;
  var vs = [];
  try { vs = window.speechSynthesis.getVoices() || []; } catch (e) { return null; }
  if (!vs.length) return null;
  var best = null, bestScore = -1e9;
  for (var i = 0; i < vs.length; i++) {
    var sc = scoreVoice(vs[i]);
    if (sc > bestScore) { bestScore = sc; best = vs[i]; }
  }
  picked = best;
  return picked;
}
if (speechOK) {
  try { window.speechSynthesis.onvoiceschanged = function () { picked = null; bestVoice(); }; } catch (e) {}
}

/* Written text and spoken text are not the same thing. */
function forSpeech(text) {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\*\*|__|`|#{1,6}\s*/g, "")
    .replace(/^\s*[-•▸*]\s*/gm, "")
    .replace(/\s*→\s*/g, ". ")
    .replace(/\bL\.A\./g, "L A")
    .replace(/\bBLATW\b/g, "B L A T W")
    .replace(/\bBLAIR\b/g, "Blair")
    .replace(/\bNSBE\b/g, "N S B E")
    .replace(/\bKBLA\b/g, "K B L A")
    .replace(/\bIT\b/g, "I T")
    .replace(/\bAI\b/g, "A I")
    .replace(/2,000\+/g, "over two thousand")
    .replace(/(\d)\s*[–-]\s*(\d+)\s*(AM|PM)/gi, "$1 to $2 $3")
    .replace(/\bOct\b/g, "October")
    .replace(/\bMon\b/g, "Monday").replace(/\bTue\b/g, "Tuesday")
    .replace(/\bWed\b/g, "Wednesday").replace(/\bThu\b/g, "Thursday")
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* One utterance per sentence, so she breathes instead of racing. */
function synth(text) {
  if (!speechOK) return;
  var clean = forSpeech(text);
  if (!clean) return;
  var parts = clean.match(/[^.!?]+[.!?]*/g) || [clean];
  var v = bestVoice();
  var started = false;
  parts.forEach(function (part, i) {
    var t = part.trim();
    if (!t) return;
    try {
      var u = new SpeechSynthesisUtterance(t);
      if (v) u.voice = v;
      u.rate = 0.97; u.pitch = 1.0; u.volume = 1;
      if (!started) { started = true; u.onstart = function () { setSpeaking(true); fakeLevel(); }; }
      if (i === parts.length - 1) u.onend = u.onerror = function () { setSpeaking(false); };
      window.speechSynthesis.speak(u);
    } catch (e) {}
  });
}

function speak(html) {
  if (!voiceOn) return;
  var text = plain(html);
  if (!text) return;
  stopSpeaking();
  var src = VOICE_MAP[vkey(text)];
  if (src) { play(src, text, "recorded"); return; }
  if (CFG.live) { live(text); return; }
  synth(text);
  markSource("synth");
}

function play(src, text, kind) {
  try {
    player = new Audio(src);
    player.crossOrigin = "anonymous";
    player.addEventListener("ended", function () { setSpeaking(false); });
    player.addEventListener("pause", function () { setSpeaking(false); });
    var pr = player.play();
    if (pr && pr.then) {
      pr.then(function () {
        setSpeaking(true);
        if (!meter(player)) fakeLevel();
      }).catch(function () { synth(text); markSource("synth"); });
    } else {
      setSpeaking(true); if (!meter(player)) fakeLevel();
    }
    markSource(kind);
  } catch (e) { synth(text); markSource("synth"); }
}

/* Live TTS through the site's own function, which holds the key
   server-side. Off unless BLAIR_LIVE_VOICE is set — recorded lines are
   cheaper, faster, and don't bill per visitor. */
function live(text) {
  markSource("live");
  fetch(CFG.speak, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: forSpeech(text), captain: "BLAIR" })
  }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.blob();
  }).then(function (blob) {
    play(URL.createObjectURL(blob), text, "live");
  }).catch(function () {
    synth(text); markSource("synth");
  });
}

function setVoice(on) {
  voiceOn = !!on && speechOK;
  voiceBtn.setAttribute("aria-pressed", voiceOn ? "true" : "false");
  if (!voiceOn) stopSpeaking();
  var el = $("blair-vsrc"); if (el) el.hidden = !voiceOn;
  try { localStorage.setItem(VOICE_KEY, voiceOn ? "1" : "0"); } catch (e) {}
}
if (!speechOK) { voiceBtn.hidden = true; }
else {
  try { if (localStorage.getItem(VOICE_KEY) === "1") setVoice(true); } catch (e) {}
  voiceBtn.addEventListener("click", function () { setVoice(!voiceOn); });
}

/* New recordings can ship without touching this file. */
try {
  fetch(CFG.base + "voice-map.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (m) { if (m && typeof m === "object") { for (var k in m) VOICE_MAP[k] = m[k]; } })
    .catch(function () {});
} catch (e) {}

/* =========================================================
   OPEN / CLOSE
   ========================================================= */
function openBlair(focus) {
  panel.hidden = false;
  launcher.setAttribute("aria-expanded", "true");
  if (focus !== false) S.input.focus();
  S.log.scrollTop = S.log.scrollHeight;
}
function closeBlair() {
  panel.hidden = true;
  launcher.setAttribute("aria-expanded", "false");
  stopSpeaking();
}
launcher.addEventListener("click", function () { panel.hidden ? openBlair() : closeBlair(); });
$("blair-close").addEventListener("click", closeBlair);
$("blair-expand").addEventListener("click", function () {
  dock.dataset.size = dock.dataset.size === "big" ? "small" : "big";
  S.log.scrollTop = S.log.scrollHeight;
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !panel.hidden) closeBlair();
});

/* Anything on the page marked data-open-blair opens her — that's how a
   nav link or a hero button can call the Captain without knowing anything
   about how she works. */
Array.prototype.forEach.call(document.querySelectorAll("[data-open-blair]"), function (el) {
  el.addEventListener("click", function (e) { e.preventDefault(); openBlair(); });
});

/* =========================================================
   MIC — only offered where the browser supports it
   ========================================================= */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  micBtn.hidden = false;
  var rec = null, listening = false;
  micBtn.addEventListener("click", function () {
    if (listening) { try { rec.stop(); } catch (e) {} return; }
    try {
      rec = new SR();
      rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onstart = function () { listening = true; micBtn.classList.add("rec"); };
      rec.onend   = function () { listening = false; micBtn.classList.remove("rec"); };
      rec.onerror = function () {
        listening = false; micBtn.classList.remove("rec");
        S.input.placeholder = "Voice input unavailable here — type instead.";
      };
      rec.onresult = function (ev) {
        var t = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
        if (t) handle(t);
      };
      rec.start();
    } catch (e) { micBtn.hidden = true; }
  });
}

/* =========================================================
   PUBLIC HANDLE + VOICE MANIFEST
   window.BLAIR.open() / .ask("…") for anything on the page.
   BLAIR_VOICE_LINES is what the offline ElevenLabs build reads.
   ========================================================= */
window.BLAIR = {
  open:  openBlair,
  close: closeBlair,
  ask:   function (q) { openBlair(false); handle(q); },
  voice: setVoice
};

window.BLAIR_VOICE_LINES = (function () {
  var out = [], seen = {};
  function add(html, kind, dynamic) {
    var text = plain(html);
    if (!text || seen[text]) return;
    seen[text] = 1;
    out.push({ key: dynamic ? null : vkey(text), text: text, kind: kind, dynamic: !!dynamic });
  }
  Object.keys(SAY).forEach(function (k) { add(SAY[k], "line:" + k); });
  KB.forEach(function (e) { add(e.a, "answer:" + e.id); });
  Object.keys(FLOWS).forEach(function (f) {
    FLOWS[f].steps.forEach(function (st) {
      var a = plain(st.ask({ name: "Alpha Bravo" }));
      var b = plain(st.ask({ name: "Charlie Delta" }));
      add(a, "flow:" + f + ":" + st.key, a !== b);
    });
  });
  return out;
})();

})();
