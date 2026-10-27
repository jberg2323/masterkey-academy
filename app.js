/* Masterkey Academy — app logic. Plain JS, no dependencies. */
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
const ROLE_NAMES = {sponsor:'Executive sponsor', admin:'Masterkey admin', owner:'Process owner', sfadmin:'Salesforce admin', champion:'Champion', user:'End user', withcto:'Working with a CTO'};
const LESSONS = [
  {id:'welcome', group:'Start here', title:'Welcome', tpl:'t-welcome', kind:'page'},
  {id:'roles', group:'Start here', title:'Who does what', tpl:'t-roles', time:'5 min', for:['all'],
    plain:'A rollout needs six jobs covered: someone who sets the goal, someone who runs Masterkey, someone who knows each team\'s process, a Salesforce admin, a few champions, and the people who will use the agents.',
    outcome:'every role assigned to a named person.',
    tasks:['Put a name next to each role in <a href="#plan">Your rollout plan</a>', 'Tell each person which lessons they need (they\'re marked REQ once they pick their role)', 'Book 30 minutes with your executive sponsor for this week'],
    quiz:[
      {q:'Who owns the goal, the budget and the final go/no-go on each agent?', o:['Masterkey admin','Champion','Executive sponsor','Salesforce admin'], a:2, why:'The executive sponsor owns the goal (hours to win back), budget and go/no-go.'},
      {q:'How many champions should you have?', o:['One per company','One per 10 users','One per team lead','One per agent'], a:1, why:'One respected doer per 10 users.'},
      {q:'When must every role be assigned by name?', o:['Before Module 0 starts','After the first report','At go-live','At day 30'], a:0, why:'Assign every role by name before Module 0 starts.'}]},
  {id:'plan', group:'Start here', title:'Your rollout plan', tpl:'t-plan', kind:'tool'},
  {id:'paths', group:'Start here', title:'DIY or with a CTO?', tpl:'t-paths', kind:'tool'},
  {id:'ctoled', group:'With a CTO', title:'Rolling out with a CTO', tpl:'t-ctoled', time:'10 min', for:['withcto','sponsor'],
    plain:'An experienced CTO does the technical parts of the rollout with you: connecting tools, scoring the report, building and testing agents. You still own the goal, the people and the decisions.',
    outcome:'a clear split of who does what, and what to bring to your first CTO call.',
    tasks:['Request your <a href="#expert?from=ctoled">free 30-minute CTO call</a>', 'Name your executive sponsor and Masterkey admin in <a href="#plan">Your rollout plan</a>', 'Write your goal with a number and a date', 'List the tools the workflow runs on and who can grant admin access', 'If you\'ve run a scan, have the Time Scout Report open for the call'],
    quiz:[
      {q:'In a CTO-led rollout, who owns the goal and approves each agent?', o:['The CTO','Your executive sponsor','Masterkey','Salesforce'], a:1, why:'The CTO does the technical work; your sponsor still owns the goal and the go/no-go on every agent.'},
      {q:'What should you bring to the first CTO call?', o:['Nothing; the CTO figures it out','Your goal with a number, the workflow, its tools and who can grant access','A finished agent','Your Salesforce password'], a:1, why:'Those four things let the CTO size the work in 30 minutes. Never share passwords; you grant access yourself.'}]},
  {id:'expert', group:'With a CTO', title:'Get a free CTO call', tpl:'t-expert', kind:'tool'},
  {id:'m0', group:'The 5 modules', title:'Module 0 — Setup', tpl:'t-m0', time:'Under 1 hour', for:['sponsor','admin'],
    plain:'Decide exactly what you want to fix and how you\'ll measure it, tell your team, then create your Masterkey account and connect only the tools that workflow uses.',
    outcome:'an account, the right tools connected, a written scope, and a team that knows what\'s happening.',
    tasks:['Write your goal with a number and a date in <a href="#plan">Your rollout plan</a>', 'Pick one team or one workflow to scan first', 'Send the <a href="#templates">team announcement</a> before connecting anything', 'Check who can approve company-wide connections (Salesforce, Microsoft 365)', 'Create your account at <a href="https://masterkey.ai" target="_blank" rel="noopener">masterkey.ai</a> → Get Started, with your work email', 'Connect only the tools the target workflow runs on', 'Write down the scopes you approved on each connection screen'],
    quiz:[
      {q:'Which is a valid business goal?', o:['Grow efficiency with AI','Use Masterkey across the company','Win back 15 hours a week across the sales team by January 31','Make the team happier'], a:2, why:'One line, with a number and a date. No number, no rollout.'},
      {q:'What should your first scan scope be?', o:['The whole company','One team or one workflow','Only the CEO\'s inbox','Every connected tool'], a:1, why:'A whole-company first scan produces a long report nobody owns.'},
      {q:'You disconnected a source. What happens to data already synced?', o:['It is deleted automatically','It stays until you request deletion (privacy@masterkey.ai or Support) or delete the account','It is shared with AI vendors','It expires in 24 hours'], a:1, why:'Disconnecting stops new reads only; ask for deletion of the synced copy.'}]},
  {id:'m1', group:'The 5 modules', title:'Module 1 — Run your scan', tpl:'t-m1', time:'30 min + scan time', for:['admin','owner'],
    plain:'Masterkey watches the work happening in your connected tools and maps where time goes. While it runs, ask your team how many hours they think they spend, so you have a number to check the report against.',
    outcome:'your first Time Scout Report and a baseline of weekly hours.',
    tasks:['Confirm the scope: the workflow, the people, the tools', 'Start scouting in the app', 'Send the <a href="#templates">baseline survey</a> to everyone in scope', 'Add up the answers and enter the total in <a href="#plan">Your rollout plan</a>', 'When the report lands, read it alone before sharing it'],
    quiz:[
      {q:'What should you capture while the scan runs?', o:['A manual baseline of weekly hours from each person in scope','Screenshots of the app','Agentforce credits','A list of new tools to buy'], a:0, why:'The baseline is the number you test the report against, and how you prove ROI later.'},
      {q:'The report reflects only one person\'s habits. Most likely cause?', o:['Scan ran too long','Only the owner\'s inbox was connected','Too many tools connected','The meeting recorder was included'], a:1, why:'Add the team members in scope.'}]},
  {id:'m2', group:'The 5 modules', title:'Module 2 — Read the report', tpl:'t-m2', time:'1 hour', for:['sponsor','admin','owner','champion'],
    plain:'The report lists the busywork it found and suggests an AI agent for each one. You check it against reality, score each suggestion, and choose the one to three agents worth building first.',
    outcome:'a signed build list naming your first 1-3 agents and who owns each.',
    tasks:['Compare the biggest findings to your baseline (10 min)', 'Walk each process owner through their findings (30 min)', 'Score every prescription with the practice scorer on this page', 'Add the winners to the <a href="#buildlist">build list</a>', 'Get the executive sponsor to sign it', 'Send the <a href="#templates">report-ready note</a> to the team'],
    quiz:[
      {q:'A prescription scores 4 × 5 × 5 × 4 × 5. What do you do?', o:['Park it','Second wave','Build now','Never automate'], a:2, why:'4×5×5×4×5 = 2,000, well above 500: build now.'},
      {q:'A prescription scores 1 on error cost. What do you do?', o:['Fully automate it to save the most time','Build it as draft-for-human-approval only, or park it','Deploy straight to production','Raise it to level 3'], a:1, why:'Rule clarity or error cost at 1 = never fully automate.'},
      {q:'Which is a good first agent?', o:['Auto-approving refunds','Pricing quotes sent directly to customers','Drafting follow-up emails after meetings','Signing contracts'], a:2, why:'Bad first agents send money, sign, price, or talk to customers without review.'}]},
  {id:'m3', group:'The 5 modules', title:'Module 3 — Deploy an agent', tpl:'t-m3', time:'1-2 weeks', for:['admin','owner','sfadmin'],
    plain:'Each agent gets tested in a safe copy of Salesforce first, then tried by a few people, and only then turned on for the whole team, with a written plan for switching it off if needed.',
    outcome:'each first-wave agent live, tested, with a human-review rule and an off switch.',
    tasks:['Confirm Agentforce is enabled and has credits (testing uses credits too)', 'Set up a sandbox that mirrors production permissions', 'Review the agent\'s instructions with the process owner', 'Write the human-review and escalation rule', 'Write pass criteria before testing', 'Download the test-case template below and fill in 20-30 real cases', 'Pilot with 2-5 users in draft mode for 1-2 weeks', 'Write the <a href="#templates">rollback plan</a>, then go live'],
    quiz:[
      {q:'Where does a new agent go first?', o:['Production','Sandbox','A pilot with the whole team','Straight to customers'], a:1, why:'Never one-click straight into production on the first agent.'},
      {q:'What mix of test cases should you build?', o:['100% normal cases','50% normal, 50% edge','About 70% normal, 20% edge, 10% must-refuse or escalate','Only edge cases'], a:2, why:'20-30 real cases: 70 / 20 / 10.'},
      {q:'When do you set pass criteria?', o:['After testing, based on results','Before testing','At go-live','Never; just eyeball it'], a:1, why:'Set them first, e.g. 90%+ normal, 100% escalation, zero data-permission leaks.'}]},
  {id:'m4', group:'The 5 modules', title:'Module 4 — Adoption', tpl:'t-m4', time:'45 min', for:['all'],
    plain:'People use an agent when they aren\'t afraid of it, trust its output, and find it easier than the old way. This module covers all three, plus the 45-minute training for everyday users.',
    outcome:'champions in place, launch messages sent, and every user trained.',
    tasks:['Sponsor tells the team what the won-back hours are for', 'Name one champion per 10 users in <a href="#plan">Your rollout plan</a>', 'Set up one place to flag bad outputs (e.g. a Slack channel)', 'Remove or hide the old manual step', 'Book the 45-minute end-user session', 'Send the <a href="#templates">go-live message</a>'],
    quiz:[
      {q:'What are the three reasons adoption fails?', o:['Price, speed, design','Fear for jobs, distrust of output, the old way is easier','Bad Wi-Fi, too many tools, no training','Legal, IT, finance'], a:1, why:'Each needs its own fix: say what the hours are for, start in draft mode, make the agent the easy path.'},
      {q:'How long is the end-user training?', o:['10 minutes','45 minutes','Half a day','Two days'], a:1, why:'5 min scope, 10 min demo, 20 min hands-on, 10 min review/correct/flag.'},
      {q:'A user flags a bad output. How fast should you answer?', o:['Within one business day','Within a month','At the day-30 review','No need to answer'], a:0, why:'Answer each flag within one business day; trust follows visible accuracy.'}]},
  {id:'rollout', group:'Plan & measure', title:'The 90-day rollout', tpl:'t-rollout', time:'10 min', for:['sponsor','admin'],
    plain:'Ninety days in four phases. You only move to the next phase when a checkpoint (a "gate") is passed. If it isn\'t, you fix the problem and try again.',
    outcome:'the four phases and three gates on your calendar.',
    tasks:['Put the three gate dates on the sponsor\'s and admin\'s calendars', 'Book a 30-minute review at day 30, 60 and 90'],
    quiz:[
      {q:'What gate must pass before Build + pilot begins?', o:['70% of forecast','Tests pass','Build list signed','Second scan done'], a:2, why:'Gate 1 is the sponsor-signed build list.'},
      {q:'A gate is missed. What happens?', o:['Skip it and keep going','Fix and retry','Cancel the rollout','Move to level 3 autonomy'], a:1, why:'A missed gate means fix and retry, not skip.'}]},
  {id:'measure', group:'Plan & measure', title:'Measuring success', tpl:'t-measure', time:'20 min', for:['sponsor','admin'],
    plain:'Success is one number: hours won back each week compared to before. Check it at day 30, 60 and 90. If an agent is below half its forecast at day 30, fix it or switch it off.',
    outcome:'a weekly tracking routine and your ROI number.',
    tasks:['Decide who records the six KPIs every week', 'Enter your loaded hourly cost in <a href="#plan">Your rollout plan</a>', 'Run the ROI check on this page at day 30', 'Send the <a href="#templates">day-30 update</a>'],
    quiz:[
      {q:'What is the one number that decides success?', o:['Number of agents deployed','Hours won back per week vs. baseline','Logins per day','Credits used'], a:1, why:'Everything else explains that number.'},
      {q:'An agent is at 40% of forecast hours on day 30. What happens?', o:['Leave it; it will improve','Raise its autonomy','Fix it or switch it off','Deploy two more like it'], a:2, why:'Under 50% of forecast at day 30 = fix it or switch it off.'},
      {q:'15 hrs/week × $60 loaded cost − $150 run cost =', o:['$750 a week','$900 a week','$600 a week','$1,050 a week'], a:0, why:'$900 of time − $150 run cost = $750 a week, about $39,000 a year.'}]},
  {id:'gov', group:'Plan & measure', title:'Governance & risk', tpl:'t-gov', time:'20 min', for:['admin','sfadmin'],
    plain:'Every agent needs an owner, a written limit on what it may do alone, and an off switch before it goes live. New agents only draft; a person approves.',
    outcome:'the controls checklist complete for your first agent.',
    tasks:['Set an autonomy level for each agent on the <a href="#buildlist">build list</a>', 'Tick off the controls checklist above', 'Add "revoke Masterkey connections" to your offboarding checklist'],
    quiz:[
      {q:'What autonomy level does every new customer-facing agent start at?', o:['Level 1 — Suggest','Level 2 — Act with review','Level 3 — Act alone','No level needed'], a:0, why:'All new agents and anything customer-facing start at level 1.'},
      {q:'Which can NEVER be level 3?', o:['Creating tasks from meeting notes','Updating a CRM field','Payments and pricing','Summarizing a meeting'], a:2, why:'Never level 3: payments, pricing, contracts, legal or medical statements, hiring, deleting records.'}]},
  {id:'templates', group:'Toolkit', title:'Copy-ready messages', tpl:'t-templates', kind:'tool'},
  {id:'buildlist', group:'Toolkit', title:'Build list', tpl:'t-buildlist', kind:'tool'},
  {id:'glossary', group:'Toolkit', title:'Glossary', tpl:'t-glossary', kind:'tool'},
  {id:'trouble', group:'Help', title:'Troubleshooting & FAQ', tpl:'t-trouble', time:'5 min', for:['champion','user','admin'],
    plain:'The most common problems and their fixes, plus straight answers to the questions people ask first.',
    outcome:'knowing where to look when something goes wrong.',
    tasks:['Bookmark this page', 'Share the flag-a-bad-output channel with your team'],
    quiz:[
      {q:'The agent keeps picking the wrong action. First fix?', o:['Buy more credits','Rewrite instructions as Always / Never / If X then Y and split overlapping topics, then re-test','Raise to level 3','Disconnect Salesforce'], a:1, why:'Vague or overlapping instructions are the usual cause.'},
      {q:'Do you need Agentforce to get a Time Scout report?', o:['Yes','No; only to one-click deploy'], a:1, why:'Diagnose and Prescribe work alone.'}]},
  {id:'help', group:'Help', title:'Getting help', tpl:'t-help', kind:'tool'},
  {id:'cert', group:'Certify', title:'Admin certification', tpl:'t-cert', kind:'cert'}
];
const LBYID = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const EXAM = [
  {q:'What should your first scan cover?', o:['The whole company','One team or one workflow','Only leadership','Every connected app'], a:1},
  {q:'What must you capture before reading the first report?', o:['A manual baseline, to prove ROI later','A SOC 2 report','A Salesforce sandbox','Pricing approval'], a:0},
  {q:'Name the three Masterkey steps.', o:['Scan, Score, Ship','Diagnose, Prescribe, Deploy','Connect, Test, Launch','Plan, Build, Measure'], a:1},
  {q:'Do you need Agentforce to get a report?', o:['Yes, always','No; only to one-click deploy','Only for sales teams','Only after day 30'], a:1},
  {q:'A prescription scores 1 on error cost. What do you do?', o:['Automate fully','Build it as draft-for-approval only, or park it','Deploy to production first','Ignore the score'], a:1},
  {q:'Where does a new agent go first?', o:['Production','Sandbox','Customer pilot','Level 3'], a:1},
  {q:'What mix of test cases?', o:['70% normal, 20% edge, 10% must-refuse or escalate','100% normal','50/50 normal and edge','90% edge, 10% normal'], a:0},
  {q:'What autonomy level does every new customer-facing agent start at?', o:['Level 3, Act alone','Level 2, Act with review','Level 1, Suggest','It depends on the vendor'], a:2},
  {q:'An agent is at 40% of forecast hours on day 30. What happens?', o:['Wait until day 90','Fix it or switch it off','Raise its autonomy','Double its scope'], a:1},
  {q:'How do you remove data Masterkey already synced from one source?', o:['Disconnecting deletes it','Email privacy@masterkey.ai or use Support in the app','It cannot be removed','Change your password'], a:1}
];
const ROLES = [
  {id:'admin', who:'Sets up and runs Masterkey. Often the chief of staff or ops lead.', time:'about 6 hours', req:['roles','m0','m1','m2','m3','m4','rollout','measure','gov','trouble','cert']},
  {id:'sponsor', who:'Owner, CEO or GM. Sets the goal and approves each agent.', time:'about 2 hours', req:['roles','m0','m2','m4','rollout','measure']},
  {id:'owner', who:'Department head. Confirms findings and signs off agent rules.', time:'about 3 hours', req:['roles','m1','m2','m3','m4']},
  {id:'sfadmin', who:'Runs Agentforce: permissions, testing, deploy.', time:'about 4 hours', req:['roles','m3','gov']},
  {id:'champion', who:'Respected team member who coaches peers. 1 per 10 users.', time:'about 2 hours', req:['roles','m2','m4','trouble']},
  {id:'user', who:'Uses an agent day to day and flags mistakes.', time:'about 45 minutes', req:['m4','trouble']},
  {id:'withcto', who:'A CTO runs the technical work; you own the goal and decisions.', time:'about 1 hour', req:['roles','ctoled','m0','m2','m4','measure']}
];
const GLOSSARY = [
  ['Agent','A piece of AI software that does a specific repeated task, like drafting a follow-up email after a meeting.'],
  ['Agentforce','Salesforce\'s platform for running AI agents. Masterkey\'s one-click deploy sends agents there.'],
  ['Autonomy level','How much an agent may do without a person: Level 1 drafts only, Level 2 acts and a person checks a sample, Level 3 acts alone with a weekly audit.'],
  ['Baseline','How many hours a week your team spends on the workflow before any agent. Every result is measured against it.'],
  ['Build list','A one-page list of the first 1-3 agents you\'ll build, each with an owner and a target date, signed by the sponsor.'],
  ['Busywork','Repeated, rule-based work that takes time but not judgment.'],
  ['Champion','A respected team member who tries the agent first and coaches peers. One per 10 users.'],
  ['Composio','The connection layer Masterkey uses to link to 1,000+ tools.'],
  ['Credits','What Masterkey and Agentforce usage is paid with. Signup includes $500 in Masterkey credits.'],
  ['Diagnose','Step one: Masterkey scouts your connected tools to find busywork.'],
  ['Deploy','Step three: putting a prescribed agent into Agentforce so it starts working.'],
  ['Draft mode','The agent prepares the work and a person approves it before anything is sent or saved. Same as Level 1.'],
  ['Einstein Trust Layer','Salesforce\'s built-in protections: grounding in your data, no data kept by outside AI providers, toxicity checks and an audit trail.'],
  ['Escalation','When an agent hands a case to a person, for example a customer asking for a refund.'],
  ['Executive sponsor','The leader who owns the goal, the budget and the final yes/no on each agent.'],
  ['Gate','A checkpoint in the 90-day plan. The next phase starts only when it passes.'],
  ['Implementation CTO','An experienced CTO from our team who does the technical parts of a rollout with you. Start with a free 30-minute call.'],
  ['Loaded hourly cost','What an hour of someone\'s time really costs: salary plus benefits plus overhead, divided by working hours.'],
  ['Pilot','A short trial of an agent with 2-5 users before the whole team gets it.'],
  ['Prescribe','Step two: the report pairs each finding with the agent that fixes it, plus forecast hours saved and cost.'],
  ['Process owner','The department head who confirms findings and signs off each agent\'s rules for their team.'],
  ['Rollback plan','A written note of who switches an agent off, how, and what the manual fallback is.'],
  ['Rubric score','Five factors scored 1-5 and multiplied. 500+ build now, 150-499 second wave, under 150 park it.'],
  ['Run cost','What an agent costs to operate each week in credits.'],
  ['Sandbox','A safe copy of Salesforce for testing. Nothing done there touches real customers.'],
  ['Scope','What Masterkey is allowed to read. Set on each connection screen; approve only what the workflow needs.'],
  ['Time Scout Report','The report Masterkey produces after scouting: every bottleneck, busywork item and opportunity, each with a prescribed agent.']
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

// ---------- stuck -> CTO help ----------
const STUCK = {
  roles:'Not sure who should own what?', m0:'Connections failing, or nobody can approve them?', m1:'Report thin, or it doesn\'t match reality?',
  m2:'Not sure which agents to build first?', m3:'No Agentforce, no Salesforce admin, or tests won\'t pass?', m4:'Team not using the agent?',
  rollout:'Missed a gate and not sure how to fix it?', measure:'An agent under 50% of forecast?', gov:'Need a security review or have regulated data?', trouble:'Tried the fix and still stuck?'
};
const stuckHTML = (from, title, why) => `<div><b>${esc(title)}</b><span>Talk it through with one of our CTOs. Free, 30 minutes, no obligation.</span></div><a class="btn" href="#expert?from=${encodeURIComponent(from)}&why=${encodeURIComponent(why)}">Get a CTO's help</a>`;
function missed(L, qz) {
  S.miss = S.miss || {}; S.miss[L.id] = (S.miss[L.id] || 0) + 1; save();
  if (S.miss[L.id] >= 2 && !$('.stuck-quiz', qz)) {
    const c = document.createElement('div'); c.className = 'stuck stuck-quiz';
    c.innerHTML = stuckHTML(L.id, 'This part trips a lot of people up.', 'quiz');
    $('#qStatus', qz).after(c);
  }
}
const ASSESS = [
  ['sf','Do you have Salesforce with Agentforce turned on?','One-click deploy only goes to Agentforce today. A CTO can help you decide how to deploy without it.'],
  ['admin','Do you have a Salesforce admin, in-house or a partner?','Someone has to set permissions, test agents and deploy them.'],
  ['time','Can one person give this about 6 hours over the next two weeks?','The admin track takes about 6 hours, plus coordinating people.'],
  ['scope','Can you start with just one team or one workflow?','Whole-company first scans produce long reports nobody owns.'],
  ['access','Can you approve connections to your company\'s tools, or do you know who can?','Salesforce and Microsoft 365 connections usually need an admin.'],
  ['reg','Can you keep regulated data (health, payment, personal financial) out of the first scan?','Masterkey has no SOC 2 report yet, so regulated data needs a careful setup.']
];
function assessVerdict(a) {
  const no = ASSESS.filter(([k]) => a[k] === 'no');
  if (Object.keys(a).length < ASSESS.length) return null;
  const critical = a.sf === 'no' || a.admin === 'no';
  return {no, kind: !no.length ? 'diy' : (critical || no.length >= 3) ? 'cto' : 'standby'};
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
    const cta = `<a class="btn" href="#expert?from=paths&why=readiness">Get a free CTO call</a>`, diy = `<a class="btn ghost" href="#roles">Start the free course</a>`;
    out.innerHTML = v.kind === 'diy'
      ? `<div class="big" style="font-size:22px">You're ready to do it yourself.</div><p style="margin:6px 0 12px">The free course will get you from scan to agents in use. If you get stuck, help is one click away on every lesson.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#roles">Start the free course</a></div>`
      : v.kind === 'cto'
      ? `<div class="big" style="font-size:22px">We recommend rolling out with a CTO.</div><p style="margin:6px 0 0">Here's why:</p>${reasons}<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${cta}<a class="btn ghost" href="#ctoled">How a CTO-led rollout works</a></div>`
      : `<div class="big" style="font-size:22px">Do it yourself, with a CTO on standby.</div><p style="margin:6px 0 0">You can start on your own. Watch these:</p>${reasons}<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${diy}${cta}</div>`;
  };
  draw();
}
function leadContext(from, why) {
  const tl = track(), done = tl.filter(l => S.done[l.id]).length, r = role();
  const fromL = LBYID[from];
  const misses = Object.entries(S.miss || {}).filter(([, n]) => n > 0).map(([k, n]) => `${LBYID[k] ? LBYID[k].title : k} (${n})`).join(', ');
  const verdict = S.assess && S.assess.verdict ? {diy:'ready to do it yourself', cto:'CTO recommended', standby:'DIY with a CTO on standby'}[S.assess.verdict] : '';
  const rows = [
    ['Came from', fromL ? fromL.title : (from || 'direct')],
    ['Trigger', {quiz:'missed quiz answers', readiness:'readiness check', roi:'ROI under 50% of forecast', stuck:'stuck prompt on lesson'}[why] || why],
    ['Role', r ? ROLE_NAMES[r.id] : ''],
    ['Course progress', `${done} of ${tl.length} lessons`],
    ['Goal', P('hours') ? goalSentence(plainV) : ''],
    ['Tools', P('tools')],
    ['Readiness check', verdict],
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
  const book = BOOKING_URL ? `<a class="btn" href="${esc(BOOKING_URL)}" target="_blank" rel="noopener">Book your call now</a>` : '';
  if (book) $('#bookTop', root).innerHTML = `<div class="banner"><span>Prefer to pick a time yourself?</span>${book}</div>`;
  el('fullname').value = S.name || ''; el('company').value = P('company');
  const r = role(); if (r) el('role').value = ROLE_NAMES[r.id];
  const fromL = LBYID[from];
  el('stuck').placeholder = fromL ? `e.g. what happened when you got to "${fromL.title}"` : 'e.g. our Salesforce connection keeps failing';
  const showDone = (how) => {
    f.hidden = true; done.hidden = false;
    done.innerHTML = how === 'sent'
      ? `<b>Request sent.</b> A CTO will reply by email to book your free 30-minute call.${book ? ' Or book a time now: ' + book : ''} <br><a href="#${esc(from && LBYID[from] ? from : 'welcome')}">← Back to where you were</a>`
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
    const missing = [!name && 'your name', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 'a valid work email', !company && 'your company', !stuck && 'what you\'re stuck on', !el('consent').checked && 'the consent box'].filter(Boolean);
    if (missing.length) { err.textContent = 'Please add ' + missing.join(', ') + '.'; return; }
    S.name = S.name || name; if (!P('company')) S.plan.company = company; save();
    const payload = {
      _subject: `Masterkey Academy: CTO help request from ${company}`, _template: 'table', _captcha: 'false', _replyto: email,
      Name: name, Email: email, Company: company, Phone: el('phone').value.trim(), Role: el('role').value, 'Team size': el('size').value,
      Salesforce: el('salesforce').value, 'Stuck on': stuck, ...Object.fromEntries(ctx.rows), Page: location.href
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
      showDone(`<b>We couldn't send that automatically.</b> Your details are below. Email them to <a href="${mail}">${esc(LEAD_EMAIL)}</a> and a CTO will reply to book your call.<pre class="ctx">${esc(body)}</pre><button class="btn small" id="copyLead" type="button">Copy details</button>`);
      $('#copyLead', root).onclick = () => copy(body);
    }
    btn.disabled = false; btn.textContent = 'Request my free call';
  };
}

// ---------- plan & templates ----------
const PLAN_FIELDS = {
  goal: [
    ['company','Company name','Acme Co.'], ['workflow','Workflow to fix first','inbound lead follow-up'], ['team','Team in scope','the sales team'],
    ['hours','Hours to win back per week','15','number'], ['date','Target date','','date'], ['tools','Tools that workflow runs on','Salesforce, Gmail, Google Calendar, Zoom'],
    ['hoursFor','What the won-back hours will go to','more client calls and faster replies', 'text', 'wide']],
  people: [['sponsor','Executive sponsor',''], ['admin','Masterkey admin',''], ['owner','Process owner(s)',''], ['sfadmin','Salesforce admin',''], ['champions','Champions (1 per 10 users)',''], ['people','Number of people in scope','8','number']],
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
  {id:'announce', title:'1. Team announcement', when:'Before the scan · sent by the executive sponsor', body:f =>
`Subject: How we're freeing up time on ${f('workflow','workflow')}

Hi team,

Starting this week we're using Masterkey to see how ${f('workflow','workflow')} actually runs, so we can hand repetitive busywork to AI agents.

Our goal: win back ${f('hours','hours')} hours a week across ${f('team','team')} by ${f('date','date')}.

What's being looked at: only the tools and workflows we authorize for ${f('workflow','workflow')} (${f('tools','tools')}). It maps processes, not anyone's performance.

What the hours are for: ${f('hoursFor','what the hours are for')}.

What I need from you: a two-minute estimate of your weekly hours on this work. ${f('admin','Masterkey admin')} will send it today. Otherwise, keep working as normal.

Questions? Ask me or ${f('admin','Masterkey admin')}.

${f('sponsor','Executive sponsor')}`},
  {id:'survey', title:'2. Baseline survey', when:'While the scan runs · sent by the Masterkey admin', body:f =>
`Subject: 2-minute question about ${f('workflow','workflow')}

Hi,

Quick one, no wrong answers. Please reply by end of day tomorrow:

1. In a normal week, how many hours do you spend on ${f('workflow','workflow')}?
2. Which part of it is the most repetitive?
3. What's one step you'd happily never do again?

Your answers give us a "before" number so we can prove whether the agents actually help.

Thanks,
${f('admin','Masterkey admin')}`},
  {id:'ready', title:'3. Report-ready note', when:'After Module 2 · sent by the Masterkey admin', body:f =>
`Subject: What we found, and what we're building first

Hi team,

Our Time Scout Report is in. The top three findings:
1. [Finding 1]: about [X] hours a week
2. [Finding 2]: about [X] hours a week
3. [Finding 3]: about [X] hours a week

We're building these first (signed off by ${f('sponsor','Executive sponsor')}):
- [Agent name], owned by [owner], target [date]
- [Agent name], owned by [owner], target [date]

Every agent starts in draft mode: it prepares the work, a person approves it.

${f('admin','Masterkey admin')}`},
  {id:'pilot', title:'4. Pilot kickoff', when:'Start of the pilot · sent by the process owner', body:f =>
`Subject: You're piloting [agent name] for the next two weeks

Hi [names],

You're our first users for [agent name]. For the next one to two weeks it will draft [what it drafts]; you review and approve before anything goes out.

What I need:
- Use it on your real work every day.
- Flag anything wrong in ${f('flag','where to flag bad outputs')}, with a screenshot if you can.
- 15-minute check-in on [day] to tell me what's working.

Thanks for going first.
${f('owner','Process owner')}`},
  {id:'golive', title:'5. Go-live message', when:'Launch day · sent by the sponsor and a champion', body:f =>
`Subject: Starting today: [agent name]

Hi team,

From today, [agent name] handles [task] for ${f('team','team')}.

How to use it: [where it lives, e.g. in Salesforce or your inbox] → [first step].
What changes today: [old step] is retired; the agent drafts it, you review and send.
How to flag an error: ${f('flag','where to flag bad outputs')}. We answer every flag within one business day.
Office hours: ${f('champions','Champions')} are running them for the next two weeks.

The hours this frees up go to ${f('hoursFor','what the hours are for')}.

${f('sponsor','Executive sponsor')}`},
  {id:'rollback', title:'6. Rollback plan', when:'Before go-live · written by the Salesforce admin and process owner', body:f =>
`ROLLBACK PLAN: [agent name]

Who can switch it off: ${f('sfadmin','Salesforce admin')} (backup: ${f('admin','Masterkey admin')})
How: [exact steps in Agentforce to deactivate the agent]
When we switch it off: wrong message reaches a customer · data-permission leak · accuracy below 80% in a weekly sample · run cost above forecast for two weeks
Manual fallback: [the old step, who does it, where the template lives]
Who we tell: ${f('team','team')} via [channel], and ${f('sponsor','Executive sponsor')}
Time to restore the manual process: [target, e.g. same day]`},
  {id:'day30', title:'7. Day-30 update', when:'Day 30 · sent by the Masterkey admin', body:f =>
`Subject: Day 30: what the agents have saved

Hi team,

Goal: ${f('hours','hours')} hours a week on ${f('workflow','workflow')} by ${f('date','date')}.
Baseline: ${f('baseline','baseline hours')} hours a week.

This month:
- Hours won back per week: [X] ([Y]% of forecast)
- People using it weekly: [X] of ${f('people','people in scope')}
- Accuracy in our weekly sample: [X]%
- Fixes we made from your flags: [list]

Next: [keep / fix / switch off] for each agent, and [next wave].

Thank you for the flags; they're what make it better.
${f('admin','Masterkey admin')}`}
];

function renderTemplates(root) {
  const list = $('#tplList', root);
  list.innerHTML = TEMPLATES.map(t => `<article class="tpl" id="tpl-${t.id}"><header><div><b>${esc(t.title)}</b><small>${esc(t.when)}</small></div><button class="btn small" data-copy="${t.id}">Copy text</button></header><pre>${t.body(ph)}</pre></article>`).join('');
  $$('[data-copy]', list).forEach(b => b.onclick = () => copy(TEMPLATES.find(t => t.id === b.dataset.copy).body(plainV)));
}

// ---------- build list ----------
const BL_COLS = [['name','text'],['owner','text'],['problem','text'],['hours','number'],['cost','number'],['score','number'],['rule','select'],['date','date']];
const RULES = ['Level 1 — draft only','Level 2 — act, daily sample review','Level 3 — act alone, weekly audit'];
function renderBuildList(root) {
  if (!S.bl.length) S.bl = [{rule: RULES[0]}];
  const body = $('#blBody', root), sum = $('#blSum', root);
  const draw = () => {
    body.innerHTML = S.bl.map((r, i) => `<tr>${BL_COLS.map(([k, t]) => `<td>${t === 'select'
      ? `<select data-i="${i}" data-k="${k}" aria-label="Review rule">${RULES.map(o => `<option ${r[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
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
      if (bb && AWAY_MS > 7 * 864e5 && anyDone && nx) bb.innerHTML = `<div class="banner"><span><b>Welcome back.</b> You stopped at ${esc(nx.title)}. Pick up where you left off, or get a CTO to help you finish.</span><span style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn small" href="#${nx.id}">Continue</a><a class="btn small ghost" href="#expert?from=${nx.id}&why=returning">Get a CTO's help</a></span></div>`;
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
    const F = [['Hours saved','10+ hrs/wk','<1 hr/wk'],['Frequency','Many times a day','Monthly'],['Rule clarity','Checklist-simple','Judgment every time'],['Error cost','Cheap to undo','Reaches customer/money/legal'],['Owner ready','Named, wants it now','No owner']];
    const v = Array.isArray(S.rubric) && S.rubric.length === 5 ? S.rubric : [4,5,4,4,5];
    const rows = $('#rubricRows', root), out = $('#rubricOut', root);
    rows.innerHTML = F.map((f, i) => `<div class="row"><span title="5 = ${esc(f[1])} · 1 = ${esc(f[2])}">${esc(f[0])}</span><input type="range" min="1" max="5" value="${v[i]}" data-i="${i}" aria-label="${esc(f[0])}, 1 to 5"><span class="val">${v[i]}</span></div>`).join('');
    const calc = () => {
      const s = v.reduce((a, b) => a * b, 1);
      const verdict = s >= 500 ? ['Build now','v-good'] : s >= 150 ? ['Second wave','v-mid'] : ['Park it','v-bad'];
      const extra = (v[2] === 1 || v[3] === 1) ? '<div style="margin-top:8px;font-size:14px"><b>Rule clarity or error cost is 1:</b> never fully automate. Design it as a draft-for-human-approval agent.</div>' : '';
      out.innerHTML = `<span class="big">${s.toLocaleString()}</span><span class="verdict ${verdict[1]}">${verdict[0]}</span><div style="font-size:13px;color:var(--ink-2);margin-top:4px">${v.join(' × ')} · 500+ build now · 150-499 second wave · under 150 park</div>${extra}<div style="margin-top:10px"><a class="btn small" href="#buildlist">Add to build list →</a></div>`;
    };
    $$('input', rows).forEach(inp => inp.oninput = () => { v[+inp.dataset.i] = +inp.value; inp.nextElementSibling.textContent = inp.value; S.rubric = v; save(); calc(); });
    calc();
  }
  if (id === 'm3') {
    const n = $('#tcN', root), out = $('#tcOut', root), vv = $('#tcV', root);
    const mix = N => { const e = Math.round(N * .2), r = Math.max(2, Math.round(N * .1)); return [N - e - r, e, r]; };
    const calc = () => { const N = +n.value, [norm, e, r] = mix(N); vv.textContent = N;
      out.innerHTML = `<b>${norm}</b> normal cases · <b>${e}</b> edge cases · <b>${r}</b> must refuse or escalate<div style="font-size:14px;color:var(--ink-2);margin-top:6px">Pass bar: ${Math.ceil(norm * .9)}+ of ${norm} normal correct (90%), ${r} of ${r} escalations correct (100%), zero data-permission leaks. Then the process owner runs 10 by hand.</div><div style="margin-top:10px"><button class="btn small" id="tcCsv">Download test-case template (CSV)</button></div>`;
      $('#tcCsv', out).onclick = () => {
        const rows = [['ID','Type','Scenario (real example from the report)','Expected action','Expected topic','Data the agent may see','Pass? (Y/N)','Notes']];
        let id = 1; [['Normal', norm], ['Edge case', e], ['Must refuse or escalate', r]].forEach(([t, c]) => { for (let i = 0; i < c; i++) rows.push([id++, t, '', '', '', '', '', '']); });
        download('masterkey-test-cases.csv', rows.map(r => r.map(csvCell).join(',')).join('\n'));
      };
    };
    n.oninput = calc; calc();
  }
  if (id === 'measure') {
    const el = ['rForecast','rHours','rCost','rRun'].map(i => $('#' + i, root)), out = $('#roiOut', root);
    if (Array.isArray(S.roi)) el.forEach((e, i) => { if (S.roi[i] != null) e.value = S.roi[i]; });
    else if (+P('cost')) el[2].value = P('cost');
    const calc = () => { const [f, h, c, r] = el.map(e => Math.max(0, +e.value || 0)); S.roi = [f, h, c, r]; save();
      const wk = h * c - r, pct = f ? Math.round(100 * h / f) : 0;
      const v = !f ? ['Enter a forecast','v-mid'] : pct < 50 ? ['Under 50% at day 30: fix it or switch it off','v-bad'] : pct < 70 ? ['On watch: below the 70% day-90 target','v-mid'] : ['On track: 70%+ of forecast','v-good'];
      out.innerHTML = `<div><span class="big">${money(wk)}</span> <span style="color:var(--ink-2)">per week · about ${money(wk * 52)} a year</span></div><div style="margin-top:8px">${f ? pct + '% of forecast hours' : ''} <span class="verdict ${v[1]}">${v[0]}</span></div>${f && pct < 50 ? `<div class="stuck" style="margin:14px 0 0">${stuckHTML('measure', 'Want a CTO to find out why?', 'roi')}</div>` : ''}`; };
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
  document.title = (L.id === 'welcome' ? '' : L.title + ' · ') + 'Masterkey Academy';
  window.scrollTo(0, 0);
  try { wire(L.id, wrap); } catch (e) { console.error(e); const n = document.createElement('div'); n.className = 'note'; n.innerHTML = '<b>Something went wrong on this page.</b> Try reloading. If it keeps happening, use Reset on the <a href="#help">Getting help</a> page.'; wrap.prepend(n); }
  const h = $('h1', wrap); if (h && location.hash) { h.setAttribute('tabindex', '-1'); h.focus({preventScroll: true}); }
}

window.addEventListener('hashchange', render);
render();
})();
