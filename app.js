const KEY='miyAvtorV1';
const state=JSON.parse(localStorage.getItem(KEY)||'null')||{books:[],plans:[],stats:[],theme:'light'};
const save=()=>{localStorage.setItem(KEY,JSON.stringify(state));renderAll()};
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const todayISO=()=>new Date().toISOString().slice(0,10);
const fmt=n=>new Intl.NumberFormat('uk-UA').format(Number(n||0));
const escapeHtml=s=>(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function setTheme(){document.body.classList.toggle('dark',state.theme==='dark');$('#themeBtn').textContent=state.theme==='dark'?'☀':'☾'}
$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save();setTheme()};

$$('.nav-btn').forEach(b=>b.onclick=()=>{$$('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.tab').forEach(t=>t.classList.remove('active'));$('#'+b.dataset.tab).classList.add('active');$('#pageTitle').textContent=b.dataset.title;if(b.dataset.tab==='calendarTab')renderCalendar()});
$$('[data-open]').forEach(b=>b.onclick=()=>{prepareForms();$('#'+b.dataset.open).showModal()});

$$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog')?.close());

function fileToDataURL(file){return new Promise((res,rej)=>{if(!file)return res('');const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

$('#planForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return; e.preventDefault(); state.plans.push({id:crypto.randomUUID(),title:$('#planTitle').value.trim(),bookId:$('#planBook').value,date:$('#planDate').value,time:$('#planTime').value,type:$('#planType').value,targetChars:+$('#planChars').value||0,done:false}); e.target.reset(); $('#planModal').close(); save()});
$('#bookForm').addEventListener('submit',async e=>{
  if(e.submitter?.value==='cancel')return;
  e.preventDefault();
  const id=$('#bookEditId').value;
  const existing=state.books.find(b=>b.id===id);
  const uploaded=await fileToDataURL($('#bookCover').files[0]);
  const book={
    id:id||crypto.randomUUID(),
    title:$('#bookTitle').value.trim(),
    author:$('#bookAuthor').value.trim(),
    series:$('#bookSeries').value.trim(),
    annotation:$('#bookAnnotation').value.trim(),
    genre:$('#bookGenre').value.trim(),
    status:$('#bookStatus').value,
    chapters:+$('#bookChapters').value||0,
    targetChapters:+$('#bookTargetChapters').value||0,
    chars:+$('#bookChars').value||0,
    targetChars:+$('#bookTargetChars').value||0,
    startDate:$('#bookStartDate').value,
    endDate:$('#bookEndDate').value,
    notes:$('#bookNotes').value.trim(),
    cover:uploaded||(state.booksImportCover?.url||existing?.cover||''),
    links:{booknet:$('#bookBooknet').value.trim(),arkush:$('#bookArkush').value.trim(),other:$('#bookOther').value.trim()},
    updatedAt:new Date().toISOString()
  };
  if(existing) Object.assign(existing,book); else state.books.push(book);
  state.booksImportCover=null;
  resetBookForm();
  $('#bookModal').close();
  save();
});
$('#statsForm').addEventListener('submit',async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const screenshot=await fileToDataURL($('#statsScreenshot').files[0]);state.stats.push({id:crypto.randomUUID(),bookId:$('#statsBook').value,platform:$('#statsPlatform').value.trim(),date:$('#statsDate').value,views:+$('#statsViews').value||0,libraries:+$('#statsLibraries').value||0,comments:+$('#statsComments').value||0,rating:+$('#statsRating').value||0,screenshot});e.target.reset();$('#statsModal').close();save()});

function prepareForms(){const opts=state.books.map(b=>`<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');$('#planBook').innerHTML='<option value="">Без книги</option>'+opts;$('#statsBook').innerHTML=opts||'<option value="">Спочатку додайте книгу</option>';$('#planDate').value=todayISO();$('#statsDate').value=todayISO()}
function bookName(id){return state.books.find(b=>b.id===id)?.title||''}

function renderToday(){const today=todayISO();const plans=state.plans.filter(p=>p.date===today).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));$('#todayProgress').textContent=`${plans.filter(p=>p.done).length} / ${plans.length}`;$('#todayChars').textContent=fmt(plans.filter(p=>p.done).reduce((s,p)=>s+(p.targetChars||0),0));$('#todayPlans').innerHTML=plans.length?plans.map(planCard).join(''):'<div class="empty">На сьогодні ще нічого не заплановано.</div>';bindPlanActions()}
function planCard(p){return `<div class="plan-card ${p.done?'done':''}"><button class="check" data-check="${p.id}">${p.done?'✓':''}</button><div class="plan-main"><div class="plan-title">${escapeHtml(p.title)}</div><div class="plan-meta">${p.time?`${p.time} · `:''}${escapeHtml(p.type)}${p.bookId?` · ${escapeHtml(bookName(p.bookId))}`:''}${p.targetChars?` · ${fmt(p.targetChars)} знаків`:''}</div></div><button class="delete-btn" data-delplan="${p.id}">×</button></div>`}
function bindPlanActions(){$$('[data-check]').forEach(b=>b.onclick=()=>{const p=state.plans.find(x=>x.id===b.dataset.check);if(p){p.done=!p.done;save()}});$$('[data-delplan]').forEach(b=>b.onclick=()=>{state.plans=state.plans.filter(x=>x.id!==b.dataset.delplan);save()})}

let selectedDate=todayISO();
function renderCalendar(){const base=new Date();const day=(base.getDay()+6)%7;base.setDate(base.getDate()-day);let html='';for(let i=0;i<7;i++){const d=new Date(base);d.setDate(base.getDate()+i);const iso=d.toISOString().slice(0,10);const wd=d.toLocaleDateString('uk-UA',{weekday:'short'});html+=`<button class="day-chip ${iso===selectedDate?'active':''}" data-date="${iso}"><small>${wd}</small><b>${d.getDate()}</b></button>`}$('#weekStrip').innerHTML=html;$$('[data-date]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.date;renderCalendar()});const d=new Date(selectedDate+'T12:00:00');$('#calendarDateTitle').textContent=d.toLocaleDateString('uk-UA',{day:'numeric',month:'long'});const plans=state.plans.filter(p=>p.date===selectedDate);let rows='';for(let h=8;h<=23;h++){const hh=String(h).padStart(2,'0');const ev=plans.filter(p=>(p.time||'').startsWith(hh+':'));rows+=`<div class="time-row"><div class="time-label">${hh}:00</div><div class="time-slot">${ev.map(p=>`<div class="timeline-event"><b>${escapeHtml(p.title)}</b><br><small>${escapeHtml(p.type)}${p.bookId?' · '+escapeHtml(bookName(p.bookId)):''}</small></div>`).join('')}</div></div>`}$('#timeline').innerHTML=rows}

let bookFilterStatus='all';
let bookSearchText='';

function resetBookForm(){
  state.booksImportCover=null;
  $('#bookForm').reset();
  $('#bookEditId').value='';
  $('#bookModalTitle').textContent='Нова книга';
  $('#bookChapters').value=0;
  $('#bookChars').value=0;
  $('#bookTargetChapters').value='';
  $('#bookTargetChars').value='';
  $('#currentCoverNote').textContent='';
  const status=$('#bookImportStatus');
  if(status){ status.hidden=true; status.className='import-status'; status.textContent=''; }
  const preview=$('#bookCoverPreview');
  if(preview){ preview.hidden=true; preview.innerHTML=''; }
}

function openBookForm(book=null){
  resetBookForm();
  if(book){
    $('#bookEditId').value=book.id;
    $('#bookModalTitle').textContent='Редагувати книгу';
    $('#bookTitle').value=book.title||'';
    $('#bookAuthor').value=book.author||'';
    $('#bookSeries').value=book.series||'';
    $('#bookAnnotation').value=book.annotation||'';
    $('#bookGenre').value=book.genre||'';
    $('#bookStatus').value=book.status||'Ідея';
    $('#bookChapters').value=book.chapters||0;
    $('#bookTargetChapters').value=book.targetChapters||'';
    $('#bookChars').value=book.chars||0;
    $('#bookTargetChars').value=book.targetChars||'';
    $('#bookStartDate').value=book.startDate||'';
    $('#bookEndDate').value=book.endDate||'';
    $('#bookBooknet').value=book.links?.booknet||'';
    $('#bookArkush').value=book.links?.arkush||'';
    $('#bookOther').value=book.links?.other||'';
    $('#bookNotes').value=book.notes||'';
    $('#currentCoverNote').textContent=book.cover?'Поточна обкладинка збережеться, якщо не обирати нову.':'';
    if(book.cover){ const preview=$('#bookCoverPreview'); preview.hidden=false; preview.innerHTML=`<img src="${book.cover}" alt="Обкладинка"><span>Поточна обкладинка</span>`; }
  }
  $('#bookModal').showModal();
}

function detectPlatform(url){
  try{
    const host=new URL(url).hostname.toLowerCase();
    if(host.includes('booknet')) return 'booknet';
    if(host.includes('arkush')) return 'arkush';
  }catch{}
  return 'other';
}

function cleanImportedTitle(t){
  return (t||'').replace(/\s*[|–—-]\s*(Букнет|Booknet|Аркуш|Arkush).*$/i,'').trim();
}

async function importBookFromUrl(url){
  resetBookForm();
  const platform=detectPlatform(url);
  if(platform==='booknet') $('#bookBooknet').value=url;
  else if(platform==='arkush') $('#bookArkush').value=url;
  else $('#bookOther').value=url;

  $('#bookModalTitle').textContent='Перевірте дані книги';
  const status=$('#bookImportStatus');
  status.hidden=false;
  status.className='import-status loading';
  status.textContent=`Пробую отримати дані з ${platform==='booknet'?'Booknet':platform==='arkush'?'Аркуша':'сайту'}…`;
  $('#bookModal').showModal();

  let found=[];
  try{
    const r=await fetch(url,{mode:'cors',cache:'no-store'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const html=await r.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    const meta=(name,prop=false)=>doc.querySelector(`meta[${prop?'property':'name'}="${name}"]`)?.content?.trim()||'';
    const title=cleanImportedTitle(meta('og:title',true)||meta('twitter:title')||doc.title);
    const desc=(meta('og:description',true)||meta('description')||meta('twitter:description')).trim();
    const image=meta('og:image',true)||meta('twitter:image');
    const author=meta('author');

    if(title){ $('#bookTitle').value=title; found.push('назву'); }
    if(author){ $('#bookAuthor').value=author; found.push('автора'); }
    if(desc){ $('#bookAnnotation').value=desc; found.push('анотацію'); }
    if(image){
      state.booksImportCover={url:image};
      const preview=$('#bookCoverPreview');
      preview.hidden=false;
      preview.innerHTML=`<img src="${image}" alt="Обкладинка"><span>Обкладинка зі сторінки</span>`;
      $('#currentCoverNote').textContent='Якщо не обирати файл вручну, буде використана знайдена обкладинка.';
      found.push('обкладинку');
    }
  }catch(err){
    console.warn('Book import failed:',err);
  }

  if(found.length){
    status.className='import-status success';
    status.textContent=`Знайдено: ${found.join(', ')}. Перевірте дані перед збереженням.`;
  }else{
    // Не залишаємо жодних вигаданих значень після невдалого імпорту.
    $('#bookTitle').value='';
    $('#bookAuthor').value='';
    $('#bookSeries').value='';
    $('#bookAnnotation').value='';
    $('#bookGenre').value='';
    $('#bookStatus').value='Ідея';
    $('#bookChapters').value=0;
    $('#bookTargetChapters').value='';
    $('#bookChars').value=0;
    $('#bookTargetChars').value='';
    $('#bookStartDate').value='';
    $('#bookEndDate').value='';
    $('#bookNotes').value='';
    status.className='import-status warning';
    status.textContent=`Не вдалося автоматично прочитати сторінку ${platform==='booknet'?'Booknet':platform==='arkush'?'Аркуша':'сайту'}. Посилання вже збережено у формі — заповніть лише відсутні дані вручну.`;
    $('#currentCoverNote').textContent='';
    // Додаткове очищення після можливого автозаповнення браузером.
    setTimeout(()=>{
      if(!$('#bookEditId').value && !found.length){
        $('#bookTitle').value='';
        $('#bookAuthor').value='';
        $('#bookSeries').value='';
        $('#bookAnnotation').value='';
        $('#bookGenre').value='';
      }
    },120);
  }
}


$('#bookCover').addEventListener('change',e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  const preview=$('#bookCoverPreview');
  const reader=new FileReader();
  reader.onload=()=>{preview.hidden=false;preview.innerHTML=`<img src="${reader.result}" alt="Нова обкладинка"><span>Нова обкладинка</span>`};
  reader.readAsDataURL(file);
});

$('#addBookBtn').onclick=()=>$('#bookAddChoiceModal').showModal();
$('#bookManualBtn').onclick=()=>{$('#bookAddChoiceModal').close();openBookForm()};
$('#bookLinkBtn').onclick=()=>{$('#bookAddChoiceModal').close();$('#bookLinkForm').reset();$('#bookLinkModal').showModal()};
$('#bookLinkForm').addEventListener('submit',async e=>{e.preventDefault();const url=$('#bookImportUrl').value.trim();$('#bookLinkModal').close();await importBookFromUrl(url)});

$('#bookSearch').addEventListener('input',e=>{bookSearchText=e.target.value.trim().toLowerCase();renderBooks()});
$('#bookStatusFilter').addEventListener('change',e=>{bookFilterStatus=e.target.value;renderBooks()});

function bookProgress(b){
  if(b.targetChapters>0) return Math.min(100,Math.round((b.chapters/b.targetChapters)*100));
  if(b.targetChars>0) return Math.min(100,Math.round((b.chars/b.targetChars)*100));
  return 0;
}

function renderBooks(){
  const el=$('#booksGrid');
  const books=state.books.filter(b=>{
    const okStatus=bookFilterStatus==='all'||b.status===bookFilterStatus;
    const hay=(b.title+' '+(b.author||'')+' '+(b.series||'')).toLowerCase();
    return okStatus&&(!bookSearchText||hay.includes(bookSearchText));
  }).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  el.innerHTML=books.length?books.map(b=>{
    const pct=bookProgress(b);
    const cover=b.cover?`<img src="${b.cover}" alt="">`:`<div class="cover-placeholder"><span>📖</span><b>${escapeHtml(b.title.slice(0,40))}</b></div>`;
    return `<article class="book-card" data-book="${b.id}"><div class="cover">${cover}</div><div class="book-body"><div class="book-title">${escapeHtml(b.title)}</div><div class="book-info"><span class="tag">${escapeHtml(b.status||'Ідея')}</span></div><div class="book-info">${b.chapters||0}${b.targetChapters?'/'+b.targetChapters:''} глав · ${fmt(b.chars)}${b.targetChars?' / '+fmt(b.targetChars):''} знаків</div>${pct?`<div class="progress"><span style="width:${pct}%"></span></div><div class="progress-label">${pct}%</div>`:''}</div></article>`
  }).join(''):'<div class="empty" style="grid-column:1/-1">За цим фільтром книг немає.</div>';
  $$('[data-book]').forEach(x=>x.onclick=()=>showBook(x.dataset.book));
}

function showBook(id){
  const b=state.books.find(x=>x.id===id);if(!b)return;
  const links=[b.links?.booknet&&['Букнет',b.links.booknet],b.links?.arkush&&['Аркуш',b.links.arkush],b.links?.other&&['Інше',b.links.other]].filter(Boolean);
  const pct=bookProgress(b);
  $('#bookViewContent').innerHTML=`<div class="modal-head"><h3>${escapeHtml(b.title)}</h3><button class="icon-btn" data-view-close>×</button></div><div class="book-detail-head"><div class="book-view-cover">${b.cover?`<img src="${b.cover}">`:'📖'}</div><div><p><span class="tag">${escapeHtml(b.status||'Ідея')}</span></p>${b.author?`<p><b>${escapeHtml(b.author)}</b></p>`:''}${b.series?`<p class="muted">Серія: ${escapeHtml(b.series)}</p>`:''}${b.genre?`<p class="muted">${escapeHtml(b.genre)}</p>`:''}</div></div><div class="book-kpis"><div><b>${b.chapters||0}${b.targetChapters?'/'+b.targetChapters:''}</b><small>глави</small></div><div><b>${fmt(b.chars)}</b><small>знаків</small></div><div><b>${pct?pct+'%':'—'}</b><small>прогрес</small></div></div>${b.annotation?`<div class="book-section"><h4>Анотація</h4><p>${escapeHtml(b.annotation)}</p></div>`:''}<div class="book-section"><h4>Публікації</h4><div class="link-row">${links.map(([n,u])=>`<a class="link-pill" href="${escapeHtml(u)}" target="_blank" rel="noopener">${n} ↗</a>`).join('')||'<span class="muted">Посилань поки немає</span>'}</div></div>${b.startDate||b.endDate?`<div class="book-section"><h4>Терміни</h4><p>${b.startDate?'Початок: '+escapeHtml(b.startDate):''}${b.startDate&&b.endDate?' · ':''}${b.endDate?'План завершення: '+escapeHtml(b.endDate):''}</p></div>`:''}${b.notes?`<div class="book-section"><h4>Примітки</h4><p>${escapeHtml(b.notes)}</p></div>`:''}<div class="book-actions"><button class="btn secondary" data-editbook="${b.id}">Редагувати</button><button class="btn danger-btn" data-deletebook="${b.id}">Видалити</button></div>`;
  $('[data-view-close]').onclick=()=>$('#bookViewModal').close();
  $('[data-editbook]').onclick=()=>{$('#bookViewModal').close();openBookForm(b)};
  $('[data-deletebook]').onclick=()=>deleteBook(b.id);
  $('#bookViewModal').showModal();
}

window.deleteBook=id=>{
  const b=state.books.find(x=>x.id===id);
  if(!b||!confirm(`Видалити книгу «${b.title}»? Разом із нею буде видалено пов'язані плани та статистику.`))return;
  state.books=state.books.filter(b=>b.id!==id);
  state.plans=state.plans.filter(p=>p.bookId!==id);
  state.stats=state.stats.filter(s=>s.bookId!==id);
  $('#bookViewModal').close();save();
}
function renderStats(){const bf=$('#statsBookFilter'),pf=$('#statsPlatformFilter');const oldB=bf.value,oldP=pf.value;bf.innerHTML='<option value="all">Усі книги</option>'+state.books.map(b=>`<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');const platforms=[...new Set(state.stats.map(s=>s.platform).filter(Boolean))];pf.innerHTML='<option value="all">Усі сайти</option>'+platforms.map(p=>`<option>${escapeHtml(p)}</option>`).join('');if([...bf.options].some(o=>o.value===oldB))bf.value=oldB;if([...pf.options].some(o=>o.value===oldP))pf.value=oldP;const list=state.stats.filter(s=>(bf.value==='all'||s.bookId===bf.value)&&(pf.value==='all'||s.platform===pf.value)).sort((a,b)=>b.date.localeCompare(a.date));const latestByKey={};for(const s of [...list].sort((a,b)=>a.date.localeCompare(b.date)))latestByKey[s.bookId+'|'+s.platform]=s;const latest=Object.values(latestByKey);const sum=k=>latest.reduce((a,s)=>a+(Number(s[k])||0),0);$('#statsSummary').innerHTML=`<article class="summary-card"><span>Перегляди</span><strong>${fmt(sum('views'))}</strong><small>останні записи</small></article><article class="summary-card"><span>Бібліотеки</span><strong>${fmt(sum('libraries'))}</strong><small>останні записи</small></article>`;$('#statsList').innerHTML=list.length?list.map(s=>`<article class="stat-card"><div style="display:flex;justify-content:space-between;gap:10px"><div><h3>${escapeHtml(bookName(s.bookId))}</h3><span class="tag">${escapeHtml(s.platform)}</span> <small class="muted">${s.date}</small></div><button class="delete-btn" data-delstat="${s.id}">×</button></div><div class="stat-grid" style="margin-top:10px"><div><b>${fmt(s.views)}</b><small>перегляди</small></div><div><b>${fmt(s.libraries)}</b><small>бібліотеки</small></div><div><b>${fmt(s.comments)}</b><small>коментарі</small></div><div><b>${s.rating||'—'}</b><small>рейтинг</small></div></div>${s.screenshot?`<details style="margin-top:10px"><summary>Скрін статистики</summary><img src="${s.screenshot}" style="width:100%;border-radius:12px;margin-top:8px"></details>`:''}</article>`).join(''):'<div class="empty">Статистики поки немає.</div>';$$('[data-delstat]').forEach(b=>b.onclick=()=>{state.stats=state.stats.filter(s=>s.id!==b.dataset.delstat);save()})}
$('#statsBookFilter').onchange=renderStats;$('#statsPlatformFilter').onchange=renderStats;

$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='miy-avtor-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('#importInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data&&Array.isArray(data.books)&&Array.isArray(data.plans)&&Array.isArray(data.stats)){Object.assign(state,data);save();alert('Дані відновлено')}else alert('Невірний файл резервної копії')}catch{alert('Не вдалося прочитати файл')}};
$('#resetBtn').onclick=()=>{if(confirm('Очистити всі дані додатка?')){state.books=[];state.plans=[];state.stats=[];save()}};
['goalsBtn','ideasBtn','contentBtn'].forEach(id=>$('#'+id).onclick=()=>alert('Цей розділ підготуємо у наступній версії.'));

function renderAll(){setTheme();renderToday();renderCalendar();renderBooks();renderStats();prepareForms()}
renderAll();
