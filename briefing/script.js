const form = document.getElementById('briefingForm');
const storageKey = 'puxa-e-brilha-briefing-respostas-v1';
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const saveStatus = document.getElementById('saveStatus');
const resultCard = document.getElementById('resultCard');

function fields(){ return [...form.elements].filter((el) => el.name && el.type !== 'button' && el.type !== 'submit'); }
function collect(){
  const data = {};
  fields().forEach((el) => {
    if (el.type === 'checkbox') { if (!data[el.name]) data[el.name] = []; if (el.checked) data[el.name].push(el.value); }
    else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; else if (!(el.name in data)) data[el.name] = ''; }
    else data[el.name] = el.value;
  });
  return data;
}
function fill(data){
  fields().forEach((el) => {
    if (!(el.name in data)) return;
    if (el.type === 'checkbox') el.checked = Array.isArray(data[el.name]) && data[el.name].includes(el.value);
    else if (el.type === 'radio') el.checked = data[el.name] === el.value;
    else el.value = data[el.name] || '';
  });
  updateProgress();
}
function save(show=true){
  localStorage.setItem(storageKey, JSON.stringify({ savedAt: new Date().toISOString(), answers: collect() }));
  saveStatus.textContent = show ? 'Respostas salvas neste dispositivo' : 'Salvamento automático ativado';
  if (show) setTimeout(() => saveStatus.textContent = 'Salvamento automático ativado', 2400);
}
function updateProgress(){
  const all = fields();
  const completed = all.filter((el) => el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value.trim()).length;
  const percent = Math.min(100, Math.round((completed / all.length) * 100));
  progressBar.style.width = percent + '%'; progressText.textContent = percent + '% preenchido';
}
function answerText(){
  const data = collect();
  const labels = {};
  fields().forEach((el) => { if (el.name && !labels[el.name]) { const label = el.closest('label'); labels[el.name] = label ? label.firstChild.textContent.trim() : el.name; } });
  const lines = ['BRIEFING DA EMPRESA', 'Preenchido em: ' + new Date().toLocaleString('pt-BR'), ''];
  Object.entries(data).forEach(([key, value]) => { const readable = Array.isArray(value) ? value.filter(Boolean).join(', ') : value; if (readable) lines.push((labels[key] || key) + ': ' + readable); });
  return lines.join('\n');
}
function download(){
  const blob = new Blob([answerText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'briefing-' + (collect().empresa || 'empresa').toLowerCase().replace(/[^a-z0-9]+/gi, '-') + '.txt'; a.click(); URL.revokeObjectURL(url);
}
async function share(){
  const text = answerText();
  if (navigator.share) { try { await navigator.share({ title: 'Briefing da minha empresa', text }); return; } catch (e) {} }
  await navigator.clipboard?.writeText(text); alert('Resumo copiado. Agora cole no WhatsApp ou no e-mail para enviar.');
}
form.addEventListener('input', () => { updateProgress(); save(false); });
form.addEventListener('change', () => { updateProgress(); save(false); });
document.getElementById('saveButton').addEventListener('click', () => save(true));
document.getElementById('downloadButton').addEventListener('click', download);
document.getElementById('shareButton').addEventListener('click', share);
document.getElementById('editButton').addEventListener('click', () => { resultCard.classList.add('hidden'); form.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
form.addEventListener('submit', (event) => { event.preventDefault(); save(true); form.classList.add('hidden'); resultCard.classList.remove('hidden'); resultCard.scrollIntoView({ behavior: 'smooth' }); });

try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (saved?.answers) fill(saved.answers); else updateProgress(); } catch { updateProgress(); }
