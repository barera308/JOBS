let jobsData = []; 
let currentPage = 1; 
const jobsPerPage = 10; 

function parseDate(dateStr) { 
  if (!dateStr) return null; 
  const gsMatch = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/); 
  if (gsMatch) { 
    return new Date(parseInt(gsMatch[1]), parseInt(gsMatch[2]), parseInt(gsMatch[3])); 
  } 
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/); 
  if (isoMatch) { 
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3])); 
  } 
  const fallbackDate = new Date(dateStr); 
  return !isNaN(fallbackDate) ? fallbackDate : null; 
} 

function formatDeadline(dateStr) { 
  const date = parseDate(dateStr); 
  if (!date) return "No deadline"; 
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); 
} 

async function loadJobsFromSheet() { 
  const sheetId = "1_n6qYGMfMG2xNVkCzbr71Jjl4NfTSyV0aaas_tXgGIg"; 
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`; 
  try { 
    const res = await fetch(url); 
    const text = await res.text(); 
    const json = JSON.parse(text.substr(47).slice(0, -2)); 
    const rows = json.table.rows; 
    jobsData = rows.map(row => ({ 
      title: row.c[0]?.v || '', 
      location: row.c[1]?.v || '', 
      deadline: row.c[2]?.v || '', 
      link: row.c[3]?.v || '#', 
      description: row.c[4]?.v || '', 
      originalAd: row.c[5]?.v || '' 
    })); 
    renderJobs(); 
  } catch (error) { 
    console.error("Error loading jobs from sheet:", error); 
    document.getElementById('job-list').innerText = "❌ Failed to load jobs."; 
  } 
} 

function renderJobs() { 
  const sortOption = document.getElementById('sort-select').value; 
  const searchQuery = document.getElementById('search-input').value.toLowerCase(); 
  const jobList = document.getElementById('job-list'); 

  let filteredJobs = jobsData 
    .filter(job => 
      job.title.toLowerCase().includes(searchQuery) || 
      job.description.toLowerCase().includes(searchQuery) 
    ) 
    .sort((a, b) => { 
      const dateA = parseDate(a.deadline) || new Date(8640000000000000); 
      const dateB = parseDate(b.deadline) || new Date(8640000000000000); 
      return sortOption === 'latest' ? dateB - dateA : dateA - dateB; 
    }); 

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage); 
  if (currentPage > totalPages) currentPage = totalPages || 1; 

  const start = (currentPage - 1) * jobsPerPage; 
  const end = start + jobsPerPage; 
  const currentJobs = filteredJobs.slice(start, end); 

  function highlight(text, query) { 
    if (!query) return text; 
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'); 
    return text.replace(regex, '<mark>$1</mark>'); 
  } 

  jobList.innerHTML = currentJobs.map(job => ` 
    <div class="job" data-deadline="${job.deadline}"> 
      <h3> 
        <a href="${job.link}" target="_blank" rel="noopener"> 
          ${highlight(job.title, searchQuery)} 
        </a> 
      </h3> 
      <p><strong>Location:</strong> ${job.location}</p> 
      <p><strong>Deadline:</strong> ${formatDeadline(job.deadline)}</p> 
      <p>${highlight(job.description, searchQuery)}</p> 

      <a href="${job.link}" target="_blank" rel="noopener" class="btn btn-primary">View Details</a> 
       
      ${job.originalAd && !job.originalAd.includes('dealcheck') ?  
        `<a href="${job.originalAd}" target="_blank" rel="noopener" class="btn btn-primary">View Original Ad</a>`  
        : ''} 

      <button class="btn btn-success" onclick="toggleShareMenu(this)">Share</button> 

      <div class="share-menu"> 
        <a href="#" onclick="shareOnFacebook(event, this)">Facebook</a> | 
        <a href="#" onclick="shareOnTwitter(event, this)">Twitter</a> | 
        <a href="#" onclick="shareOnLinkedIn(event, this)">LinkedIn</a> | 
        <a href="#" onclick="shareByEmail(event, this)">Email</a> | 
        <a href="#" onclick="shareOnWhatsApp(event, this)">WhatsApp</a> 
      </div> 
    </div> 
  `).join(''); 

  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`; 
} 

function nextPage() { 
  const searchQuery = document.getElementById('search-input').value.toLowerCase(); 
  const totalPages = Math.ceil(jobsData.filter(job => job.title.toLowerCase().includes(searchQuery) || job.description.toLowerCase().includes(searchQuery)).length / jobsPerPage); 
  if (currentPage < totalPages) { 
    currentPage++; 
    renderJobs(); 
  } 
} 

function prevPage() { 
  if (currentPage > 1) { 
    currentPage--; 
    renderJobs(); 
  } 
} 

function toggleShareMenu(button) { 
  const menu = button.nextElementSibling; 
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; 
} 

function shareOnFacebook(e, el) { 
  e.preventDefault(); 
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(el.closest('.job').querySelector('a').href)}`); 
} 
function shareOnTwitter(e, el) { 
  e.preventDefault(); 
  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(el.closest('.job').querySelector('a').href)}`); 
} 
function shareOnLinkedIn(e, el) { 
  e.preventDefault(); 
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(el.closest('.job').querySelector('a').href)}`); 
} 
function shareByEmail(e, el) { 
  e.preventDefault(); 
  window.location.href = `mailto:?subject=Check out this job&body=${encodeURIComponent(el.closest('.job').querySelector('a').href)}`; 
} 
function shareOnWhatsApp(e, el) { 
  e.preventDefault(); 
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(el.closest('.job').querySelector('a').href)}`); 
} 

document.addEventListener('DOMContentLoaded', loadJobsFromSheet); 

document.getElementById('search-input').addEventListener('keypress', function(e) { 
  if (e.key === 'Enter') { 
    renderJobs(); 
  } 
});
