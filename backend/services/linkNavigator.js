// services/linkNavigator.js — sql.js backed link navigator
import { all, get, run, dbReady } from './database.js';

await dbReady;

// Seed default links if empty
const count = get('SELECT COUNT(*) AS n FROM portal_links');
if (!count || count.n === 0) {
  const links = [
    ['general','NRL Intranet Portal','http://intranet.nrl.co.in','["intranet","home","portal","main","nrl"]','Main NRL intranet homepage'],
    ['general','NRL Official Website','https://www.nrl.co.in','["website","official","nrl","company"]','Official NRL public website'],
    ['general','Employee Self Service','http://ess.nrl.co.in','["ess","self service","employee portal","profile"]','Employee self-service portal'],
    ['it','IT Helpdesk Portal','http://helpdesk.nrl.co.in','["helpdesk","it support","ticket","raise ticket","it issue"]','Raise and track IT support tickets'],
    ['it','VPN Setup Guide','http://intranet.nrl.co.in/it/vpn','["vpn","remote access","work from home","connect remotely"]','VPN installation and configuration guide'],
    ['it','Software Request Form','http://helpdesk.nrl.co.in/software','["software","install","application","request software","license"]','Request new software installation'],
    ['it','Password Reset','http://accounts.nrl.co.in/reset','["password","reset password","forgot password","unlock account"]','Self-service password reset portal'],
    ['it','Network Status','http://status.nrl.co.in','["network","internet","down","outage","status"]','Live network and system status'],
    ['hr','Leave Management System','http://hrms.nrl.co.in/leave','["leave","apply leave","vacation","sick leave","casual leave","pl","el"]','Apply and track leave requests'],
    ['hr','Payroll Portal','http://hrms.nrl.co.in/payroll','["payroll","salary","salary slip","pay slip","ctc","income"]','View salary slips and payroll details'],
    ['hr','HRMS Portal','http://hrms.nrl.co.in','["hrms","hr portal","human resource","hr system"]','Main HR management system'],
    ['hr','Recruitment Portal','http://careers.nrl.co.in','["recruitment","job","vacancy","apply","career","hiring","referral"]','Internal job postings and referrals'],
    ['hr','Training & Development','http://hrms.nrl.co.in/training','["training","learning","course","development","skill","certification"]','Training programs and e-learning'],
    ['hr','Policy Documents','http://intranet.nrl.co.in/hr/policies','["policy","policies","hr policy","rules","guidelines","handbook"]','HR policies and employee handbook'],
    ['hr','Attendance System','http://hrms.nrl.co.in/attendance','["attendance","punch","biometric","timing","working hours"]','Attendance records and regularization'],
    ['fire & safety','Safety Management System','http://safety.nrl.co.in','["safety","hse","health safety","fire safety","sms"]','HSE and Safety Management System'],
    ['fire & safety','Incident Reporting','http://safety.nrl.co.in/incident','["incident","accident","near miss","report incident","injury","hazard"]','Report safety incidents and near misses'],
    ['fire & safety','Permit to Work System','http://safety.nrl.co.in/ptw','["permit","work permit","ptw","hot work","confined space","height work"]','Apply for work permits'],
    ['fire & safety','SOP Library','http://safety.nrl.co.in/sop','["sop","procedure","standard operating","manual","safe work"]','Standard Operating Procedures library'],
    ['fire & safety','PPE Request','http://safety.nrl.co.in/ppe','["ppe","protective equipment","helmet","gloves","safety shoes","goggles"]','Request personal protective equipment'],
    ['fire & safety','Emergency Contacts','http://safety.nrl.co.in/emergency','["emergency","fire station","ambulance","control room","emergency number"]','Emergency contact numbers and procedures'],
    ['marketing','Brand Guidelines','http://intranet.nrl.co.in/marketing/brand','["brand","logo","color","font","branding","identity","style guide"]','NRL brand guidelines and assets'],
    ['marketing','Media Library','http://intranet.nrl.co.in/marketing/media','["media","images","photos","videos","assets","graphics"]','Official NRL media and image library'],
    ['marketing','Communication Templates','http://intranet.nrl.co.in/marketing/templates','["template","email template","letter","communication","letterhead"]','Official communication templates'],
    ['marketing','Events Calendar','http://intranet.nrl.co.in/events','["event","calendar","schedule","seminar","conference","function"]','Company events and calendar'],
  ];
  for (const l of links) {
    run('INSERT INTO portal_links (department,title,url,keywords,description) VALUES (?,?,?,?,?)', l);
  }
  console.log('[DB] Seeded 25 default portal links');
}

function scoreLink(link, query) {
  const q = query.toLowerCase();
  let score = 0;
  try {
    const keywords = JSON.parse(link.keywords || '[]');
    for (const kw of keywords) if (q.includes(kw)) score += kw.split(' ').length;
  } catch {}
  if (q.includes((link.title||'').toLowerCase())) score += 3;
  return score;
}

export function findLinks(department, query, topK=3) {
  const deptLinks    = all('SELECT * FROM portal_links WHERE department=?', [department.toLowerCase()]);
  const generalLinks = all('SELECT * FROM portal_links WHERE department=?', ['general']);
  return [...deptLinks, ...generalLinks]
    .map(l => ({ ...l, score: scoreLink(l, query), keywords: JSON.parse(l.keywords||'[]') }))
    .filter(l => l.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, topK);
}

export function getDeptLinks(department) {
  return all('SELECT * FROM portal_links WHERE department=?', [department.toLowerCase()])
    .map(l => ({ ...l, keywords: JSON.parse(l.keywords||'[]') }));
}

export function getAllLinks() {
  const rows = all('SELECT * FROM portal_links ORDER BY department, title');
  const result = {};
  rows.forEach(l => {
    if (!result[l.department]) result[l.department] = [];
    result[l.department].push({ ...l, keywords: JSON.parse(l.keywords||'[]') });
  });
  return result;
}

export function addLink(department, { title, url, keywords=[], desc='' }) {
  run('INSERT INTO portal_links (department,title,url,keywords,description) VALUES (?,?,?,?,?)',
    [department.toLowerCase(), title, url, JSON.stringify(keywords), desc]);
  return { success: true };
}

export function deleteLink(department, title) {
  run('DELETE FROM portal_links WHERE department=? AND title=?', [department.toLowerCase(), title]);
  return { success: true };
}
