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
$$('[data-open]').forEach(b=>b.onclick=()=>{if(b.dataset.open==='planModal')openCalendarForm();else{prepareForms();$('#'+b.dataset.open).showModal()}});

$$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog')?.close());

function fileToDataURL(file){return new Promise((res,rej)=>{if(!file)return res('');const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

let planMode='event';
function setPlanMode(mode){planMode=mode;$('#singleEventFields').hidden=mode!=='event';$('#scheduleFields').hidden=mode!=='schedule';$('#planTitle').required=mode==='event';$('#planDate').required=mode==='event';$('#modeEvent').classList.toggle('secondary',mode!=='event');$('#modeSchedule').classList.toggle('secondary',mode!=='schedule');$('#planModalTitle').textContent=mode==='event'?'Додати подію':'Додати графік публікацій';$('#planSubmit').textContent=mode==='event'?'Зберегти подію':'Створити графік'}
$('#modeEvent').onclick=()=>setPlanMode('event');$('#modeSchedule').onclick=()=>setPlanMode('schedule');
function openCalendarForm(mode='event',plan=null){prepareForms();fillScheduleBooks();$('#planForm').reset();$('#planEditId').value=plan?.id||'';$('#planDate').value=plan?.date||selectedDate;$('#scheduleStart').value=selectedDate;$('#planTime').value=plan?.time||'19:00';if(plan){$('#planTitle').value=plan.title;$('#planBook').value=plan.bookId||'';$('#planType').value=plan.type||'Інше';$('#planChars').value=plan.targetChars||'';}setPlanMode(mode);$('#planModal').showModal()}
$('#planForm').addEventListener('submit',e=>{e.preventDefault();if(planMode==='schedule'){const id=$('#scheduleBook').value,start=$('#scheduleStart').value,n=Number($('#scheduleCount').value),freq=Number($('#scheduleFrequency').value),first=Number($('#scheduleFirstChapter').value);if(!id||!start||n<1||n>500||first<1)return alert('Перевір книгу, дату та кількість глав');const group=crypto.randomUUID();for(let i=0;i<n;i++){const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+i*freq);const date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');state.plans.push({id:crypto.randomUUID(),scheduleId:group,bookId:id,title:`Публікація глави ${first+i}`,chapterOrder:first+i,date,time:$('#scheduleTime').value,type:'Публікація',done:false,autoPublication:true})}}else{const id=$('#planEditId').value;const old=state.plans.find(x=>x.id===id);const data={title:$('#planTitle').value.trim(),bookId:$('#planBook').value,date:$('#planDate').value,time:$('#planTime').value,type:$('#planType').value,targetChars:+$('#planChars').value||0};if(old)Object.assign(old,data);else state.plans.push({id:crypto.randomUUID(),...data,done:false})}$('#planModal').close();save()});
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

let selectedDate=todayISO(),calendarView='month';
const localISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const dayDate=iso=>new Date(iso+'T12:00:00');
function eventHtml(p){return `<button type="button" class="cal-event" data-edit-event="${p.id}" title="Редагувати"><span>${escapeHtml(p.time||'—:—')}</span> <b>${escapeHtml(p.title)}</b>${p.bookId?`<small>${escapeHtml(bookName(p.bookId))}</small>`:''}</button>`}
function renderCalendar(){const current=dayDate(selectedDate);let dates=[];let heading='';if(calendarView==='month'){const first=new Date(current.getFullYear(),current.getMonth(),1,12),last=new Date(current.getFullYear(),current.getMonth()+1,0,12);const begin=new Date(first);begin.setDate(1-(first.getDay()+6)%7);const finish=new Date(last);finish.setDate(last.getDate()+(6-(last.getDay()+6)%7));for(let d=new Date(begin);d<=finish;d.setDate(d.getDate()+1))dates.push(localISO(d));heading=current.toLocaleDateString('uk-UA',{month:'long',year:'numeric'});}else if(calendarView==='week'){const start=new Date(current);start.setDate(current.getDate()-(current.getDay()+6)%7);for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);dates.push(localISO(d))}heading=`${dates[0]} — ${dates[6]}`}else{dates=[selectedDate];heading=current.toLocaleDateString('uk-UA',{day:'numeric',month:'long',year:'numeric'})}$('#calendarRange').textContent=heading;$$('[data-calview]').forEach(b=>b.classList.toggle('active',b.dataset.calview===calendarView));$('#calendarGrid').className='calendar-grid '+calendarView;$('#calendarGrid').innerHTML=(calendarView==='month'?'<div class="cal-weekdays">'+['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(x=>`<span>${x}</span>`).join('')+'</div>':'')+`<div class="cal-days">${dates.map(iso=>{const ev=state.plans.filter(p=>p.date===iso).sort((a,b)=>(a.time||'').localeCompare(b.time||''));return `<div class="cal-day ${iso===selectedDate?'selected':''} ${iso===todayISO()?'is-today':''}"><button type="button" class="cal-day-title" data-caldate="${iso}">${dayDate(iso).toLocaleDateString('uk-UA',{day:'numeric',...(calendarView!=='month'?{weekday:'short',month:'short'}:{})})}</button><div class="cal-events">${(calendarView==='month'?ev.slice(0,3):ev).map(eventHtml).join('')}${calendarView==='month'&&ev.length>3?`<button type="button" class="cal-more" data-caldate="${iso}">+ ще ${ev.length-3}</button>`:''}</div></div>`}).join('')}</div>`;const d=dayDate(selectedDate);$('#calendarDateTitle').textContent=d.toLocaleDateString('uk-UA',{day:'numeric',month:'long'});const plans=state.plans.filter(p=>p.date===selectedDate).sort((a,b)=>(a.time||'').localeCompare(b.time||''));$('#timeline').innerHTML=plans.length?plans.map(p=>`<div class="cal-list-item"><div><b>${escapeHtml(p.time||'Без часу')} · ${escapeHtml(p.title)}</b><small>${escapeHtml(bookName(p.bookId))}</small></div><div><button class="btn small secondary" data-edit-event="${p.id}">Змінити</button><button class="btn small secondary" data-remove-event="${p.id}">×</button></div></div>`).join(''):'<p class="muted">На цей день подій немає.</p>';$$('[data-caldate]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.caldate;renderCalendar()});$$('[data-edit-event]').forEach(b=>b.onclick=()=>{const p=state.plans.find(x=>x.id===b.dataset.editEvent);if(p)openCalendarForm('event',p)});$$('[data-remove-event]').forEach(b=>b.onclick=()=>{if(confirm('Видалити цю подію?')){state.plans=state.plans.filter(p=>p.id!==b.dataset.removeEvent);save()}})}
$$('[data-calview]').forEach(b=>b.onclick=()=>{calendarView=b.dataset.calview;renderCalendar()});
$('#calendarPrev').onclick=()=>moveCalendar(-1);$('#calendarNext').onclick=()=>moveCalendar(1);$('#calendarToday').onclick=()=>{selectedDate=todayISO();renderCalendar()};
function moveCalendar(dir){const d=dayDate(selectedDate);if(calendarView==='month'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+dir);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}else d.setDate(d.getDate()+dir*(calendarView==='week'?7:1));selectedDate=localISO(d);renderCalendar()}
$('#calendarAdd').onclick=()=>openCalendarForm();$('#calendarAddSecond').onclick=()=>openCalendarForm();
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
    const target=new URL(url);
    const r=await fetch(url,{mode:'cors',cache:'no-store'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    // Захист від помилкової відповіді PWA/service worker або редиректу на наш сайт.
    const responseUrl=new URL(r.url||url);
    if(responseUrl.origin!==target.origin) throw new Error('Unexpected response origin');
    const html=await r.text();
    if(/<title>\s*Мій Автор\s*<\/title>/i.test(html) || html.includes('id="bookModal"')){
      throw new Error('App shell returned instead of remote page');
    }
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


// Рукописи зберігаються окремо від старих даних у IndexedDB.
const manuscriptDB=new Promise((resolve,reject)=>{const r=indexedDB.open('miy-avtor-manuscripts',1);r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('chapters',{keyPath:'id'});db.createObjectStore('writing',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
async function storeAll(name){const db=await manuscriptDB;return new Promise((resolve,reject)=>{const tx=db.transaction(name,'readonly');const req=tx.objectStore(name).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function storePut(name,item){const db=await manuscriptDB;return new Promise((resolve,reject)=>{const tx=db.transaction(name,'readwrite');tx.objectStore(name).put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function storeDelete(name,id){const db=await manuscriptDB;return new Promise((resolve,reject)=>{const tx=db.transaction(name,'readwrite');tx.objectStore(name).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
const charCount=s=>Array.from(s||'').length;
const localDay=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
let currentBookId='',currentChapterId='',editing=false,saveTimer=null,lastSavedText='',draftNew=false;
function downloadJSON(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function renderManuscriptBooks(){const el=$('#manuscriptBooks');if(!el)return;const chapters=await storeAll('chapters');el.innerHTML=state.books.map(b=>`<div class="manuscript-row"><span>${escapeHtml(b.title)} <small class="muted">(${chapters.filter(c=>c.bookId===b.id).length} глав)</small></span><button class="btn small" data-manuscript="${b.id}">Відкрити</button></div>`).join('')||'<p class="muted">Спочатку додай книгу.</p>';el.querySelectorAll('[data-manuscript]').forEach(btn=>btn.onclick=()=>openManuscript(btn.dataset.manuscript))}
async function openManuscript(id){currentBookId=id;$('#readerTitle').textContent=bookName(id);$('#readerModal').showModal();await showChapters()}
async function showChapters(){clearTimeout(saveTimer);$('#readerPanel').hidden=true;$('#chapterList').hidden=false;const chapters=(await storeAll('chapters')).filter(c=>c.bookId===currentBookId).sort((a,b)=>a.order-b.order);$('#chapterList').innerHTML=`<div class="reader-toolbar"><button class="btn" id="newChapter">+ Написати главу</button><label class="btn secondary" style="cursor:pointer">Імпорт TXT <input id="chapterImport" type="file" accept=".txt,text/plain" hidden multiple></label><button class="btn secondary" id="exportBookEdits">↓ Усі правки</button></div>`+chapters.map(c=>`<div class="manuscript-row"><span>${escapeHtml(c.title)} <small class="muted">${fmt(charCount(c.edited??c.original))} ЗбП · ${c.ready?'готова':'чернетка'}</small></span><div><button class="btn small secondary" data-ready="${c.id}">${c.ready?'✓ Готова':'○ Готова?'}</button> <button class="btn small" data-chapter="${c.id}">Читати</button></div></div>`).join('');$('#newChapter').onclick=()=>createChapter();$('#chapterImport').onchange=async e=>{const existing=(await storeAll('chapters')).filter(c=>c.bookId===currentBookId);let n=existing.length;for(const f of e.target.files){const t=await f.text();await storePut('chapters',{id:crypto.randomUUID(),bookId:currentBookId,order:++n,title:f.name.replace(/\.txt$/i,''),original:t,edited:null,ready:true,createdAt:new Date().toISOString()})}await showChapters();refreshAuthorWidgets()};$('#exportBookEdits').onclick=async()=>{const all=(await storeAll('chapters')).filter(c=>c.bookId===currentBookId).map(c=>({title:c.title,original:c.original,edited:c.edited,changed:c.edited!==null&&c.edited!==c.original}));downloadJSON({book:bookName(currentBookId),chapters:all},'pravky-knyhy.json')};$('#chapterList').querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>openChapter(b.dataset.chapter));$('#chapterList').querySelectorAll('[data-ready]').forEach(b=>b.onclick=async()=>{const c=(await storeAll('chapters')).find(x=>x.id===b.dataset.ready);c.ready=!c.ready;await storePut('chapters',c);await showChapters();refreshAuthorWidgets()})}
async function createChapter(){const chapters=(await storeAll('chapters')).filter(c=>c.bookId===currentBookId);const title=prompt('Назва глави:',`Розділ ${chapters.length+1}`);if(!title)return;const c={id:crypto.randomUUID(),bookId:currentBookId,order:chapters.length+1,title,original:'',edited:null,ready:false,createdAt:new Date().toISOString(),newWriting:true};await storePut('chapters',c);await openChapter(c.id,true)}
async function openChapter(id,write=false){const c=(await storeAll('chapters')).find(x=>x.id===id);if(!c)return;currentChapterId=id;draftNew=!!c.newWriting;$('#chapterList').hidden=true;$('#readerPanel').hidden=false;$('#chapterTitle').textContent=c.title;lastSavedText=c.edited??c.original;$('#readerEditor').value=lastSavedText;editing=false;setEditorMode(write);updateReaderCounts();$('#readerDiff').textContent='';$('#readerText').textContent=lastSavedText||'Поки немає тексту.'}
function setEditorMode(v){editing=v;$('#readerEditor').hidden=!v;$('#readerText').hidden=v;$('#readerMode').textContent=v?'Режим: редагування':'Режим: читання';if(!v)$('#readerText').textContent=$('#readerEditor').value||'Поки немає тексту.'}
function updateReaderCounts(){const text=$('#readerEditor').value;$('#readerCounts').textContent=`${fmt(charCount(text))} знаків із пробілами · ${fmt(text.trim()?text.trim().split(/\s+/).length:0)} слів`}
async function persistChapter(){clearTimeout(saveTimer);const c=(await storeAll('chapters')).find(x=>x.id===currentChapterId);if(!c)return;const next=$('#readerEditor').value;if(next===lastSavedText)return;const previous=lastSavedText;lastSavedText=next;c.edited=next;await storePut('chapters',c);if(c.newWriting){ // Підраховуємо лише додані знаки, без повторного обліку вставленого раніше тексту.
let prefix=0;while(prefix<previous.length&&prefix<next.length&&previous[prefix]===next[prefix])prefix++;let suffix=0;while(suffix<previous.length-prefix&&suffix<next.length-prefix&&previous[previous.length-1-suffix]===next[next.length-1-suffix])suffix++;const added=charCount(next.slice(prefix,next.length-suffix));if(added>0){const day=localDay(),key=day+'|'+c.bookId;const item=(await storeAll('writing')).find(w=>w.id===key)||{id:key,day,bookId:c.bookId,chars:0};item.chars+=added;await storePut('writing',item)}}updateReaderCounts();refreshAuthorWidgets()}
$('#readerEditor').addEventListener('input',()=>{updateReaderCounts();clearTimeout(saveTimer);saveTimer=setTimeout(()=>persistChapter().catch(console.error),500)});
$('#readerMode').onclick=async()=>{if(editing)await persistChapter();setEditorMode(!editing)};
$('#readerBack').onclick=async()=>{await persistChapter();await showChapters()};
$('#readerClose').onclick=async()=>{await persistChapter();$('#readerModal').close()};
$('#readerExport').onclick=async()=>{await persistChapter();const c=(await storeAll('chapters')).find(x=>x.id===currentChapterId);downloadJSON({book:bookName(c.bookId),chapter:c.title,original:c.original,edited:c.edited,changesPresent:c.edited!==null&&c.edited!==c.original},'pravky-glavy.json')};
$('#readerModal').addEventListener('cancel',e=>{e.preventDefault();$('#readerClose').click()});
function fillScheduleBooks(){const el=$('#scheduleBook');const prev=el.value;el.innerHTML=state.books.map(b=>`<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');if(state.books.some(b=>b.id===prev))el.value=prev}
async function refreshAuthorWidgets(){await Promise.all([renderManuscriptBooks(),renderWriting(),renderSOS()]);fillScheduleBooks()}
async function renderWriting(){const el=$('#writingToday');if(!el)return;const rows=(await storeAll('writing')).filter(x=>x.day===localDay());el.innerHTML=`<b>✍️ Реально написано сьогодні: ${fmt(rows.reduce((s,r)=>s+r.chars,0))} ЗбП</b>`+rows.map(r=>`<div class="manuscript-row"><span>${escapeHtml(bookName(r.bookId))}</span><b>${fmt(r.chars)}</b></div>`).join('');$('#todayChars').textContent=fmt(rows.reduce((s,r)=>s+r.chars,0))}
async function renderSOS(){const el=$('#sosAlerts');if(!el)return;const chapters=await storeAll('chapters'),today=localDay();let alerts=[];for(const b of state.books){if(['Завершено','Заморожено','Ідея'].includes(b.status))continue;const pubs=state.plans.filter(p=>p.bookId===b.id&&p.autoPublication&&!p.done).sort((a,z)=>a.date.localeCompare(z.date));if(!pubs.length)continue;const ready=new Set(chapters.filter(c=>c.bookId===b.id&&c.ready).map(c=>c.order));const firstMissing=pubs.find(p=>!ready.has(p.chapterOrder));if(!firstMissing)continue;const gap=Math.ceil((new Date(firstMissing.date+'T12:00:00')-new Date(today+'T12:00:00'))/86400000);if(gap<=7)alerts.push(`<div class="sos-card"><b>🚨 СОС, ДИБІЛ, СКОРО КІНЕЦЬ СВІТУ!</b><p>«${escapeHtml(b.title)}»: глава ${firstMissing.chapterOrder} ще не готова. ${gap<0?'Публікація прострочена!':gap===0?'Публікація сьогодні!':`До виходу ${gap} дн.`}</p></div>`)}el.innerHTML=alerts.join('')}
// Резервна копія включає нові рукописи та статистику написання.
$('#exportBtn').onclick=async()=>downloadJSON({...state,manuscriptChapters:await storeAll('chapters'),writingHistory:await storeAll('writing'),backupVersion:2},'miy-avtor-backup-v2.json');
$('#importInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.books)||!Array.isArray(data.plans)||!Array.isArray(data.stats))throw Error('Невірний формат');if(!confirm('Імпорт замінить поточні книги, плани й статистику. Продовжити?'))return;for(const c of data.manuscriptChapters||[])await storePut('chapters',c);for(const w of data.writingHistory||[])await storePut('writing',w);for(const k of ['books','plans','stats','theme'])if(data[k]!==undefined)state[k]=data[k];save();refreshAuthorWidgets();alert('Дані відновлено')}catch(err){alert('Не вдалося імпортувати: '+err.message)}};
refreshAuthorWidgets().catch(err=>console.error('Помилка локальної бази',err));
