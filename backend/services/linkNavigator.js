// services/linkNavigator.js
// Smart Link Navigator — maps keywords to internal NRL portal links

const linkDatabase = {
  general: [
    { title: 'NRL Intranet Portal', url: 'http://intranet.nrl.co.in', keywords: ['intranet', 'home', 'portal', 'main', 'nrl'], desc: 'Main NRL intranet homepage' },
    { title: 'NRL Official Website', url: 'https://www.nrl.co.in', keywords: ['website', 'official', 'nrl', 'company'], desc: 'Official NRL public website' },
    { title: 'Employee Self Service', url: 'http://ess.nrl.co.in', keywords: ['ess', 'self service', 'employee portal', 'profile'], desc: 'Employee self-service portal' },
  ],
  it: [
    { title: 'IT Helpdesk Portal', url: 'http://helpdesk.nrl.co.in', keywords: ['helpdesk', 'it support', 'ticket', 'raise ticket', 'it issue'], desc: 'Raise and track IT support tickets' },
    { title: 'VPN Setup Guide', url: 'http://intranet.nrl.co.in/it/vpn', keywords: ['vpn', 'remote access', 'work from home', 'connect remotely'], desc: 'VPN installation and configuration guide' },
    { title: 'Software Request Form', url: 'http://helpdesk.nrl.co.in/software', keywords: ['software', 'install', 'application', 'request software', 'license'], desc: 'Request new software installation' },
    { title: 'Password Reset', url: 'http://accounts.nrl.co.in/reset', keywords: ['password', 'reset password', 'forgot password', 'unlock account'], desc: 'Self-service password reset portal' },
    { title: 'Network Status', url: 'http://status.nrl.co.in', keywords: ['network', 'internet', 'down', 'outage', 'status'], desc: 'Live network and system status' },
    { title: 'IT Asset Request', url: 'http://helpdesk.nrl.co.in/assets', keywords: ['laptop', 'computer', 'hardware', 'asset', 'equipment', 'mouse', 'keyboard'], desc: 'Request IT hardware and assets' },
  ],
  hr: [
    { title: 'Leave Management System', url: 'http://hrms.nrl.co.in/leave', keywords: ['leave', 'apply leave', 'vacation', 'sick leave', 'casual leave', 'pl', 'el'], desc: 'Apply and track leave requests' },
    { title: 'Payroll Portal', url: 'http://hrms.nrl.co.in/payroll', keywords: ['payroll', 'salary', 'salary slip', 'pay slip', 'ctc', 'income'], desc: 'View salary slips and payroll details' },
    { title: 'HRMS Portal', url: 'http://hrms.nrl.co.in', keywords: ['hrms', 'hr portal', 'human resource', 'hr system'], desc: 'Main HR management system' },
    { title: 'Recruitment Portal', url: 'http://careers.nrl.co.in', keywords: ['recruitment', 'job', 'vacancy', 'apply', 'career', 'hiring', 'referral'], desc: 'Internal job postings and referrals' },
    { title: 'Training & Development', url: 'http://hrms.nrl.co.in/training', keywords: ['training', 'learning', 'course', 'development', 'skill', 'certification'], desc: 'Training programs and e-learning' },
    { title: 'Policy Documents', url: 'http://intranet.nrl.co.in/hr/policies', keywords: ['policy', 'policies', 'hr policy', 'rules', 'guidelines', 'handbook'], desc: 'HR policies and employee handbook' },
    { title: 'Attendance System', url: 'http://hrms.nrl.co.in/attendance', keywords: ['attendance', 'punch', 'biometric', 'timing', 'working hours'], desc: 'Attendance records and regularization' },
  ],
  'fire & safety': [
    { title: 'Safety Management System', url: 'http://safety.nrl.co.in', keywords: ['safety', 'hse', 'health safety', 'fire safety', 'sms'], desc: 'HSE and Safety Management System' },
    { title: 'Incident Reporting', url: 'http://safety.nrl.co.in/incident', keywords: ['incident', 'accident', 'near miss', 'report incident', 'injury', 'hazard'], desc: 'Report safety incidents and near misses' },
    { title: 'Permit to Work System', url: 'http://safety.nrl.co.in/ptw', keywords: ['permit', 'work permit', 'ptw', 'hot work', 'confined space', 'height work'], desc: 'Apply for work permits' },
    { title: 'SOP Library', url: 'http://safety.nrl.co.in/sop', keywords: ['sop', 'procedure', 'standard operating', 'manual', 'safe work'], desc: 'Standard Operating Procedures library' },
    { title: 'PPE Request', url: 'http://safety.nrl.co.in/ppe', keywords: ['ppe', 'protective equipment', 'helmet', 'gloves', 'safety shoes', 'goggles'], desc: 'Request personal protective equipment' },
    { title: 'Emergency Contacts', url: 'http://safety.nrl.co.in/emergency', keywords: ['emergency', 'fire station', 'ambulance', 'control room', 'emergency number'], desc: 'Emergency contact numbers and procedures' },
  ],
  marketing: [
    { title: 'Brand Guidelines', url: 'http://intranet.nrl.co.in/marketing/brand', keywords: ['brand', 'logo', 'color', 'font', 'branding', 'identity', 'style guide'], desc: 'NRL brand guidelines and assets' },
    { title: 'Media Library', url: 'http://intranet.nrl.co.in/marketing/media', keywords: ['media', 'images', 'photos', 'videos', 'assets', 'graphics'], desc: 'Official NRL media and image library' },
    { title: 'Communication Templates', url: 'http://intranet.nrl.co.in/marketing/templates', keywords: ['template', 'email template', 'letter', 'communication', 'letterhead'], desc: 'Official communication templates' },
    { title: 'Events Calendar', url: 'http://intranet.nrl.co.in/events', keywords: ['event', 'calendar', 'schedule', 'seminar', 'conference', 'function'], desc: 'Company events and calendar' },
    { title: 'Press Releases', url: 'http://intranet.nrl.co.in/marketing/press', keywords: ['press', 'press release', 'news', 'announcement', 'media release'], desc: 'Internal press releases and announcements' },
  ],
};

// Score a link against a query using keyword matching
function scoreLink(link, query) {
  const q = query.toLowerCase();
  let score = 0;
  for (const kw of link.keywords) {
    if (q.includes(kw)) score += kw.split(' ').length; // multi-word keywords score higher
  }
  if (q.includes(link.title.toLowerCase())) score += 3;
  return score;
}

// Find relevant links for a query across a department (+ general)
export function findLinks(department, query, topK = 3) {
  const deptLinks = linkDatabase[department.toLowerCase()] || [];
  const generalLinks = linkDatabase.general || [];
  const allLinks = [...deptLinks, ...generalLinks];

  return allLinks
    .map(link => ({ ...link, score: scoreLink(link, query) }))
    .filter(l => l.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Get all links for a department (for admin/management)
export function getDeptLinks(department) {
  return linkDatabase[department.toLowerCase()] || [];
}

// Get all departments with links
export function getAllLinks() {
  return linkDatabase;
}

// Add a custom link (admin feature)
export function addLink(department, link) {
  const dept = department.toLowerCase();
  if (!linkDatabase[dept]) linkDatabase[dept] = [];
  linkDatabase[dept].push(link);
  return { success: true, total: linkDatabase[dept].length };
}

// Delete a link by title
export function deleteLink(department, title) {
  const dept = department.toLowerCase();
  if (!linkDatabase[dept]) return { success: false };
  const before = linkDatabase[dept].length;
  linkDatabase[dept] = linkDatabase[dept].filter(l => l.title !== title);
  return { success: linkDatabase[dept].length < before };
}
