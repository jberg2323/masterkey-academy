/* MasterKey Academy — app logic. Plain JS, no dependencies. */
(() => {
'use strict';

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 1800); };
const fmtDate = v => { if (!v) return ''; const d = new Date(v + 'T12:00:00'); return isNaN(d) ? v : d.toLocaleDateString(undefined, {month:'long', day:'numeric', year:'numeric'}); };
const money = n => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString();
function download(name, text, type = 'text/csv') {
  try {
    const url = URL.createObjectURL(new Blob([text], {type}));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) { toast('Download blocked by your browser'); }
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); return; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('Copied'); } catch (e) { toast('Select the text and copy it manually'); }
  ta.remove();
}
const csvCell = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

// ---------- config: edit these ----------
const LEAD_EMAIL = 'jeremy@ctox.com';            // where "get a CTO" requests are emailed
const BOOKING_URL = '';                           // paste a Calendly / Google booking link to show a "Book now" button
const LEAD_ENDPOINT = 'https://formsubmit.co/ajax/' + LEAD_EMAIL;
let ROUTE_Q = new URLSearchParams();

// ---------- content ----------
const ROLE_NAMES = {sponsor:'Business owner', admin:'MasterKey admin', owner:'Department lead', champion:'Champion', user:'Team member', withcto:'Working with an implementer'};
const LESSONS = [
  {id:'welcome', group:'Start here', title:'Welcome', tpl:'t-welcome', kind:'page'},
  {id:'roles', group:'Start here', title:'Who does what', tpl:'t-roles', time:'5 min', for:['all'],
    plain:'A rollout needs a few jobs covered: an owner who sets the goal and the limits, an admin who runs MasterKey, department leads who know the work, a few champions, and the team who will use the agents.',
    outcome:'every role assigned to a named person.',
    tasks:['Put a name next to each role in <a href="#plan">Your rollout plan</a>', 'Tell each person which lessons they need (marked REQ once they pick their role)', 'Book 30 minutes with the business owner this week'],
    quiz:[
      {q:'Who owns the goal, the no-go zones and the yes/no on every agent?', o:['The MasterKey admin','A champion','The business owner','The implementer'], a:2, why:'The business owner owns the goal, what the freed hours are for, the no-go zones and every go-live decision.'},
      {q:'How many champions should you have?', o:['One per company','One per 10 users','One per department lead','One per agent'], a:1, why:'One respected doer per 10 users.'}]},
  {id:'plan', group:'Start here', title:'Your rollout plan', tpl:'t-plan', kind:'tool'},
  {id:'paths', group:'Start here', title:'Is MasterKey a fit?', tpl:'t-paths', kind:'tool'},
  {id:'m0', group:'The course', title:'0 · Set up and scan', tpl:'t-m0', time:'Under 1 hour', for:['admin'],
    plain:'Decide what you want to fix and how you\'ll measure it, tell your team, create your account, connect your work email and calendar, and start your first TimeScout scan.',
    outcome:'an account, your key tools connected, a scan running, and a team that knows why.',
    tasks:['Write your goal with a number and a date in <a href="#plan">Your rollout plan</a>', 'Pick one department or workflow to start with', 'Send the <a href="#templates">team announcement</a> before connecting anything', 'Create your account at <a href="https://masterkey.ai" target="_blank" rel="noopener">masterkey.ai</a> and confirm the 6-digit code', 'Connect your work email and calendar, then the tools the workflow runs on', 'Click Find My Busywork', 'Send the <a href="#templates">baseline survey</a> while the scan runs'],
    quiz:[
      {q:'Which is a usable goal?', o:['Use AI more','Roll MasterKey out to everyone','Win back 15 hours a week across the sales team by January 31','Make the team happier'], a:2, why:'One line, with a number and a date. Without a number you can\'t tell if it worked.'},
      {q:'What should you connect first?', o:['Every tool you own','Your work email and calendar','Nothing until the report arrives','Your bank account'], a:1, why:'Start with your work email and calendar, then the tools the workflow runs on.'},
      {q:'When does the scan start?', o:['As soon as you sign up','When you click Find My Busywork','When a teammate logs in','Every night automatically'], a:1, why:'No scan runs until you say go: Find My Busywork starts it.'}]},
  {id:'m1', group:'The course', title:'1 · Read your report', tpl:'t-m1', time:'30 min', for:['sponsor','admin','owner'],
    plain:'Your TimeScout report estimates the hours your team spends on busywork and suggests agents to take it. Check the estimate against reality, fix anything it got wrong, and mark each suggestion right or wrong.',
    outcome:'a corrected report and a baseline you trust.',
    tasks:['Compare the Diagnosis hours with your baseline survey', 'Mark any hat or workflow that isn\'t yours as Doesn\'t apply', 'Walk one real example through "How it works" for each agent you care about', 'Mark each one Looks right or Needs changes', 'Enter your baseline in <a href="#plan">Your rollout plan</a>'],
    quiz:[
      {q:'The report lists a hat that isn\'t yours. What do you do?', o:['Ignore it','Click Doesn\'t apply','Delete your account','Run a new scan immediately'], a:1, why:'Doesn\'t apply corrects the report, and every recommendation after it gets better.'},
      {q:'Two agents each promise 6 hours from the same work. How many hours do you count?', o:['12','6, because the hours overlap','0','24'], a:1, why:'Overlapping estimates can claim the same hours. Don\'t add them up.'},
      {q:'Which tab shows where an agent\'s hours number came from?', o:['Overview','Trust','Proof','How it works'], a:2, why:'Proof shows the evidence from your scan: the hours you spend today and what they cost.'}]},
  {id:'m2', group:'The course', title:'2 · Pick your first hire', tpl:'t-m2', time:'45 min', for:['sponsor','admin','owner','champion'],
    plain:'Start from how your business makes money, not from the tool. Then choose one to three agents whose work you can check on day one, and decide what the freed hours are for.',
    outcome:'a build pile of one to three agents, each with an owner, approved by the business owner.',
    tasks:['Owner answers the four business questions on this page', 'Score each candidate with the practice scorer', 'Add your first one to three to the build pile; mark the rest Not now', 'Fill in the <a href="#buildlist">build list</a> and get the owner\'s approval', 'Send the <a href="#templates">report-reviewed note</a> to the team'],
    quiz:[
      {q:'Which makes the best first hire?', o:['The agent with the biggest hours estimate','An agent whose output you can check on day one','An agent that replies to upset customers','The one that touches the most tools'], a:1, why:'"Start with an assistant you can check on day one."'},
      {q:'A candidate scores 1 on error cost. What do you do?', o:['Run it On its own to save the most time','Keep it on Drafts only for good, or leave it for later','Build it first','Ignore the score'], a:1, why:'If a mistake reaches a customer, money or legal, a person always reviews it.'},
      {q:'What happens when you add an agent to the build pile?', o:['It starts working immediately','Nothing until you build it and switch it on','It emails your customers','It deletes the old workflow'], a:1, why:'"Nothing happens until you switch it on."'}]},
  {id:'m3', group:'The course', title:'3 · Set the boundaries', tpl:'t-m3', time:'45 min', for:['sponsor','admin','owner'],
    plain:'Before any agent works, teach MasterKey about your business, write down what AI must never touch, and decide how much each agent may do alone. Every new agent starts on Drafts only.',
    outcome:'a filled-in company brain, written no-go zones, and a trust level and tool access for each agent.',
    tasks:['Fill the company brain: what you sell, who your customers are, how you talk, what you never do', 'Write each no-go zone with the person who gets the exception', 'Set every new agent to Drafts only', 'Give each agent write access only to what its job needs'],
    quiz:[
      {q:'What trust level does every new agent start on?', o:['On its own','Asks first','Drafts only','Whatever the report suggests'], a:2, why:'Drafts only: the agent prepares the work and a person approves it.'},
      {q:'Which belongs in a no-go zone?', o:['Formatting a weekly report','Replying to a customer whose parent just died','Summarizing a meeting','Creating a task from an email'], a:1, why:'Anything that runs on trust, judgment or a relationship stays with you.'},
      {q:'A connection is syncing. Can every agent now write to that tool?', o:['Yes','No. Connections are read-only by default; write access is granted per agent','Only on weekends','Only the newest agent'], a:1, why:'Sync health is not permission to act.'}]},
  {id:'m4', group:'The course', title:'4 · Build and go live', tpl:'t-m4', time:'1 hour + 2 weeks of checks', for:['admin','owner'],
    plain:'Click Build agents, answer any setup requests, rehearse on a real example, then switch your first agent on at Drafts only. Check its drafts every day for two weeks.',
    outcome:'one agent producing useful drafts on real work, with a reviewer and a written off switch.',
    tasks:['Click Build agents in Fulfillment', 'Answer any setup requests and rerun the same example', 'Rehearse one real example, including a no-go case', 'Switch the agent on at Drafts only', 'Have the reviewer show you how they approve, pause and get help', 'Download the check sheet and log 10 real examples', 'Write the <a href="#templates">off-switch plan</a>'],
    quiz:[
      {q:'An agent says it can\'t work yet. What\'s the likely fix?', o:['Rebuild your account','Answer its setup request: where to look and where to put its work','Raise its trust level','Disconnect your email'], a:1, why:'Setup requests ask for a specific input or destination. Answer it and rerun the same example.'},
      {q:'When can an agent move from Drafts only to Asks first?', o:['On day one','After two clean weeks of checked drafts','When the team asks','Never'], a:1, why:'Two clean weeks: 90%+ of drafts approved without edits and every no-go case handled right.'}]},
  {id:'m5', group:'The course', title:'5 · Run your day in MasterKey', tpl:'t-m5', time:'20 min', for:['admin','owner','champion','user'],
    plain:'MasterKey is where your team checks in each day: drafts to review, questions agents need answered, your numbers and your departments.',
    outcome:'knowing where your drafts, asks and numbers live, and how to flag a mistake.',
    tasks:['Open Home base and Today', 'Clear your Asks waiting', 'Check whether your dashboard shows sample data or your own', 'Invite a teammate in Members and check what they can see', 'Connect iMessage or Telegram if you want to ask from your phone'],
    quiz:[
      {q:'Your dashboard numbers look made up. Why?', o:['MasterKey is broken','Until you connect your tools, it shows sample data','Your team is lying','It\'s last year\'s data'], a:1, why:'"Until you connect your tools, everything here is sample data."'},
      {q:'Where do you look before building a new agent?', o:['The Library of ready-made agents','Your inbox','The company brain','Nowhere'], a:0, why:'Reuse a suitable agent from the Library before describing a new one in Builder.'}]},
  {id:'m6', group:'The course', title:'6 · Get your team using it', tpl:'t-m6', time:'45 min', for:['all'],
    plain:'People use an agent when they aren\'t afraid of it, trust its output, and find it easier than the old way. This lesson covers all three, plus the 45-minute session for your team.',
    outcome:'champions in place, launch messages sent, and everyone trained.',
    tasks:['Owner tells the team what the freed hours are for', 'Name one champion per 10 users in <a href="#plan">Your rollout plan</a>', 'Set up one place to flag bad outputs', 'Retire the old manual step', 'Book the 45-minute team session', 'Send the <a href="#templates">go-live message</a>'],
    quiz:[
      {q:'What are the three reasons people don\'t use agents?', o:['Price, speed, design','Fear for their job, distrust of the output, the old way is easier','Bad Wi-Fi, too many tools, no training','Legal, IT, finance'], a:1, why:'Each needs its own fix: say what the hours are for, start on Drafts only, make the agent the easy path.'},
      {q:'Someone flags a bad output. How fast do you answer?', o:['Within one business day','Within a month','At the day-30 review','No need to answer'], a:0, why:'Trust follows visible accuracy, and answered flags.'}]},
  {id:'rollout', group:'Plan & measure', title:'The 90-day rollout', tpl:'t-rollout', time:'10 min', for:['sponsor','admin'],
    plain:'Ninety days in four phases. You only move on when a checkpoint (a "gate") passes. If it doesn\'t, fix the problem and try again.',
    outcome:'the four phases and three gates on your calendar.',
    tasks:['Put the three gate dates on the owner\'s and admin\'s calendars', 'Book a 30-minute review at day 30, 60 and 90'],
    quiz:[
      {q:'What must happen before you build your first agent?', o:['The owner approves the first hire','A second scan','70% of forecast','Everyone is trained'], a:0, why:'Gate 1 is the owner\'s approval of the first hire on the build list.'},
      {q:'A gate is missed. What happens?', o:['Skip it','Fix the problem and try again','Cancel the rollout','Set every agent to On its own'], a:1, why:'A missed gate means fix and retry, not skip.'}]},
  {id:'measure', group:'Plan & measure', title:'Measuring success', tpl:'t-measure', time:'20 min', for:['sponsor','admin'],
    plain:'Success is one number: hours won back each week compared with before. Check it at day 30, 60 and 90. If an agent is below half its forecast at day 30, fix it or switch it off.',
    outcome:'a weekly tracking routine and your ROI number.',
    tasks:['Decide who records the six measures every week', 'Enter your loaded hourly cost in <a href="#plan">Your rollout plan</a>', 'Run the ROI check on this page at day 30', 'Send the <a href="#templates">day-30 update</a>'],
    quiz:[
      {q:'What one number decides success?', o:['Number of agents built','Hours won back per week vs. your baseline','Logins per day','Credits used'], a:1, why:'Everything else explains that number.'},
      {q:'An agent is at 40% of forecast hours on day 30. What happens?', o:['Leave it','Raise its trust level','Fix it or switch it off','Build two more like it'], a:2, why:'Under 50% of forecast at day 30 = fix it or switch it off.'}]},
  {id:'gov', group:'Plan & measure', title:'Staying in control', tpl:'t-gov', time:'15 min', for:['sponsor','admin'],
    plain:'Every agent needs an owner, a trust level, no-go zones and an off switch before it goes live. Raise trust only when the drafts have earned it.',
    outcome:'the controls checklist complete for your first agent.',
    tasks:['Set a trust level for each agent on the <a href="#buildlist">build list</a>', 'Tick off the controls checklist above', 'Add "remove from MasterKey Members" to your offboarding checklist'],
    quiz:[
      {q:'Which can never run On its own?', o:['Turning meeting notes into tasks','Updating a record from an email','Payments and pricing','Summarizing a meeting'], a:2, why:'Never On its own: payments, pricing, contracts, legal or medical statements, hiring, deleting records, or anything in a no-go zone.'},
      {q:'When can an agent move to On its own?', o:['After its first good draft','After 30 days at 90%+ on low-risk, easy-to-undo work, with the owner\'s written OK','Whenever the team is busy','Never'], a:1, why:'Trust is earned with a record, and the owner signs off.'}]},
  {id:'ctoled', group:'Get help', title:'Working with an implementer', tpl:'t-ctoled', time:'10 min', for:['withcto','sponsor'],
    plain:'If you need hands-on help, the MasterKey team learns about your business first. If there\'s implementation work, they bring in a certified implementer who does the technical setup with you. You still own the goal and every decision.',
    outcome:'knowing how help works, who does what, and what to bring to your first call.',
    tasks:['<a href="#expert?from=ctoled">Talk to the MasterKey team</a>', 'Name your business owner and MasterKey admin in <a href="#plan">Your rollout plan</a>', 'Write your goal with a number and a date', 'List the tools the workflow runs on and who can grant access', 'Have your TimeScout report open for the call'],
    quiz:[
      {q:'In an implementer-led rollout, who approves each agent going live?', o:['The implementer','Your business owner','MasterKey','Nobody'], a:1, why:'The implementer does the technical work; the owner still makes every go-live decision.'},
      {q:'Who do you talk to first when you want hands-on help?', o:['Any CTO you can find','The MasterKey team','Your Salesforce rep','Nobody; just keep going'], a:1, why:'The MasterKey team learns what your business needs first, then brings in a certified implementer if there\'s implementation work.'}]},
  {id:'expert', group:'Get help', title:'Talk to the MasterKey team', tpl:'t-expert', kind:'tool'},
  {id:'trouble', group:'Get help', title:'Troubleshooting & FAQ', tpl:'t-trouble', time:'5 min', for:['champion','user','admin'],
    plain:'The most common problems and their fixes, plus straight answers to the questions people ask first.',
    outcome:'knowing where to look when something goes wrong.',
    tasks:['Bookmark this page', 'Share your flag-a-bad-output channel with the team'],
    quiz:[
      {q:'An agent got a fact about your business wrong. First fix?', o:['Raise its trust level','Correct the company brain, then rerun','Delete the agent','Run a new scan'], a:1, why:'Agents work from the company brain. Fix the fact at the source.'},
      {q:'Do you need Salesforce to use MasterKey?', o:['Yes','No'], a:1, why:'You can scan, read your report, and build and run agents inside MasterKey.'}]},
  {id:'help', group:'Get help', title:'Getting help', tpl:'t-help', kind:'tool'},
  {id:'templates', group:'Toolkit', title:'Copy-ready messages', tpl:'t-templates', kind:'tool'},
  {id:'buildlist', group:'Toolkit', title:'Build list', tpl:'t-buildlist', kind:'tool'},
  {id:'glossary', group:'Toolkit', title:'Glossary', tpl:'t-glossary', kind:'tool'},
  {id:'cert', group:'Certify', title:'Admin certificate', tpl:'t-cert', kind:'cert'}
];
const LBYID = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const EXAM = [
  {q:'What should your first scan focus on?', o:['The whole company','One department or workflow','Only the owner','Every tool you own'], a:1},
  {q:'What should you capture while the scan runs?', o:['A baseline of weekly hours from your team','A SOC 2 report','A new CRM','Nothing'], a:0},
  {q:'What does "Doesn\'t apply" do in the report?', o:['Deletes the report','Corrects a hat or workflow that isn\'t yours','Switches off an agent','Starts a new scan'], a:1},
  {q:'What makes a good first hire?', o:['The biggest hours estimate','A job you can check on day one','Anything customer-facing','The most connected tools'], a:1},
  {q:'What four things go in the company brain first?', o:['Logo, colors, fonts, slogan','What you sell, who your customers are, how you talk, what you never do','Passwords, bank details, payroll, contracts','Nothing; it fills itself'], a:1},
  {q:'What trust level does every new agent start on?', o:['On its own','Asks first','Drafts only','It depends'], a:2},
  {q:'Connections are read-only by default. How does an agent get permission to act?', o:['It can\'t, ever','Write access is granted per agent','Any connection allows it','By asking a teammate'], a:1},
  {q:'An agent can\'t start working. What do you check first?', o:['Your bill','Its setup request','Your Wi-Fi','The glossary'], a:1},
  {q:'An agent is at 40% of forecast hours on day 30. What happens?', o:['Wait until day 90','Fix it or switch it off','Raise its trust level','Build two more'], a:1},
  {q:'You want hands-on help. Who do you contact first?', o:['Any freelancer','The MasterKey team','Your Salesforce rep','Nobody'], a:1}
];
const ROLES = [
  {id:'admin', who:'Sets up and runs MasterKey. Often the chief of staff or ops lead.', time:'about 5 hours', req:['roles','m0','m1','m2','m3','m4','m5','m6','rollout','measure','gov','trouble','cert']},
  {id:'sponsor', who:'Owner, CEO or GM. Sets the goal and the limits, approves every agent.', time:'about 2 hours', req:['roles','m1','m2','m3','m6','rollout','measure']},
  {id:'owner', who:'Head of a team. Confirms the report and each agent\'s rules.', time:'about 3 hours', req:['roles','m1','m2','m3','m4','m5','m6']},
  {id:'champion', who:'Respected team member who coaches peers. 1 per 10 users.', time:'about 1.5 hours', req:['roles','m2','m5','m6','trouble']},
  {id:'user', who:'Reviews drafts, answers asks, flags mistakes.', time:'about 45 minutes', req:['m5','m6','trouble']},
  {id:'withcto', who:'An implementer does the technical setup with you. You own the goal and decisions.', time:'about 1.5 hours', req:['roles','ctoled','m1','m2','m3','m6','measure']}
];
const GLOSSARY = [
  ['Agent','AI that does one specific, repeated job for you, like drafting a follow-up email after a meeting.'],
  ['Asks waiting','Questions agents need you to answer before they can continue.'],
  ['Baseline','How many hours a week your team spends on the work before any agent. Every result is measured against it.'],
  ['Build pile','Where you put the agents you\'ve chosen to build: Add to build, or Not now.'],
  ['Build list','Our one-page template for your first one to three agents, each with an owner and a date, approved by the business owner.'],
  ['Busywork','Repeated, rule-based work that takes time but not judgment.'],
  ['Champion','A respected team member who tries agents first and coaches peers. One per 10 users.'],
  ['Company brain','What every agent knows about your business: what you sell, who your customers are, how you talk, what you never do.'],
  ['Connections','The tools you link to MasterKey. Read-only by default; write access is granted per agent.'],
  ['Credits','What MasterKey usage is paid with. Signup includes $500 in free credits.'],
  ['Department','A team area in MasterKey with its own numbers and work. You can add one from a template.'],
  ['Diagnosis','Section 1 of your report: how many hours a week are busywork.'],
  ['Drafts only','The starting trust level. The agent prepares the work; a person approves it.'],
  ['Fulfillment','Section 3 of your report, where you build agents and switch them on.'],
  ['Gate','A checkpoint in the 90-day plan. The next phase starts only when it passes.'],
  ['Home base / Today','Your daily starting point in MasterKey: report, tools, pending work and calendar.'],
  ['Implementer','A certified expert the MasterKey team brings in to do the technical setup with you, when you need hands-on help.'],
  ['Library and Builder','The Library has ready-made agents. Builder is where you describe a new one in plain words.'],
  ['Loaded hourly cost','What an hour of someone\'s time really costs: salary plus benefits plus overhead, divided by working hours.'],
  ['No-go zone','Something AI must never handle, with the named person who gets it instead.'],
  ['Prescription','Section 2 of your report: the agents matched to your busywork and the hours they could give back.'],
  ['Proof','The tab showing the evidence behind an agent\'s numbers: hours spent today and what they cost.'],
  ['Setup request','An agent asking where to look or where to put its work before it can start.'],
  ['TimeScout report','The report MasterKey produces after scanning your connected tools: Diagnosis, Prescription and Fulfillment.'],
  ['Trust level','How much an agent may do alone: Drafts only, Asks first, or On its own.']
];

// ---------- state ----------
const KEY = 'mk-academy-v2';
const blank = () => ({done:{}, role:null, name:'', checks:{}, exam:null, answers:{}, plan:{}, bl:[], rubric:null, roi:null, last:null, certDate:null});
let S = blank();
let storageOK = true;
try {
  const raw = localStorage.getItem(KEY) || localStorage.getItem('mk-academy-v1');
  if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') S = Object.assign(blank(), o); }
} catch (e) { storageOK = false; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOK = false; } };
const AWAY_MS = S.lastSeen ? Date.now() - S.lastSeen : 0;

// ---------- theme ----------
try { const t = localStorage.getItem('mk-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
$('#themeBtn').onclick = () => {
  const cur = document.documentElement.dataset.theme;
  const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const n = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = n;
  try { localStorage.setItem('mk-theme', n); } catch (e) {}
};

// ---------- nav ----------
const side = $('#side'), main = $('#main'), overlay = $('#overlay'), menuBtn = $('#menuBtn');
const closeMenu = () => { side.classList.remove('open'); overlay.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
menuBtn.onclick = () => { const o = side.classList.toggle('open'); overlay.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); };
overlay.onclick = closeMenu;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

const role = () => ROLES.find(r => r.id === S.role);
const track = () => { const r = role(); const ids = r ? r.req : ROLES[0].req; return ids.map(id => LBYID[id]); };
const nextUp = () => track().find(l => !S.done[l.id]);

function renderNav(cur) {
  const r = role(), req = new Set(r ? r.req : []);
  let html = '', g = '';
  LESSONS.forEach(l => {
    if (l.group !== g) { g = l.group; html += `<h4>${esc(g)}</h4>`; }
    const dot = (l.kind === 'tool' || l.kind === 'page') ? `<span class="dot tool" aria-hidden="true">${l.kind === 'page' ? '⌂' : '✦'}</span>` : `<span class="dot ${S.done[l.id] ? 'done' : ''}" aria-hidden="true">✓</span>`;
    const tag = r && req.has(l.id) && S.role !== 'admin' ? '<span class="req" title="Required for your role">REQ</span>' : '';
    html += `<a href="#${l.id}" class="${l.id === cur ? 'active' : ''}" ${l.id === cur ? 'aria-current="page"' : ''}>${dot}<span>${esc(l.title)}${S.done[l.id] ? '<span class="sr-only" style="position:absolute;left:-999px"> (complete)</span>' : ''}</span>${tag}</a>`;
  });
  html += `<div class="sidefoot">${r ? 'Your role: <b>' + esc(ROLE_NAMES[r.id]) + '</b> · <a href="#welcome">change</a>' : '<a href="#welcome">Pick your role</a> to see what you need.'}${storageOK ? '' : '<br><b>Note:</b> your browser is blocking storage, so progress won\'t be saved.'}</div>`;
  side.innerHTML = html;
  const tl = track(), n = tl.filter(l => S.done[l.id]).length, pct = tl.length ? Math.round(100 * n / tl.length) : 0;
  $('#pLabel').textContent = `${n} of ${tl.length} ${r ? 'in your track' : 'lessons'}`;
  $('#pFill').style.width = pct + '%';
  $('#pTrack').setAttribute('aria-valuenow', pct);
  $('#pPct').textContent = pct + '%';
}

// ---------- quiz ----------
const quizHTML = qs => qs.map((q, i) => `<div class="q" data-i="${i}" role="group" aria-label="Question ${i + 1}"><p>${i + 1}. ${esc(q.q)}</p>${q.o.map((o, j) => `<button type="button" class="opt" data-j="${j}">${esc(o)}</button>`).join('')}<div class="why" aria-live="polite"></div></div>`).join('');

function lessonQuiz(L, wrap) {
  const qz = document.createElement('section'); qz.className = 'quiz';
  qz.innerHTML = `<span class="eyebrow">Check yourself</span><h2 style="margin-top:12px">${L.quiz.length} quick questions</h2><p style="color:var(--ink-2)">Get them all right to complete this lesson. A wrong answer tells you why; just pick again.</p>${quizHTML(L.quiz)}<div class="status" id="qStatus" aria-live="polite"></div>`;
  wrap.appendChild(qz);
  const ok = new Set(), already = !!S.done[L.id];
  const check = () => {
    const st = $('#qStatus', qz);
    if (ok.size === L.quiz.length) {
      if (!S.done[L.id]) { S.done[L.id] = Date.now(); save(); renderNav(L.id); toast('Lesson complete'); }
      const nx = nextUp();
      st.innerHTML = `<b style="color:var(--good)">✓ Lesson complete.</b> ${nx ? `Next in your track: <a href="#${nx.id}">${esc(nx.title)}</a>` : 'You\'ve finished your track.'}`;
    } else st.textContent = `${ok.size} of ${L.quiz.length} correct`;
  };
  $$('.q', qz).forEach(qEl => {
    const q = L.quiz[+qEl.dataset.i];
    const mark = j => {
      const btn = $(`.opt[data-j="${j}"]`, qEl), why = $('.why', qEl);
      if (j === q.a) { btn.classList.add('right'); $$('.opt', qEl).forEach(b => b.disabled = true); ok.add(qEl.dataset.i); why.textContent = 'Correct. ' + q.why; }
      else { btn.classList.add('wrong'); btn.disabled = true; why.textContent = 'Not quite. Try another answer.'; missed(L, qz); }
      qEl.classList.add('answered');
    };
    if (already) mark(q.a);
    $$('.opt', qEl).forEach(b => b.onclick = () => { mark(+b.dataset.j); check(); });
  });
  check();
}

// ---------- stuck -> MasterKey team ----------
const STUCK = {
  roles:'Not sure who should own what?', m0:'Connections failing, or not sure what to connect?', m1:'Report doesn\'t match how your week really goes?',
  m2:'Not sure which agent to start with?', m3:'Not sure where to draw the lines?', m4:'Agent stuck on setup, or drafts not good enough?',
  m5:'Can\'t find what you need in MasterKey?', m6:'Team not using it?', rollout:'Missed a gate and not sure how to fix it?',
  measure:'An agent under 50% of forecast?', gov:'Need a security review or have regulated data?', trouble:'Tried the fix and still stuck?'
};
const stuckHTML = (from, title, why) => `<div><b>${esc(title)}</b><span>Tell the MasterKey team where you're stuck. If you need hands-on help, they'll bring in a certified implementer.</span></div><a class="btn" href="#expert?from=${encodeURIComponent(from)}&why=${encodeURIComponent(why)}">Talk to the MasterKey team</a>`;
function missed(L, qz) {
  S.miss = S.miss || {}; S.miss[L.id] = (S.miss[L.id] || 0) + 1; save();
  if (S.miss[L.id] >= 2 && !$('.stuck-quiz', qz)) {
    const c = document.createElement('div'); c.className = 'stuck stuck-quiz';
    c.innerHTML = stuckHTML(L.id, 'This part trips a lot of people up.', 'quiz');
    $('#qStatus', qz).after(c);
  }
}
const ASSESS = [
  ['size','Does your company have 10 or more people (or roughly $5-10M in revenue)?','MasterKey works best for businesses with enough repeated work to systematize. Smaller teams may be better off starting with the scan and one agent.'],
  ['repeat','Does the same work happen the same way most weeks?','Agents need a repeatable process. If the business is still finding its offer or process, it may be worth waiting.'],
  ['access','Can you connect your work email and calendar, or do you know who can?','The scan needs real work history from connected tools.'],
  ['time','Can one person give this about 5 hours over the next two weeks?','The admin track takes about 5 hours, plus coordinating people.'],
  ['scope','Can you start with just one department or workflow?','A first scan of everything gives a long report nobody owns.'],
  ['reg','Can you keep health, payment or personal financial data out of the first scan?','Regulated data needs a careful setup and your security review first.']
];
function assessVerdict(a) {
  const no = ASSESS.filter(([k]) => a[k] === 'no');
  if (Object.keys(a).length < ASSESS.length) return null;
  const fit = a.size !== 'no' && a.repeat !== 'no';
  return {no, kind: !no.length ? 'diy' : !fit ? 'fit' : no.length >= 2 ? 'help' : 'standby'};
}
function renderPaths(root) {
  S.assess = S.assess || {}; const a = S.assess.answers = S.assess.answers || {};
  const qs = $('#assessQs', root), out = $('#assessOut', root);
  const draw = () => {
    qs.innerHTML = ASSESS.map(([k, q], i) => `<div class="q"><p>${i + 1}. ${esc(q)}</p><div class="yn"><button type="button" data-k="${k}" data-v="yes" class="${a[k] === 'yes' ? 'on' : ''}" aria-pressed="${a[k] === 'yes'}">Yes</button><button type="button" data-k="${k}" data-v="no" class="${a[k] === 'no' ? 'on' : ''}" aria-pressed="${a[k] === 'no'}">No</button></div></div>`).join('');
    $$('[data-k]', qs).forEach(b => b.onclick = () => { a[b.dataset.k] = b.dataset.v; save(); draw(); });
    const v = assessVerdict(a);
    S.assess.verdict = v ? v.kind : null; save();
    if (!v) { out.innerHTML = `<span class="hint">${Object.keys(a).length} of ${ASSESS.length} answered</span>`; return; }
    const reasons = v.no.length ? `<ul style="margin:10px 0 0">${v.no.map(([, , w]) => `<li>${esc(w)}</li>`).join('')}</ul>` : '';
    const talk = `<a class="btn" href="#expert?from=paths&why=readiness">Talk to the MasterKey team</a>`, diy = `<a class="btn ghost" href="#roles">Start the free course</a>`;
    const box = (h, p, btns) => `<div class="big" style="font-size:22px">${h}</div><p style="margin:6px 0 0">${p}</p>${reasons}<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${btns}</div>`;
    out.innerHTML = v.kind === 'diy' ? box('You\'re ready to do it yourself.', 'The free course will take you from scan to agents in use. If you get stuck, help is one click away on every lesson.', '<a class="btn" href="#roles">Start the free course</a>')
      : v.kind === 'fit' ? box('Start small, and talk to us about fit.', 'You can still run your free scan and read your report. Before a full rollout, the MasterKey team can tell you whether now is the right time.', talk + diy)
      : v.kind === 'help' ? box('You\'ll likely want some hands-on help.', 'You can start on your own, but talk to the MasterKey team early. Here\'s why:', talk + `<a class="btn ghost" href="#ctoled">How hands-on help works</a>`)
      : box('Do it yourself, with help on standby.', 'You can start on your own. Watch this:', diy + talk);
  };
  draw();
}
function leadContext(from, why) {
  const tl = track(), done = tl.filter(l => S.done[l.id]).length, r = role();
  const fromL = LBYID[from];
  const misses = Object.entries(S.miss || {}).filter(([, n]) => n > 0).map(([k, n]) => `${LBYID[k] ? LBYID[k].title : k} (${n})`).join(', ');
  const verdict = S.assess && S.assess.verdict ? {diy:'ready to do it yourself', fit:'fit question (size or repeatable process)', help:'likely needs hands-on help', standby:'DIY with help on standby', cto:'likely needs hands-on help'}[S.assess.verdict] : '';
  const rows = [
    ['Came from', fromL ? fromL.title : (from || 'direct')],
    ['Trigger', {quiz:'missed quiz answers', readiness:'fit check', roi:'ROI under 50% of forecast', stuck:'stuck prompt on lesson', returning:'came back after a week away'}[why] || why],
    ['Role', r ? ROLE_NAMES[r.id] : ''],
    ['Course progress', `${done} of ${tl.length} lessons`],
    ['Goal', P('hours') ? goalSentence(plainV) : ''],
    ['Tools', P('tools')],
    ['Fit check', verdict],
    ['Quiz misses', misses]
  ].filter(([, v]) => v);
  return {rows, text: rows.map(([k, v]) => `${k}: ${v}`).join('\n')};
}
function renderExpert(root) {
  const qFrom = ROUTE_Q.get('from'), qWhy = ROUTE_Q.get('why');
  if (qFrom) { S.lastFrom = qFrom; S.lastWhy = qWhy || 'stuck'; save(); }
  const from = qFrom || S.lastFrom || '', why = qWhy || S.lastWhy || '';
  const ctx = leadContext(from, why);
  $('#exCtx', root).textContent = ctx.text || 'Nothing yet. That\'s fine.';
  const f = $('#leadForm', root), el = n => f.elements[n], err = $('#leadErr', root), done = $('#leadDone', root);
  const book = BOOKING_URL ? `<a class="btn" href="${esc(BOOKING_URL)}" target="_blank" rel="noopener">Book a time now</a>` : '';
  if (book) $('#bookTop', root).innerHTML = `<div class="banner"><span>Prefer to pick a time yourself?</span>${book}</div>`;
  el('fullname').value = S.name || ''; el('company').value = P('company');
  const r = role(); if (r) el('role').value = ROLE_NAMES[r.id];
  const fromL = LBYID[from];
  el('stuck').placeholder = fromL ? `e.g. what happened when you got to "${fromL.title}"` : 'e.g. our scan finished but the report doesn\'t match our week';
  const showDone = (how) => {
    f.hidden = true; done.hidden = false;
    done.innerHTML = how === 'sent'
      ? `<b>Request sent.</b> The MasterKey team will reply by email.${book ? ' Or book a time now: ' + book : ''} <br><a href="#${esc(from && LBYID[from] ? from : 'welcome')}">← Back to where you were</a>`
      : how;
  };
  if (S.leadSent) {
    const n = document.createElement('div'); n.className = 'banner';
    n.innerHTML = `<span>You sent a request on ${new Date(S.leadSent).toLocaleDateString()}. Need something else? Send another below.</span>`;
    $('#bookTop', root).appendChild(n);
  }
  f.onsubmit = async e => {
    e.preventDefault(); err.textContent = '';
    if (el('_honey').value) return;
    const name = el('fullname').value.trim(), email = el('email').value.trim(), company = el('company').value.trim(), stuck = el('stuck').value.trim();
    const missing = [!name && 'your name', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 'a valid work email', !company && 'your company', !stuck && 'what you need help with', !el('consent').checked && 'the consent box'].filter(Boolean);
    if (missing.length) { err.textContent = 'Please add ' + missing.join(', ') + '.'; return; }
    S.name = S.name || name; if (!P('company')) S.plan.company = company; save();
    const payload = {
      _subject: `MasterKey Academy: help request from ${company}`, _template: 'table', _captcha: 'false', _replyto: email,
      Name: name, Email: email, Company: company, Phone: el('phone').value.trim(), Role: el('role').value, 'Team size': el('size').value,
      Scan: el('scan').value, 'Needs help with': stuck, ...Object.fromEntries(ctx.rows), Page: location.href
    };
    const btn = $('#leadBtn', root); btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
      const res = await fetch(LEAD_ENDPOINT, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify(payload), signal: ac.signal});
      clearTimeout(t);
      const j = await res.json().catch(() => ({}));
      if (!res.ok || String(j.success) !== 'true') throw new Error(j.message || 'send failed');
      S.leadSent = Date.now(); save(); showDone('sent');
    } catch (x) {
      const body = Object.entries(payload).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n');
      const mail = `mailto:${LEAD_EMAIL}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
      showDone(`<b>We couldn't send that automatically.</b> Your details are below. Email them to <a href="${mail}">${esc(LEAD_EMAIL)}</a> and the MasterKey team will reply.<pre class="ctx">${esc(body)}</pre><button class="btn small" id="copyLead" type="button">Copy details</button>`);
      $('#copyLead', root).onclick = () => copy(body);
    }
    btn.disabled = false; btn.textContent = 'Send my request';
  };
}

// ---------- plan & templates ----------
const PLAN_FIELDS = {
  goal: [
    ['company','Company name','Acme Co.'], ['workflow','Workflow to fix first','inbound lead follow-up'], ['team','Team in scope','the sales team'],
    ['hours','Hours to win back per week','15','number'], ['date','Target date','','date'], ['tools','Tools that workflow runs on','Salesforce, Gmail, Google Calendar, Zoom'],
    ['hoursFor','What the won-back hours will go to','more client calls and faster replies', 'text', 'wide']],
  people: [['sponsor','Business owner',''], ['admin','MasterKey admin',''], ['owner','Department lead(s)',''], ['sfadmin','Implementer (if any)',''], ['champions','Champions (1 per 10 users)',''], ['people','Number of people in scope','8','number']],
  nums: [['baseline','Baseline hours per week (from your survey)','','number'], ['cost','Loaded hourly cost ($)','60','number'], ['flag','Where to flag a bad agent output','#agent-feedback in Slack']]
};
const P = k => (S.plan[k] || '').toString().trim();
const ph = (k, label) => P(k) ? esc(k === 'date' ? fmtDate(P(k)) : P(k)) : `<span class="ph">[${esc(label)}]</span>`;
const plainV = (k, label) => P(k) ? (k === 'date' ? fmtDate(P(k)) : P(k)) : `[${label}]`;
const goalSentence = (f) => `Win back ${f('hours','hours')} hours a week across ${f('team','team')} on ${f('workflow','workflow')} by ${f('date','date')}.`;

function renderPlan(root) {
  const build = (id, list) => {
    $('#' + id, root).innerHTML = list.map(([k, label, eg, type, wide]) =>
      `<label class="${wide ? 'wide' : ''}">${esc(label)}<input data-k="${k}" type="${type || 'text'}" ${type === 'number' ? 'min="0" inputmode="decimal"' : ''} value="${esc(P(k))}" placeholder="${eg ? 'e.g. ' + esc(eg) : ''}"></label>`).join('');
  };
  build('planGoal', PLAN_FIELDS.goal); build('planPeople', PLAN_FIELDS.people); build('planNums', PLAN_FIELDS.nums);
  const out = $('#goalOut', root);
  const draw = () => {
    const missing = ['hours','team','workflow','date'].filter(k => !P(k));
    out.innerHTML = `<div class="lbl">Your goal statement</div><div style="font-size:19px;font-weight:500;margin:4px 0 10px">${goalSentence(ph)}</div>` +
      (missing.length ? `<div class="hint">Fill in the highlighted parts to complete it.</div>` : `<button class="btn small" id="copyGoal">Copy goal</button>`);
    const cg = $('#copyGoal', out); if (cg) cg.onclick = () => copy(goalSentence(plainV));
  };
  $$('input[data-k]', root).forEach(inp => inp.oninput = () => { S.plan[inp.dataset.k] = inp.value; save(); draw(); });
  draw();
}

const TEMPLATES = [
  {id:'announce', title:'1. Team announcement', when:'Before the scan · sent by the business owner', body:f =>
`Subject: How we're freeing up time on ${f('workflow','workflow')}

Hi team,

Starting this week we're using MasterKey to see how ${f('workflow','workflow')} actually runs, so we can hand repetitive busywork to AI assistants.

Our goal: win back ${f('hours','hours')} hours a week across ${f('team','team')} by ${f('date','date')}.

What it looks at: only the tools we choose to connect for this (${f('tools','tools')}). Each one is opt-in and read-only, and nothing is scanned until we start it. It maps how work flows, not anyone's performance.

What the hours are for: ${f('hoursFor','what the hours are for')}.

What I need from you: a two-minute estimate of your weekly hours on this work. ${f('admin','MasterKey admin')} will send it today. Otherwise, keep working as normal.

Questions? Ask me or ${f('admin','MasterKey admin')}.

${f('sponsor','Business owner')}`},
  {id:'survey', title:'2. Baseline survey', when:'While the scan runs · sent by the MasterKey admin', body:f =>
`Subject: 2-minute question about ${f('workflow','workflow')}

Hi,

Quick one, no wrong answers. Please reply by end of day tomorrow:

1. In a normal week, how many hours do you spend on ${f('workflow','workflow')}?
2. Which part of it is the most repetitive?
3. What's one step you'd happily never do again?

Your answers give us a "before" number, so we can prove whether the assistants actually help.

Thanks,
${f('admin','MasterKey admin')}`},
  {id:'ready', title:'3. Report-reviewed note', when:'After Module 2 · sent by the MasterKey admin', body:f =>
`Subject: What we found, and what we're starting with

Hi team,

Our TimeScout report is in, and we've checked it against your survey answers. The top findings:
1. [Finding 1]: about [X] hours a week
2. [Finding 2]: about [X] hours a week
3. [Finding 3]: about [X] hours a week

We're starting with (approved by ${f('sponsor','Business owner')}):
- [Agent name], owned by [owner], target [date]

Every new assistant starts on Drafts only: it prepares the work, and a person approves it before anything goes out.

${f('admin','MasterKey admin')}`},
  {id:'pilot', title:'4. First agent on', when:'When the first agent switches on · sent by the department lead', body:f =>
`Subject: You're the first to try [agent name]

Hi [names],

You're the first users of [agent name]. For the next two weeks it will draft [what it drafts], and you review and approve before anything goes out.

What I need:
- Use it on your real work every day, from Today in MasterKey.
- Flag anything wrong in ${f('flag','where to flag bad outputs')}, with a screenshot if you can.
- A 15-minute check-in on [day] to tell me what's working.

Thanks for going first.
${f('owner','Department lead')}`},
  {id:'golive', title:'5. Go-live message', when:'Team launch · sent by the owner and a champion', body:f =>
`Subject: Starting today: [agent name]

Hi team,

From today, [agent name] handles [task] for ${f('team','team')}.

How to use it: open Today in MasterKey, review its drafts and answer its asks.
What changes today: [old step] is retired. The assistant drafts it; you review and send.
How to flag an error: ${f('flag','where to flag bad outputs')}. We answer every flag within one business day.
Office hours: ${f('champions','Champions')} are running them for the next two weeks.

The hours this frees up go to ${f('hoursFor','what the hours are for')}.

${f('sponsor','Business owner')}`},
  {id:'offswitch', title:'6. Off-switch plan', when:'Before go-live · written by the MasterKey admin', body:f =>
`OFF-SWITCH PLAN: [agent name]

Trust level: Drafts only (since [date])
Who can switch it off: ${f('admin','MasterKey admin')} (backup: ${f('sponsor','Business owner')})
How: switch the agent off in MasterKey
When we switch it off: a wrong message reaches a customer · it acts in a no-go zone · fewer than 80% of drafts approved in a weekly check · running cost above forecast for two weeks
Manual fallback: [the old step, who does it, where the template lives]
Who we tell: ${f('team','team')} via [channel], and ${f('sponsor','Business owner')}
Back to manual within: [target, e.g. same day]`},
  {id:'day30', title:'7. Day-30 update', when:'Day 30 · sent by the MasterKey admin', body:f =>
`Subject: Day 30: what the assistants have saved

Hi team,

Goal: ${f('hours','hours')} hours a week on ${f('workflow','workflow')} by ${f('date','date')}.
Baseline: ${f('baseline','baseline hours')} hours a week.

This month:
- Hours won back per week: [X] ([Y]% of forecast)
- People using it weekly: [X] of ${f('people','people in scope')}
- Drafts approved without edits: [X]%
- Fixes we made from your flags: [list]

Next: [keep / fix / switch off] for each assistant, and [next hire].

Thank you for the flags; they're what make it better.
${f('admin','MasterKey admin')}`}
];

function renderTemplates(root) {
  const list = $('#tplList', root);
  list.innerHTML = TEMPLATES.map(t => `<article class="tpl" id="tpl-${t.id}"><header><div><b>${esc(t.title)}</b><small>${esc(t.when)}</small></div><button class="btn small" data-copy="${t.id}">Copy text</button></header><pre>${t.body(ph)}</pre></article>`).join('');
  $$('[data-copy]', list).forEach(b => b.onclick = () => copy(TEMPLATES.find(t => t.id === b.dataset.copy).body(plainV)));
}

// ---------- build list ----------
const BL_COLS = [['name','text'],['owner','text'],['problem','text'],['hours','number'],['cost','number'],['score','number'],['rule','select'],['date','date']];
const RULES = ['Drafts only','Asks first','On its own'];
function renderBuildList(root) {
  if (!S.bl.length) S.bl = [{rule: RULES[0]}];
  const body = $('#blBody', root), sum = $('#blSum', root);
  const draw = () => {
    body.innerHTML = S.bl.map((r, i) => `<tr>${BL_COLS.map(([k, t]) => `<td>${t === 'select'
      ? `<select data-i="${i}" data-k="${k}" aria-label="Trust level">${RULES.map(o => `<option ${r[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
      : `<input data-i="${i}" data-k="${k}" type="${t}" ${t === 'number' ? 'min="0"' : ''} value="${esc(r[k] || '')}" aria-label="${k}">`}</td>`).join('')}<td class="no-print"><button class="x" data-del="${i}" aria-label="Remove row">×</button></td></tr>`).join('');
    $$('[data-k]', body).forEach(el => el.oninput = el.onchange = () => { S.bl[+el.dataset.i][el.dataset.k] = el.value; save(); total(); });
    $$('[data-del]', body).forEach(b => b.onclick = () => { S.bl.splice(+b.dataset.del, 1); if (!S.bl.length) S.bl.push({rule: RULES[0]}); save(); draw(); });
    total();
  };
  const total = () => {
    const h = S.bl.reduce((a, r) => a + (+r.hours || 0), 0), c = S.bl.reduce((a, r) => a + (+r.cost || 0), 0);
    const warn = S.bl.length > 3 ? ' <span class="verdict v-mid">More than 3 agents: consider moving some to wave 2</span>' : '';
    const cost = +P('cost');
    sum.innerHTML = `<b>${S.bl.length}</b> agent${S.bl.length === 1 ? '' : 's'} · forecast <b>${h}</b> hours a week · run cost <b>${money(c)}</b> a week${cost ? ` · net value about <b>${money(h * cost - c)}</b> a week` : ''}${warn}`;
  };
  $('#blAdd', root).onclick = () => { S.bl.push({rule: RULES[0]}); save(); draw(); };
  $('#blCsv', root).onclick = () => {
    const head = ['Agent name','Owner','Problem it solves','Forecast hours/week','Run cost/week ($)','Rubric score','Review rule','Target live date'];
    download('masterkey-build-list.csv', [head, ...S.bl.map(r => BL_COLS.map(([k]) => r[k] || ''))].map(r => r.map(csvCell).join(',')).join('\n'));
  };
  draw();
}

// ---------- lesson-specific wiring ----------
function wire(id, root) {
  // persistent checklists (template ones + "do it now")
  $$('.checklist', root).forEach(cl => {
    const k = cl.dataset.key; if (!k) return; S.checks[k] = S.checks[k] || [];
    $$('input', cl).forEach((inp, i) => {
      inp.checked = !!S.checks[k][i];
      inp.onchange = () => { S.checks[k][i] = inp.checked; save(); if (id === 'cert') certCheck(); };
    });
  });
  if (id === 'welcome') {
    const ni = $('#nameIn', root); ni.value = S.name || ''; ni.oninput = () => { S.name = ni.value.trim(); save(); };
    const rd = $('#roles', root);
    const draw = () => {
      rd.innerHTML = ROLES.map(r => `<button type="button" class="role ${S.role === r.id ? 'sel' : ''}" data-id="${r.id}" aria-pressed="${S.role === r.id}"><b>${esc(ROLE_NAMES[r.id])}</b><small>${esc(r.who)}<br>${r.req.length} lessons · ${esc(r.time)}</small></button>`).join('');
      $$('.role', rd).forEach(b => b.onclick = () => { S.role = b.dataset.id; save(); draw(); renderNav('welcome'); });
      const r = role(), nx = nextUp();
      $('#roleNote', root).innerHTML = r ? `<b>${esc(ROLE_NAMES[r.id])}:</b> ${r.req.length} lessons, ${esc(r.time)}. They're marked <span class="req" style="margin:0">REQ</span> in the menu.` : 'Pick a role to see your lessons. You can change it any time.';
      const go = $('#goBtn', root), start = $('#startBtn', root);
      const target = nx ? nx.id : (r ? r.req[0] : 'roles');
      go.href = start.href = '#' + target;
      const anyDone = Object.keys(S.done).length > 0;
      start.textContent = anyDone && nx ? `Continue: ${nx.title}` : (anyDone ? 'Review the course' : 'Start the course');
      go.textContent = anyDone && nx ? `Continue: ${nx.title} →` : 'Start my lessons →';
      const bb = $('#backBanner', root);
      if (bb && AWAY_MS > 7 * 864e5 && anyDone && nx) bb.innerHTML = `<div class="banner"><span><b>Welcome back.</b> You stopped at ${esc(nx.title)}. Pick up where you left off, or ask the MasterKey team for help.</span><span style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn small" href="#${nx.id}">Continue</a><a class="btn small ghost" href="#expert?from=${nx.id}&why=returning">Get help</a></span></div>`;
    };
    draw();
  }
  if (id === 'plan') renderPlan(root);
  if (id === 'paths') renderPaths(root);
  if (id === 'expert') renderExpert(root);
  if (id === 'templates') renderTemplates(root);
  if (id === 'buildlist') renderBuildList(root);
  if (id === 'glossary') $('#glossList', root).innerHTML = GLOSSARY.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('');
  if (id === 'help') {
    const rb = $('#resetBtn', root), note = $('#resetNote', root); let armed = false;
    rb.onclick = () => {
      if (!armed) { armed = true; rb.textContent = 'Click again to erase everything'; note.textContent = 'This erases your progress, answers, plan and build list on this device.'; setTimeout(() => { armed = false; rb.textContent = 'Reset all progress'; note.textContent = ''; }, 5000); return; }
      S = blank(); save(); note.textContent = 'All progress erased.'; renderNav('help'); rb.textContent = 'Reset all progress'; armed = false;
    };
    $('#exportBtn', root).onclick = () => download('masterkey-academy-progress.json', JSON.stringify(S, null, 2), 'application/json');
  }
  if (id === 'm2') {
    const F = [['Hours saved','10+ hrs/wk','<1 hr/wk'],['Frequency','Many times a day','Monthly'],['Rule clarity','Checklist-simple','Judgment every time'],['Error cost','Cheap to undo','Reaches customer/money/legal'],['Checkable day one','Checkable the same day','Not for weeks']];
    const v = Array.isArray(S.rubric) && S.rubric.length === 5 ? S.rubric : [4,5,4,4,5];
    const rows = $('#rubricRows', root), out = $('#rubricOut', root);
    rows.innerHTML = F.map((f, i) => `<div class="row"><span title="5 = ${esc(f[1])} · 1 = ${esc(f[2])}">${esc(f[0])}</span><input type="range" min="1" max="5" value="${v[i]}" data-i="${i}" aria-label="${esc(f[0])}, 1 to 5"><span class="val">${v[i]}</span></div>`).join('');
    const calc = () => {
      const s = v.reduce((a, b) => a * b, 1);
      const verdict = s >= 500 ? ['Build now','v-good'] : s >= 150 ? ['Later','v-mid'] : ['Not now','v-bad'];
      const extra = (v[2] === 1 || v[3] === 1) ? '<div style="margin-top:8px;font-size:14px"><b>Rule clarity or error cost is 1:</b> keep this agent on Drafts only for good.</div>' : '';
      out.innerHTML = `<span class="big">${s.toLocaleString()}</span><span class="verdict ${verdict[1]}">${verdict[0]}</span><div style="font-size:13px;color:var(--ink-2);margin-top:4px">${v.join(' × ')} · 500+ build now · 150-499 later · under 150 not now</div>${extra}<div style="margin-top:10px"><a class="btn small" href="#buildlist">Add to build list →</a></div>`;
    };
    $$('input', rows).forEach(inp => inp.oninput = () => { v[+inp.dataset.i] = +inp.value; inp.nextElementSibling.textContent = inp.value; S.rubric = v; save(); calc(); });
    calc();
  }
  if (id === 'm4') {
    const b = $('#chkCsv', root);
    if (b) b.onclick = () => {
      const rows = [['#','Real example (from last week)','Expected output','Draft OK without edits? (Y/N)','Edits needed','Should it hit a no-go zone? (Y/N)','Went to the right person? (Y/N)','Notes']];
      for (let i = 1; i <= 10; i++) rows.push([i, '', '', '', '', i > 8 ? 'Y' : '', '', '']);
      download('masterkey-first-agent-check-sheet.csv', rows.map(r => r.map(csvCell).join(',')).join('\n'));
    };
  }
  if (id === 'measure') {
    const el = ['rForecast','rHours','rCost','rRun'].map(i => $('#' + i, root)), out = $('#roiOut', root);
    if (Array.isArray(S.roi)) el.forEach((e, i) => { if (S.roi[i] != null) e.value = S.roi[i]; });
    else if (+P('cost')) el[2].value = P('cost');
    const calc = () => { const [f, h, c, r] = el.map(e => Math.max(0, +e.value || 0)); S.roi = [f, h, c, r]; save();
      const wk = h * c - r, pct = f ? Math.round(100 * h / f) : 0;
      const v = !f ? ['Enter a forecast','v-mid'] : pct < 50 ? ['Under 50% at day 30: fix it or switch it off','v-bad'] : pct < 70 ? ['On watch: below the 70% day-90 target','v-mid'] : ['On track: 70%+ of forecast','v-good'];
      out.innerHTML = `<div><span class="big">${money(wk)}</span> <span style="color:var(--ink-2)">per week · about ${money(wk * 52)} a year</span></div><div style="margin-top:8px">${f ? pct + '% of forecast hours' : ''} <span class="verdict ${v[1]}">${v[0]}</span></div>${f && pct < 50 ? `<div class="stuck" style="margin:14px 0 0">${stuckHTML('measure', 'Want help finding out why?', 'roi')}</div>` : ''}`; };
    el.forEach(e => e.oninput = calc); calc();
  }
  if (id === 'cert') wireExam(root);
}

function wireExam(root) {
  const ex = $('#exam', root);
  ex.innerHTML = quizHTML(EXAM);
  if (!S.answers || typeof S.answers !== 'object') S.answers = {};
  const sel = S.answers;
  const graded = () => S.exam !== null && S.exam !== undefined;
  const paint = () => {
    $$('.q', ex).forEach(qEl => {
      const i = qEl.dataset.i;
      $$('.opt', qEl).forEach(b => {
        const j = +b.dataset.j; b.classList.remove('right','wrong','picked');
        if (graded()) { b.disabled = true; if (j === EXAM[i].a) b.classList.add('right'); else if (sel[i] === j) b.classList.add('wrong'); }
        else { b.disabled = false; if (sel[i] === j) b.classList.add('picked'); b.setAttribute('aria-pressed', String(sel[i] === j)); }
      });
    });
  };
  $$('.opt', ex).forEach(b => b.onclick = () => { if (graded()) return; sel[b.closest('.q').dataset.i] = +b.dataset.j; save(); paint(); st.textContent = `${Object.keys(sel).length} of 10 answered`; });
  const sub = $('#examSubmit', root), ret = $('#examRetake', root), st = $('#examStatus', root);
  const show = () => {
    paint();
    if (graded()) { sub.style.display = 'none'; ret.style.display = '';
      st.innerHTML = S.exam >= 8 ? `<b style="color:var(--good)">Passed: ${S.exam}/10.</b>` : `<b style="color:var(--bad)">${S.exam}/10. You need 8 to pass.</b> The correct answers are shown in green. Review the lessons and retake.`; }
    else { sub.style.display = ''; ret.style.display = 'none'; st.textContent = `${Object.keys(sel).length} of 10 answered`; }
    certCheck();
  };
  sub.onclick = () => {
    const n = Object.keys(sel).length;
    if (n < 10) { st.textContent = `Answer all 10 first (${n} of 10 answered).`; const first = $$('.q', ex).find(q => sel[q.dataset.i] == null); if (first) first.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    S.exam = EXAM.reduce((n, q, i) => n + (sel[i] === q.a ? 1 : 0), 0); if (S.exam >= 8) S.certDate = S.certDate || Date.now(); save(); show();
  };
  ret.onclick = () => { S.exam = null; for (const k in sel) delete sel[k]; save(); show(); };
  show();
}

function certCheck() {
  const ex = S.checks.exercises || [], exN = [0,1,2,3,4].filter(i => ex[i]).length, passed = S.exam >= 8;
  const c = $('#certificate'), st = $('#certStatus'); if (!c) return;
  if (passed && exN === 5) {
    if (!S.done.cert) { S.done.cert = Date.now(); save(); renderNav('cert'); }
    c.classList.add('show');
    $('#certName').textContent = S.name || 'Your name here';
    $('#certMeta').textContent = `Final exam ${S.exam}/10 · ${new Date(S.certDate || Date.now()).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'})}`;
    st.innerHTML = S.name ? '' : 'Add your name on the <a href="#welcome">Welcome</a> page to print it on the certificate.';
  } else {
    c.classList.remove('show');
    const left = []; if (exN < 5) left.push(`${5 - exN} exercise${5 - exN === 1 ? '' : 's'}`); if (!passed) left.push('a passing exam score (8/10)');
    st.textContent = 'Your certificate unlocks after: ' + left.join(' and ') + '.';
  }
}

// ---------- render ----------
function lessonIntro(L) {
  if (!L.plain) return null;
  const d = document.createElement('div'); d.className = 'intro';
  const who = L.for.includes('all') ? 'Everyone' : L.for.map(r => ROLE_NAMES[r]).join(', ');
  d.innerHTML = `<div class="plain"><span class="tag">In plain English</span><p>${esc(L.plain)}</p></div><div class="meta" style="margin:0"><span class="chip">⏱ ${esc(L.time)}</span><span class="chip">For: ${esc(who)}</span></div><div class="outcome"><b>When you finish, you'll have</b> ${esc(L.outcome)}</div>`;
  return d;
}
function doItNow(L) {
  if (!L.tasks) return null;
  const s = document.createElement('section'); s.className = 'doit';
  s.innerHTML = `<span class="eyebrow">Do it now</span><h2 style="margin-top:12px">Your next steps</h2><p style="color:var(--ink-2)">Tick these off on your own company as you go. Your ticks are saved.</p><div class="checklist" data-key="do-${L.id}">${L.tasks.map(t => `<label><input type="checkbox"><span class="t">${t}</span></label>`).join('')}</div>`;
  return s;
}

function buildLesson(L, forPrint) {
  const wrap = document.createElement('div'); wrap.className = forPrint ? 'lesson lesson-print' : 'lesson';
  const tpl = document.getElementById(L.tpl);
  if (!tpl) { wrap.innerHTML = '<h1>Page not found</h1><p><a href="#welcome">Go to the start</a></p>'; return wrap; }
  if (!forPrint && L.plain) {
    const pos = track().findIndex(t => t.id === L.id);
    const c = document.createElement('div'); c.className = 'crumb';
    c.textContent = pos >= 0 ? `Lesson ${pos + 1} of ${track().length} in your track` : L.group;
    wrap.appendChild(c);
  }
  wrap.appendChild(tpl.content.cloneNode(true));
  const intro = lessonIntro(L);
  if (intro) { const anchor = $('.lede', wrap) || $('h1', wrap); anchor.after(intro); }
  if (!forPrint) {
    const d = doItNow(L); if (d) wrap.appendChild(d);
    if (STUCK[L.id]) { const c = document.createElement('div'); c.className = 'stuck'; c.innerHTML = stuckHTML(L.id, STUCK[L.id], 'stuck'); wrap.appendChild(c); }
  }
  return wrap;
}

function render() {
  const rawHash = decodeURIComponent((location.hash || '#welcome').slice(1)) || 'welcome';
  const qi = rawHash.indexOf('?');
  const id = (qi >= 0 ? rawHash.slice(0, qi) : rawHash) || 'welcome';
  ROUTE_Q = new URLSearchParams(qi >= 0 ? rawHash.slice(qi + 1) : '');
  document.body.className = 'route-' + id.replace(/[^a-z0-9-]/gi, '');
  closeMenu();
  if (id === 'print') {
    renderNav('');
    main.innerHTML = '';
    const bar = document.createElement('div'); bar.className = 'lesson no-print';
    bar.innerHTML = '<h1>Full course</h1><p class="lede">Every lesson on one page, ready to print or save as a PDF.</p><button class="btn" onclick="window.print()">Print or save as PDF</button>';
    main.appendChild(bar);
    LESSONS.filter(l => l.plain).forEach(l => main.appendChild(buildLesson(l, true)));
    window.scrollTo(0, 0); return;
  }
  const L = LBYID[id] || LBYID.welcome;
  S.last = L.id; S.lastSeen = Date.now(); save();
  renderNav(L.id);
  const wrap = buildLesson(L, false);
  if (L.quiz) lessonQuiz(L, wrap);
  // prev / next
  const idx = LESSONS.indexOf(L), prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const nr = document.createElement('div'); nr.className = 'navrow';
  nr.innerHTML = `${prev ? `<a class="btn ghost" href="#${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#${next.id}">${esc(next.title)} →</a>` : ''}`;
  wrap.appendChild(nr);
  const foot = $('#foot').cloneNode(true); foot.hidden = false; foot.removeAttribute('id'); wrap.appendChild(foot);
  main.innerHTML = ''; main.appendChild(wrap);
  document.title = (L.id === 'welcome' ? '' : L.title + ' · ') + 'MasterKey Academy';
  window.scrollTo(0, 0);
  try { wire(L.id, wrap); } catch (e) { console.error(e); const n = document.createElement('div'); n.className = 'note'; n.innerHTML = '<b>Something went wrong on this page.</b> Try reloading. If it keeps happening, use Reset on the <a href="#help">Getting help</a> page.'; wrap.prepend(n); }
  const h = $('h1', wrap); if (h && location.hash) { h.setAttribute('tabindex', '-1'); h.focus({preventScroll: true}); }
}

window.addEventListener('hashchange', render);
render();
})();
