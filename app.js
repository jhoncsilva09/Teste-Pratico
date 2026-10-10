// Copie estes valores de Configurações do projeto > Seus apps > Configuração do SDK.
const firebaseConfig = {
	apiKey: 'AIzaSyC7r9PRMtObvBxPgbox6mVOyUsM6urBetA',
	authDomain: 'teste-pratico-de193.firebaseapp.com',
	projectId: 'teste-pratico-de193',
	storageBucket: 'teste-pratico-de193.firebasestorage.app',
	messagingSenderId: '422344335065',
	appId: '1:422344335065:web:5b1e0c441942f0f2b728c8',
	measurementId: 'G-7YWYY8JGXQ'
};
const firebaseConfigured = Object.values(firebaseConfig).every(value => value && !value.startsWith('COLE_AQUI'));
const firebaseApp = firebaseConfigured ? firebase.initializeApp(firebaseConfig) : null;
const firebaseAuth = firebaseApp ? firebase.auth() : null;
const studentsCollection = firebaseApp ? firebaseApp.firestore().collection('students') : null;
const STORAGE_KEY = 'teste-pratico-students';
let students = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || [
	{ id: '1', date: '2026-09-03', name: 'Mariana Costa', reason: 'TESTE', result: 'APROVADO' }, { id: '2', date: '2026-09-04', name: 'Rafael Mendes', reason: 'TESTE', result: 'REPROVADO' }, { id: '3', date: '2026-09-05', name: 'Beatriz Lima', reason: 'RETESTE', result: 'APROVADO' }, { id: '4', date: '2026-09-06', name: 'Lucas Andrade', reason: 'TESTE', result: 'PENDENTE' }, { id: '5', date: '2026-09-09', name: 'Camila Rocha', reason: 'RETESTE', result: 'APROVADO' }
];
let editingId = null; let sortKey = 'date'; let sortDirection = -1; let currentView = 'records';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const formatDate = date => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`)).replace('.', '');
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
const toast = message => { $('toast').textContent = message; $('toast').classList.remove('hidden'); setTimeout(() => $('toast').classList.add('hidden'), 2600); };
const badge = value => { const map = { TESTE: ['Teste', 'test'], RETESTE: ['Reteste', 'retest'], APROVADO: ['Aprovado', 'approved'], REPROVADO: ['Reprovado', 'failed'], PENDENTE: ['Pendente', 'pending'] }; return `<span class="pill ${map[value][1]}">${map[value][0]}</span>`; };
function renderRecords() {
	const query = $('searchInput').value.toLowerCase(); const reason = $('reasonFilter').value; const result = $('resultFilter').value;
	const rows = students.filter(item => item.name.toLowerCase().includes(query) && (!reason || item.reason === reason) && (!result || item.result === result)).sort((a, b) => { const av = a[sortKey], bv = b[sortKey]; return String(av).localeCompare(String(bv), 'pt-BR') * sortDirection; });
	$('recordsBody').innerHTML = rows.length ? rows.map(item => `<tr><td class="date-cell">${formatDate(item.date)}</td><td class="name-cell">${esc(item.name)}</td><td>${badge(item.reason)}</td><td>${badge(item.result)}</td><td style="text-align:right; display:flex; justify-content:flex-end; gap:8px;"><button class="icon-btn edit-btn" data-id="${item.id}" title="Editar cadastro"><i data-lucide="pencil" width="16"></i></button><button class="icon-btn delete-btn" data-id="${item.id}" title="Excluir cadastro"><i data-lucide="trash-2" width="16"></i></button></td></tr>`).join('') : `<tr><td colspan="5"><div class="empty"><i data-lucide="inbox" width="28"></i><div>Nenhum cadastro encontrado</div></div></td></tr>`;
	$('quickStats').innerHTML = `<div class="stat-card"><span class="stat-label">Total cadastrados</span><strong>${students.length}</strong><small>alunos no período</small></div><div class="stat-card"><span class="stat-label">Testes</span><strong>${students.filter(x => x.reason === 'TESTE').length}</strong><small>primeira avaliação</small></div><div class="stat-card"><span class="stat-label">Retestes</span><strong>${students.filter(x => x.reason === 'RETESTE').length}</strong><small>nova tentativa</small></div><div class="stat-card"><span class="stat-label">Aprovação geral</span><strong>${percent(students.filter(x => x.result === 'APROVADO').length, students.filter(x => x.result !== 'PENDENTE').length)}%</strong><small>dos avaliados</small></div>`;
	lucide.createIcons(); document.querySelectorAll('.edit-btn').forEach(button => button.onclick = () => openModal(button.dataset.id)); document.querySelectorAll('.delete-btn').forEach(button => button.onclick = () => deleteStudent(button.dataset.id));
}
const percent = (value, total) => total ? Math.round(value / total * 100) : 0;
function renderStats() {
	const year = $('yearFilter').value; const month = $('monthFilter').value; const filtered = students.filter(item => (!year || item.date.startsWith(year)) && (!month || item.date.slice(5, 7) === month)); const evaluated = filtered.filter(x => x.result !== 'PENDENTE'); const approved = evaluated.filter(x => x.result === 'APROVADO'); const rejected = evaluated.filter(x => x.result === 'REPROVADO'); const tests = filtered.filter(x => x.reason === 'TESTE'); const testApproved = tests.filter(x => x.result === 'APROVADO'); const testRejected = tests.filter(x => x.result === 'REPROVADO');
	const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']; const chart = monthNames.map((label, index) => { const monthKey = String(index + 1).padStart(2, '0'); const approvedMonth = filtered.filter(x => (year ? x.date.startsWith(`${year}-${monthKey}`) : x.date.slice(5, 7) === monthKey) && x.result === 'APROVADO').length; const rejectedMonth = filtered.filter(x => (year ? x.date.startsWith(`${year}-${monthKey}`) : x.date.slice(5, 7) === monthKey) && x.result === 'REPROVADO').length; return `<div class="bar-group"><div class="bar" style="height:${Math.max(approvedMonth * 25, approvedMonth ? 5 : 2)}px" title="${approvedMonth} aprovados"></div><div class="bar rejected" style="height:${Math.max(rejectedMonth * 25, rejectedMonth ? 5 : 2)}px" title="${rejectedMonth} reprovados"></div><span class="bar-label">${label}</span></div>`; }).join('');
	$('statsGrid').innerHTML = `<div class="chart-card"><div class="card-title"><div><h3>Resultado por mês</h3><p>Comparativo de aprovados e reprovados</p></div></div><div class="bar-chart">${chart}</div><div class="legend"><span>Aprovados</span><span class="reject">Reprovados</span></div></div><div class="metrics-card"><div class="card-title"><div><h3>Resumo do período</h3><p>${filtered.length} registros encontrados</p></div></div>${metric('Total de alunos', filtered.length, 100, '')} ${metric('Testes realizados', tests.length, percent(tests.length, filtered.length), 'yellow')} ${metric('Aprovados', approved.length, percent(approved.length, evaluated.length), '')} ${metric('Reprovados', rejected.length, percent(rejected.length, evaluated.length), 'red')} ${metric('Teste + aprovado', testApproved.length, percent(testApproved.length, tests.filter(x => x.result !== 'PENDENTE').length), '')} ${metric('Teste + reprovado', testRejected.length, percent(testRejected.length, tests.filter(x => x.result !== 'PENDENTE').length), 'red')}</div>`;
}
const metric = (label, value, progress, color) => `<div class="metric-row"><div class="metric-top"><strong>${label}</strong><span>${value} <small>(${progress}%)</small></span></div><div class="progress"><i class="${color}" style="width:${progress}%"></i></div></div>`;
function openModal(id = null) { editingId = id; const item = students.find(x => x.id === id); $('modalTitle').textContent = id ? 'Editar cadastro' : 'Novo cadastro'; $('studentDate').value = item?.date || today(); $('studentName').value = item?.name || ''; $('studentReason').value = item?.reason || 'TESTE'; $('studentResult').value = item?.result || 'PENDENTE'; $('modalBackdrop').classList.remove('hidden'); setTimeout(() => $('studentName').focus(), 50); }
function closeModal() { $('modalBackdrop').classList.add('hidden'); }
function setView(view) { currentView = view; $('recordsView').classList.toggle('hidden', view !== 'records'); $('statsView').classList.toggle('hidden', view !== 'stats'); $('topTitle').textContent = view === 'records' ? 'Alunos' : 'Estatísticas'; document.querySelectorAll('.nav button').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view)); if (view === 'stats') renderStats(); $('sidebar').classList.remove('open'); }
function populateYearFilter() { const years = [...new Set([new Date().getFullYear(), ...students.map(x => Number(x.date.slice(0, 4)))])].sort((a, b) => b - a); const selectedYear = $('yearFilter').value; $('yearFilter').innerHTML = '<option value="">Todos os anos</option>' + years.map(year => `<option value="${year}">${year}</option>`).join(''); $('yearFilter').value = years.includes(Number(selectedYear)) ? selectedYear : ''; }
async function loadRemoteStudents() {
	const snapshot = await studentsCollection.where('userId', '==', firebaseAuth.currentUser.uid).get();
	students = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
	populateYearFilter();
	save();
}
function parseCsv(text) {
	const rows = [];
	let row = [];
	let cell = '';
	let quoted = false;
	for (let index = 0; index < text.length; index++) {
		const character = text[index];
		if (quoted) {
			if (character === '"' && text[index + 1] === '"') {
				cell += '"';
				index++;
			} else if (character === '"') {
				quoted = false;
			} else {
				cell += character;
			}
		} else if (character === '"' && cell.length === 0) {
			quoted = true;
		} else if (character === ',') {
			row.push(cell);
			cell = '';
		} else if (character === '\n' || character === '\r') {
			row.push(cell);
			if (row.some(value => value.trim())) rows.push(row);
			row = [];
			cell = '';
			if (character === '\r' && text[index + 1] === '\n') index++;
		} else {
			cell += character;
		}
	}
	if (quoted) throw new Error('O CSV contém um campo entre aspas que não foi fechado.');
	row.push(cell);
	if (row.some(value => value.trim())) rows.push(row);
	if (rows.length < 2) throw new Error('O CSV está vazio ou contém apenas o cabeçalho.');

	const headers = rows.shift().map(value => value.trim().replace(/^\uFEFF/, '').toLowerCase());
	const required = ['id', 'date', 'name', 'reason', 'result'];
	const missing = required.filter(header => !headers.includes(header));
	if (missing.length) throw new Error(`Colunas obrigatórias ausentes: ${missing.join(', ')}.`);
	const column = Object.fromEntries(headers.map((header, index) => [header, index]));
	const ids = new Set();
	const owners = new Set();
	const imported = rows.map((values, index) => {
		const line = index + 2;
		const value = header => (values[column[header]] || '').trim();
		const id = value('id').toLowerCase();
		const date = value('date');
		const name = value('name');
		const reason = value('reason').toUpperCase();
		const result = value('result').toUpperCase();
		const owner = column.user_id === undefined ? '' : value('user_id');
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
			throw new Error(`Linha ${line}: identificador inválido; exporte a coluna id do Supabase.`);
		}
		if (ids.has(id)) throw new Error(`Linha ${line}: o identificador ${id} aparece mais de uma vez no CSV.`);
		ids.add(id);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
			throw new Error(`Linha ${line}: data inválida; use o formato AAAA-MM-DD.`);
		}
		if (name.length < 2) throw new Error(`Linha ${line}: nome inválido.`);
		if (!['TESTE', 'RETESTE'].includes(reason)) throw new Error(`Linha ${line}: motivo inválido.`);
		if (!['PENDENTE', 'APROVADO', 'REPROVADO'].includes(result)) throw new Error(`Linha ${line}: avaliação inválida.`);
		if (owner) owners.add(owner);
		return { id, date, name, reason, result };
	});
	if (owners.size > 1) {
		throw new Error('O arquivo contém dados de mais de um usuário do Supabase. Exporte um usuário por vez.');
	}
	return imported;
}
async function importSupabaseCsv(file) {
	const imported = parseCsv(await file.text());
	const confirmed = window.confirm(
		`${imported.length} registros serão importados para a conta Firebase atual. ` +
		'Os IDs do Supabase serão preservados; se um documento com o mesmo ID já existir, ele será atualizado. Continuar?'
	);
	if (!confirmed) return;
	const button = $('importStudentsBtn');
	button.disabled = true;
	try {
		const userId = firebaseAuth.currentUser.uid;
		for (let start = 0; start < imported.length; start += 450) {
			const batch = firebaseApp.firestore().batch();
			imported.slice(start, start + 450).forEach(student => {
				const { id, ...studentData } = student;
				batch.set(studentsCollection.doc(id), { ...studentData, userId });
			});
			await batch.commit();
		}
		await loadRemoteStudents();
		renderRecords();
		if (currentView === 'stats') renderStats();
		toast(`${imported.length} registros importados com sucesso`);
	} finally {
		button.disabled = false;
	}
}
async function saveRemoteStudent(data) {
	const studentData = {
		date: data.date,
		name: data.name,
		reason: data.reason,
		result: data.result,
		userId: firebaseAuth.currentUser.uid
	};
	if (!data.createdAt) studentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
	await studentsCollection.doc(data.id).set(studentData, { merge: true });
}
async function deleteStudent(id) {
	const student = students.find(item => item.id === id);
	if (!student) return;
	const confirmed = window.confirm(`Deseja excluir o cadastro de ${student.name}?`);
	if (!confirmed) return;
	try {
		await studentsCollection.doc(id).delete();
		students = students.filter(item => item.id !== id);
		save();
	} catch (error) {
		console.error('Erro ao excluir cadastro no Firestore:', error);
		toast('Não foi possível excluir o cadastro no Firebase');
		return;
	}
	renderRecords();
	if (currentView === 'stats') renderStats();
	toast('Cadastro excluído com sucesso');
}
$('loginForm').onsubmit = async event => {
	event.preventDefault();
	if (!firebaseAuth || !studentsCollection) {
		toast('Configure os dados do Firebase no arquivo app.js');
		return;
	}
	try {
		await firebaseAuth.signInWithEmailAndPassword($('loginEmail').value, $('loginPassword').value);
		await loadRemoteStudents();
		$('loginView').classList.add('hidden');
		$('appView').classList.remove('hidden');
		renderRecords();
		toast('Login realizado com sucesso');
	} catch (error) {
		console.error('Erro ao entrar ou carregar cadastros do Firebase:', error);
		toast(error.code && error.code.startsWith('auth/') ? 'E-mail ou senha inválidos' : 'Não foi possível carregar os dados do Firebase');
	}
};
$('logoutBtn').onclick = async () => {
	try {
		await firebaseAuth.signOut();
		students = [];
		save();
		$('appView').classList.add('hidden');
		$('loginView').classList.remove('hidden');
	} catch (error) {
		console.error('Erro ao sair do Firebase:', error);
		toast('Não foi possível encerrar a sessão');
	}
};
$('newBtn').onclick = () => openModal(); $('closeModal').onclick = closeModal; $('cancelModal').onclick = closeModal; $('modalBackdrop').onclick = e => { if (e.target === $('modalBackdrop')) closeModal(); };
$('importStudentsBtn').onclick = () => $('studentsCsvInput').click();
$('studentsCsvInput').onchange = async event => {
	const [file] = event.target.files;
	event.target.value = '';
	if (!file) return;
	try {
		await importSupabaseCsv(file);
	} catch (error) {
		console.error('Erro ao importar CSV do Supabase para o Firestore:', error);
		toast(error.message || 'Não foi possível importar o arquivo CSV');
	}
};
$('studentForm').onsubmit = async e => {
	e.preventDefault();
	const isEditing = Boolean(editingId);
	const existingStudent = isEditing ? students.find(item => item.id === editingId) : null;
	const data = {
		id: editingId || crypto.randomUUID(),
		date: $('studentDate').value,
		name: $('studentName').value.trim(),
		reason: $('studentReason').value,
		result: $('studentResult').value
	};
	if (existingStudent && existingStudent.createdAt) data.createdAt = existingStudent.createdAt;
	try {
		await saveRemoteStudent(data);
		students = isEditing
			? students.map(item => item.id === editingId ? { ...item, ...data } : item)
			: [...students, data];
		save();
		closeModal();
		renderRecords();
		if (currentView === 'stats') renderStats();
		toast(isEditing ? 'Cadastro atualizado' : 'Cadastro salvo com sucesso');
	} catch (error) {
		console.error('Erro ao salvar cadastro no Firestore:', error);
		toast('Não foi possível salvar o cadastro no Firebase');
	}
};
document.querySelectorAll('[data-sort]').forEach(button => button.onclick = () => { const key = button.dataset.sort; sortDirection = sortKey === key ? sortDirection * -1 : -1; sortKey = key; renderRecords(); });['searchInput', 'reasonFilter', 'resultFilter'].forEach(id => $(id).oninput = renderRecords); document.querySelectorAll('.nav button').forEach(btn => btn.onclick = () => setView(btn.dataset.view)); $('menuBtn').onclick = () => $('sidebar').classList.toggle('open'); $('yearFilter').onchange = renderStats; $('monthFilter').onchange = renderStats;
populateYearFilter(); $('todayLabel').textContent = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()); lucide.createIcons();
