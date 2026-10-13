import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, BarChart3, BriefcaseBusiness, Building2, CheckCircle2, CircleAlert, Download, Search, Users, UserRoundCheck, UserRoundX, CalendarClock, RefreshCw, Sparkles, X, Printer, Eye, UserPlus, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, FileUp, FileDown } from 'lucide-react';
import { employeeApi, apiError } from './api.js';

const empty = { fullName: '', email: '', department: 'Engineering', jobTitle: '', status: 'ACTIVE' };
const statusLabel = (status) => ({ ACTIVE: 'Active', INACTIVE: 'Inactive', ON_LEAVE: 'On leave' }[status] || status || 'Unknown');
const statusTone = (status) => ({ ACTIVE: 'active', INACTIVE: 'inactive', ON_LEAVE: 'on_leave' }[status] || 'unknown');
const pct = (part, total) => total ? Math.round(part / total * 100) : 0;
const initials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('directory');
  const [profile, setProfile] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await employeeApi.list();
      setEmployees(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) { setError(apiError(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [employees]);
  const stats = useMemo(() => ({
    total: employees.length, active: employees.filter((e) => e.status === 'ACTIVE').length,
    inactive: employees.filter((e) => e.status === 'INACTIVE').length,
    onLeave: employees.filter((e) => e.status === 'ON_LEAVE').length,
    departmentCount: departments.length, activeRate: pct(employees.filter((e) => e.status === 'ACTIVE').length, employees.length)
  }), [employees, departments]);
  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = employees.filter((e) => {
      const matchesSearch = !term || [e.fullName, e.email, e.department, e.jobTitle].some((v) => String(v || '').toLowerCase().includes(term));
      return matchesSearch && (departmentFilter === 'ALL' || e.department === departmentFilter) && (statusFilter === 'ALL' || e.status === statusFilter);
    });
    const getValue = (e) => sortBy === 'name' ? e.fullName : sortBy === 'department' ? e.department : sortBy === 'status' ? e.status : e.jobTitle;
    return [...rows].sort((a, b) => String(getValue(a) || '').localeCompare(String(getValue(b) || '')) * (sortDirection === 'asc' ? 1 : -1));
  }, [employees, search, departmentFilter, statusFilter, sortBy, sortDirection]);
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  useEffect(() => { setPage(1); }, [search, departmentFilter, statusFilter, pageSize]);
  useEffect(() => { setPage((current) => Math.min(current, pageCount)); }, [pageCount]);
  const pageEmployees = useMemo(() => filteredEmployees.slice((page - 1) * pageSize, page * pageSize), [filteredEmployees, page, pageSize]);
  const visibleSelected = pageEmployees.length > 0 && pageEmployees.every((e) => selectedIds.includes(e.id));
  const departmentStats = useMemo(() => departments.map((department) => ({
    department, count: employees.filter((e) => e.department === department).length,
    active: employees.filter((e) => e.department === department && e.status === 'ACTIVE').length,
    inactive: employees.filter((e) => e.department === department && e.status === 'INACTIVE').length,
    onLeave: employees.filter((e) => e.department === department && e.status === 'ON_LEAVE').length
  })).sort((a, b) => b.count - a.count || a.department.localeCompare(b.department)), [employees, departments]);
  const dataQuality = useMemo(() => {
    const emailCounts = employees.reduce((acc, e) => { const key = String(e.email || '').trim().toLowerCase(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    return { missingTitle: employees.filter((e) => !String(e.jobTitle || '').trim()).length, missingDepartment: employees.filter((e) => !String(e.department || '').trim()).length, duplicateEmails: Object.values(emailCounts).reduce((sum, count) => sum + Math.max(0, count - 1), 0) };
  }, [employees]);
  const insights = useMemo(() => {
    if (!employees.length) return ['Add employee records to unlock workforce insights.'];
    const largest = departmentStats[0]; const items = [];
    if (largest) items.push(`${largest.department} is the largest team with ${largest.count} ${largest.count === 1 ? 'employee' : 'employees'} (${pct(largest.count, employees.length)}% of the workforce).`);
    if (stats.onLeave) items.push(`${stats.onLeave} ${stats.onLeave === 1 ? 'employee is' : 'employees are'} currently marked as on leave.`);
    if (stats.inactive) items.push(`${stats.inactive} inactive record${stats.inactive === 1 ? '' : 's'} may need a status review.`);
    if (dataQuality.duplicateEmails || dataQuality.missingTitle || dataQuality.missingDepartment) items.push('Review the data quality panel for records that may need attention.');
    if (!items.length) items.push('All listed employees are active and no basic data quality issues were detected.');
    return items;
  }, [employees, departmentStats, stats, dataQuality]);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function toggleSelected(id) { setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  function togglePageSelection() { setSelectedIds((current) => visibleSelected ? current.filter((id) => !pageEmployees.some((e) => e.id === id)) : [...new Set([...current, ...pageEmployees.map((e) => e.id)])]); }
  function clearSelection() { setSelectedIds([]); }
  async function bulkDelete() {
    const rows = employees.filter((e) => selectedIds.includes(e.id));
    if (!rows.length || !window.confirm(`Delete ${rows.length} selected employee record${rows.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      for (const row of rows) await employeeApi.remove(row.id);
      setNotice(`${rows.length} employee record${rows.length === 1 ? '' : 's'} deleted successfully.`); clearSelection(); await load(true);
    } catch (err) { setError('Some records may not have been deleted. ' + apiError(err)); await load(true); }
    finally { setBusy(false); }
  }
  function exportSelected() { downloadCsv(employees.filter((e) => selectedIds.includes(e.id)), 'nexora-selected-employees-' + new Date().toISOString().slice(0, 10) + '.csv'); }
  function downloadTemplate() { downloadCsv([], 'nexora-employee-import-template.csv', ['fullName', 'email', 'department', 'jobTitle', 'status']); setNotice('CSV template downloaded. Fill in the rows and import the completed file.'); }
  async function importCsv(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('The CSV must contain a header row and at least one employee row.');
      const headers = rows[0].map((value) => String(value).trim().toLowerCase().replace(/[ _-]/g, ''));
      const index = (names) => headers.findIndex((h) => names.includes(h));
      const columns = { fullName: index(['fullname','name','employeename']), email: index(['email','emailaddress']), department: index(['department','team']), jobTitle: index(['jobtitle','title','position']), status: index(['status','employmentstatus']) };
      for (const key of ['fullName','email','department','jobTitle']) if (columns[key] < 0) throw new Error('Missing required CSV column: ' + key + '. Download the template for the correct format.');
      const records = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row, i) => {
        const get = (key) => String(row[columns[key]] ?? '').trim();
        const statusRaw = columns.status >= 0 ? String(row[columns.status] ?? '').trim().toUpperCase().replace(/[ -]/g, '_') : 'ACTIVE';
        const status = ({ ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', ON_LEAVE: 'ON_LEAVE', 'ON LEAVE': 'ON_LEAVE' })[statusRaw] || (statusRaw ? null : 'ACTIVE');
        const record = { fullName: get('fullName'), email: get('email'), department: get('department'), jobTitle: get('jobTitle'), status: status || 'ACTIVE' };
        if (!record.fullName || !record.email || !record.department || !record.jobTitle || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) throw new Error('Invalid required data or email in CSV row ' + (i + 2) + '.');
        if (!status) throw new Error('Invalid status in CSV row ' + (i + 2) + '. Use ACTIVE, INACTIVE, or ON_LEAVE.');
        return record;
      });
      if (!records.length) throw new Error('No employee rows were found in the CSV.');
      let created = 0; const failures = [];
      for (let i = 0; i < records.length; i++) {
        try { await employeeApi.create(records[i]); created++; }
        catch (err) { failures.push('row ' + (i + 2) + ': ' + apiError(err)); }
      }
      await load(true);
      if (failures.length) {
        setNotice(created + ' employee record(s) imported; ' + failures.length + ' row(s) failed.');
        setError(failures.slice(0, 3).join(' · ') + (failures.length > 3 ? ' · More errors omitted.' : ''));
      } else setNotice('Successfully imported ' + created + ' employee record(s).');
    } catch (err) { setError(err.message || apiError(err)); }
    finally { setBusy(false); }
  }
  function reset() { setForm(empty); setEditing(null); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (editing) await employeeApi.update(editing, form); else await employeeApi.create(form);
      setNotice(editing ? 'Employee updated successfully.' : 'Employee added successfully.'); reset(); await load(true);
    } catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  }
  async function remove(employee) {
    if (!window.confirm('Delete ' + employee.fullName + '? This cannot be undone.')) return;
    setError(''); setNotice('');
    try { await employeeApi.remove(employee.id); setNotice('Employee deleted.'); await load(true); }
    catch (err) { setError(apiError(err)); }
  }
  function edit(employee) {
    setEditing(employee.id); setForm({ fullName: employee.fullName || '', email: employee.email || '', department: employee.department || '', jobTitle: employee.jobTitle || '', status: employee.status || 'ACTIVE' });
    setView('directory'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function downloadCsv(rows, filename, columns = ['id', 'fullName', 'email', 'department', 'jobTitle', 'status']) {
    const quote = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [columns.join(','), ...rows.map((e) => columns.map((key) => quote(e[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function printReport() { window.print(); }
  function openInsightsSection(sectionId) {
    setView('insights');
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }
  function openAddForm() { setView('directory'); reset(); window.setTimeout(() => document.getElementById('employee-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }
  function exportCsv() { downloadCsv(filteredEmployees, 'nexora-employees-' + new Date().toISOString().slice(0, 10) + '.csv'); }
  function exportInsights() { downloadCsv(departmentStats, 'nexora-workforce-insights-' + new Date().toISOString().slice(0, 10) + '.csv', ['department', 'count', 'active', 'inactive', 'onLeave']); }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">N</span><span>NEXORA<small>WORKFORCE</small></span></div>
      <div className="nav-label">WORKSPACE</div>
      <button className={'nav-item ' + (view === 'directory' ? 'selected' : '')} onClick={() => setView('directory')}><Users size={17} /> Employee directory</button>
      <button className={'nav-item ' + (view === 'insights' ? 'selected' : '')} onClick={() => setView('insights')}><BarChart3 size={17} /> Workforce insights <ArrowRight size={14} className="nav-arrow" /></button>
      <div className="nav-label nav-label-spaced">PEOPLE TOOLS</div>
      <button className="nav-item" onClick={() => openInsightsSection('department-headcount')}><Building2 size={17} /> Department breakdown</button>
      <button className="nav-item" onClick={() => openInsightsSection('data-quality-panel')}><CheckCircle2 size={17} /> Data quality checks</button>
      <button className="nav-item" onClick={exportCsv} disabled={!filteredEmployees.length}><Download size={17} /> Export employee CSV</button>
      <button className="nav-item" onClick={printReport}><Printer size={17} /> Print workforce report</button>
      <div className="sidebar-bottom"><div className="sidebar-foot"><span className="dot"></span> Connected workspace<small>People operations · v2.0</small></div><div className="sidebar-note">People first. Decisions backed by data.</div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">PEOPLE OPERATIONS <span>/</span> {view === 'insights' ? 'ANALYTICS' : 'WORKSPACE'}</div><h1>{view === 'insights' ? 'Workforce insights' : 'Workforce dashboard'}</h1><p>{view === 'insights' ? 'A clear view of team composition, employment status and data quality.' : 'Manage your team and understand your workforce at a glance.'}</p></div><div className="topbar-actions"><span className="live-pill"><span className="dot"></span> Live database</span><button className="btn secondary top-action" onClick={printReport}><Printer size={15} /> Print report</button>{view === 'directory' && <button className="btn primary top-action" onClick={openAddForm}><UserPlus size={15} /> Add employee</button>}<button className="icon-btn" onClick={() => load()} title="Refresh data" aria-label="Refresh data"><RefreshCw size={16} /></button><div className="avatar">NW</div></div></header>
      {error && <div className="alert error" role="alert"><CircleAlert size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
      {notice && <div className="alert success" role="status"><CheckCircle2 size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}
      <section className="stats">
        <div className="stat stat-total"><div className="stat-top"><span>Total employees</span><span className="stat-icon"><Users size={17} /></span></div><strong>{loading ? '—' : stats.total}</strong><small>Records in your directory</small></div>
        <div className="stat stat-active"><div className="stat-top"><span>Active workforce</span><span className="stat-icon"><UserRoundCheck size={17} /></span></div><strong>{loading ? '—' : stats.active}</strong><small>{stats.activeRate}% of all employees</small></div>
        <div className="stat stat-departments"><div className="stat-top"><span>Departments</span><span className="stat-icon"><Building2 size={17} /></span></div><strong>{loading ? '—' : stats.departmentCount}</strong><small>Distinct teams represented</small></div>
        <div className="stat stat-leave"><div className="stat-top"><span>On leave</span><span className="stat-icon"><CalendarClock size={17} /></span></div><strong>{loading ? '—' : stats.onLeave}</strong><small>{pct(stats.onLeave, stats.total)}% of workforce</small></div>
      </section>

      {view === 'insights' ? <div className="insights-page">
        <div className="section-toolbar"><div><span className="section-kicker"><Sparkles size={14} /> WORKFORCE ANALYTICS</span><h2>People, at a glance</h2><p>Calculated from current employee records in your database.</p></div><button className="btn primary" onClick={exportInsights} disabled={!employees.length}><Download size={15} /> Export insights</button></div>
        <section className="insight-card-grid">
          <article className="insight-metric"><span className="metric-icon purple"><Activity size={18} /></span><span className="metric-label">Active rate</span><strong>{stats.activeRate}%</strong><div className="metric-track"><span style={{ width: stats.activeRate + '%' }} /></div><small>{stats.active} active of {stats.total} total</small></article>
          <article className="insight-metric"><span className="metric-icon blue"><BriefcaseBusiness size={18} /></span><span className="metric-label">Average team size</span><strong>{stats.departmentCount ? (stats.total / stats.departmentCount).toFixed(1) : '0.0'}</strong><small>Employees per department</small><div className="metric-foot">Across {stats.departmentCount} {stats.departmentCount === 1 ? 'department' : 'departments'}</div></article>
          <article className="insight-metric"><span className="metric-icon amber"><CalendarClock size={18} /></span><span className="metric-label">On leave</span><strong>{pct(stats.onLeave, stats.total)}%</strong><small>{stats.onLeave} employee{stats.onLeave === 1 ? '' : 's'} currently on leave</small><div className="metric-foot">Based on current status</div></article>
          <article className="insight-metric"><span className="metric-icon green"><Building2 size={18} /></span><span className="metric-label">Largest department</span><strong className="largest-value">{departmentStats[0]?.department || '—'}</strong><small>{departmentStats[0] ? departmentStats[0].count + ' employees' : 'No records yet'}</small><div className="metric-foot">{departmentStats[0] ? pct(departmentStats[0].count, stats.total) + '% of workforce' : 'Add employees to begin'}</div></article>
        </section>
        <section className="insights-grid">
          <article className="panel analytics-panel" id="department-headcount"><div className="panel-head"><div><h2>Department headcount</h2><p>Team size and active employee count</p></div><span className="subtle-tag">LIVE DATA</span></div>
            {departmentStats.length ? <div className="bar-chart">{departmentStats.map((item) => <div className="bar-row" key={item.department}><div className="bar-label"><span>{item.department}</span><b>{item.count} <small>({pct(item.count, stats.total)}%)</small></b></div><div className="bar-track"><div className="bar-fill" style={{ width: (item.count / Math.max(...departmentStats.map((d) => d.count), 1) * 100) + '%' }} /></div><div className="department-active"><span>{item.active} active</span><span>{item.count - item.active} non-active</span></div></div>)}</div> : <EmptyState loading={loading} title="No department data yet" detail="Add employee records to see the distribution." />}
          </article>
          <article className="panel status-panel"><div className="panel-head"><div><h2>Employment status</h2><p>Current workforce breakdown</p></div></div><div className="status-total"><strong>{stats.total}</strong><span>Total employees</span></div>
            {[['ACTIVE','Active',stats.active,'active-legend'],['INACTIVE','Inactive',stats.inactive,'inactive-legend'],['ON_LEAVE','On leave',stats.onLeave,'leave-legend']].map(([key,label,count,legend]) => <div className="status-line" key={key}><span><i className={'legend ' + legend} />{label}</span><b>{count} <small>{pct(count, stats.total)}%</small></b></div>)}
            <div className="status-stack"><span className="stack-active" style={{ width: pct(stats.active, stats.total) + '%' }} /><span className="stack-inactive" style={{ width: pct(stats.inactive, stats.total) + '%' }} /><span className="stack-leave" style={{ width: pct(stats.onLeave, stats.total) + '%' }} /></div><p className="chart-note">Percentages reflect current records, not historical trends.</p>
          </article>
        </section>
        <section className="insights-grid lower-insights">
          <article className="panel"><div className="panel-head"><div><h2>Key takeaways</h2><p>Automatically generated from current workforce data</p></div><span className="takeaway-icon"><Sparkles size={16} /></span></div><div className="takeaway-list">{insights.map((item, i) => <div className="takeaway" key={item}><span>{i + 1}</span><p>{item}</p></div>)}</div></article>
          <article className="panel" id="data-quality-panel"><div className="panel-head"><div><h2>Data quality</h2><p>Quick checks to help keep records reliable</p></div></div>
            <div className="quality-row"><span className="quality-icon"><UserRoundX size={16} /></span><div><b>Missing job titles</b><small>Employees without a job title</small></div><strong className={dataQuality.missingTitle ? 'quality-count warn' : 'quality-count'}>{dataQuality.missingTitle}</strong></div>
            <div className="quality-row"><span className="quality-icon"><Building2 size={16} /></span><div><b>Missing departments</b><small>Employees without a department</small></div><strong className={dataQuality.missingDepartment ? 'quality-count warn' : 'quality-count'}>{dataQuality.missingDepartment}</strong></div>
            <div className="quality-row"><span className="quality-icon"><CircleAlert size={16} /></span><div><b>Duplicate emails</b><small>Repeated email addresses</small></div><strong className={dataQuality.duplicateEmails ? 'quality-count warn' : 'quality-count'}>{dataQuality.duplicateEmails}</strong></div>
            <div className="quality-footer"><CheckCircle2 size={14} /> Checks run on loaded records</div>
          </article>
        </section>
        <div className="analytics-disclaimer"><CircleAlert size={15} /><span>Analytics reflect the current database snapshot. Historical hiring, attrition and growth trends require dated employee events, which are not currently recorded.</span></div>
      </div> : <>
        <section className="insights-grid">
          <div className="panel analytics-panel"><div className="panel-head"><div><h2>Department distribution</h2><p>Employee headcount by department</p></div><button className="text-link" onClick={() => setView('insights')}>View insights <ArrowRight size={14} /></button></div>
            {departmentStats.length ? <div className="bar-chart">{departmentStats.slice(0, 6).map((item) => <div className="bar-row" key={item.department}><div className="bar-label"><span>{item.department}</span><b>{item.count}</b></div><div className="bar-track"><div className="bar-fill" style={{ width: (item.count / Math.max(...departmentStats.map((d) => d.count), 1) * 100) + '%' }} /></div></div>)}</div> : <EmptyState loading={loading} title="No department data yet" detail="Add employees to see department analytics." />}
          </div>
          <div className="panel status-panel"><div className="panel-head"><div><h2>Employment status</h2><p>Current workforce breakdown</p></div><button className="text-link" onClick={() => setView('insights')}>Details <ArrowRight size={14} /></button></div><div className="status-total"><strong>{stats.total}</strong><span>Total employees</span></div>
            <div className="status-line"><span><i className="legend active-legend" />Active</span><b>{stats.active}</b></div><div className="status-line"><span><i className="legend inactive-legend" />Inactive</span><b>{stats.inactive}</b></div><div className="status-line"><span><i className="legend leave-legend" />On leave</span><b>{stats.onLeave}</b></div><div className="status-stack"><span className="stack-active" style={{ width: pct(stats.active, stats.total) + '%' }} /><span className="stack-inactive" style={{ width: pct(stats.inactive, stats.total) + '%' }} /><span className="stack-leave" style={{ width: pct(stats.onLeave, stats.total) + '%' }} /></div>
          </div>
        </section>
        <section className="panel" id="employee-form-panel"><div className="panel-head"><div><h2>{editing ? 'Update employee' : 'Add an employee'}</h2><p>{editing ? 'Edit the employee details below.' : 'Create a workforce record using the form below.'}</p></div>{editing && <button className="btn secondary" onClick={reset}>Cancel edit</button>}</div>
          <form onSubmit={submit} className="employee-form">
            <label>Full name<input name="fullName" value={form.fullName} onChange={change} placeholder="e.g. Priya Sharma" required maxLength="100" /></label><label>Email address<input name="email" type="email" value={form.email} onChange={change} placeholder="priya@company.com" required /></label><label>Department<input name="department" value={form.department} onChange={change} placeholder="e.g. Engineering" required /></label><label>Job title<input name="jobTitle" value={form.jobTitle} onChange={change} placeholder="e.g. Software Engineer" required /></label><label>Status<select name="status" value={form.status} onChange={change}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ON_LEAVE">On leave</option></select></label><div className="form-actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : '+ Add employee'}</button></div>
          </form>
        </section>
        <section className="panel directory"><div className="panel-head directory-head"><div><h2>Team directory</h2><p>Search, filter, sort, import and export employee records.</p></div><div className="directory-head-actions"><button className="btn secondary" onClick={downloadTemplate}><FileDown size={15} /> CSV template</button><button className="btn secondary" onClick={() => document.getElementById('employee-csv-import')?.click()} disabled={busy}><FileUp size={15} /> {busy ? 'Importing…' : 'Import CSV'}</button><input id="employee-csv-import" className="visually-hidden-input" type="file" accept=".csv,text/csv" onChange={importCsv} /><button className="btn export-btn" onClick={exportCsv} disabled={!filteredEmployees.length}><Download size={15} /> Export CSV ({filteredEmployees.length})</button></div></div>
          <div className="directory-tools"><label className="search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, department…" aria-label="Search employees" /></label><label className="filter-control"><span>Department</span><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}><option value="ALL">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></label><label className="filter-control"><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ON_LEAVE">On leave</option></select></label></div>
          <div className="results-line"><span>Showing <b>{filteredEmployees.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredEmployees.length)}</b> of <b>{filteredEmployees.length}</b> matching · <b>{employees.length}</b> total</span><div className="directory-result-actions"><label className="page-size-control">Rows <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label><button className="clear-filters" onClick={() => { setSearch(''); setDepartmentFilter('ALL'); setStatusFilter('ALL'); setSortBy('name'); setSortDirection('asc'); }}>Reset view</button></div></div>
          {selectedIds.length > 0 && <div className="bulk-toolbar"><span><CheckSquare size={15} /> <b>{selectedIds.length}</b> selected</span><div><button className="btn secondary" onClick={exportSelected}><Download size={14} /> Export selected</button><button className="btn danger-btn" onClick={bulkDelete} disabled={busy}><Trash2 size={14} /> Delete selected</button><button className="clear-filters" onClick={clearSelection}>Clear selection</button></div></div>}
          <div className="table-wrap"><table><thead><tr><th className="select-column"><button className="select-all-btn" onClick={togglePageSelection} aria-label={visibleSelected ? 'Deselect current page' : 'Select current page'}>{visibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}</button></th><th><button className="sort-button" onClick={() => { setSortBy('name'); setSortDirection(sortBy === 'name' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>EMPLOYEE ↕</button></th><th><button className="sort-button" onClick={() => { setSortBy('department'); setSortDirection(sortBy === 'department' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>DEPARTMENT ↕</button></th><th><button className="sort-button" onClick={() => { setSortBy('title'); setSortDirection(sortBy === 'title' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>JOB TITLE ↕</button></th><th><button className="sort-button" onClick={() => { setSortBy('status'); setSortDirection(sortBy === 'status' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>STATUS ↕</button></th><th>ACTIONS</th></tr></thead><tbody>
            {pageEmployees.map((e) => <tr key={e.id}><td className="select-column"><button className="select-all-btn" onClick={() => toggleSelected(e.id)} aria-label={(selectedIds.includes(e.id) ? 'Deselect ' : 'Select ') + e.fullName}>{selectedIds.includes(e.id) ? <CheckSquare size={16} /> : <Square size={16} />}</button></td><td><div className="person"><span className="person-avatar">{initials(e.fullName)}</span><span><b>{e.fullName}</b><small>{e.email}</small></span></div></td><td>{e.department}</td><td>{e.jobTitle}</td><td><span className={'status ' + statusTone(e.status)}>{statusLabel(e.status)}</span></td><td><div className="actions"><button className="view-action" onClick={() => setProfile(e)} aria-label={'View ' + e.fullName}><Eye size={14} /> View</button><button onClick={() => edit(e)} aria-label={'Edit ' + e.fullName}>Edit</button><button className="delete" onClick={() => remove(e)} aria-label={'Delete ' + e.fullName}>Delete</button></div></td></tr>)}
            {!filteredEmployees.length && <tr><td colSpan="6" className="empty"><span>▤</span><b>{loading ? 'Loading employee records…' : 'No matching employees'}</b><small>{loading ? 'Connecting to your database.' : 'Change your filters or add a new employee.'}</small></td></tr>}
          </tbody></table></div><div className="pagination"><span>Page <b>{page}</b> of <b>{pageCount}</b></span><div><button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /> Previous</button><button className="pagination-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next <ChevronRight size={15} /></button></div></div><div className="table-foot">Nexora Workforce <span>Employee data is stored in your connected database.</span></div>
        </section>
      </>}
      <footer>© 2026 Nexora Workforce <span>React · Spring Boot · MySQL</span></footer>
    </main>
    {profile && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfile(null); }}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="modal-close" onClick={() => setProfile(null)} aria-label="Close profile"><X size={18} /></button><div className="profile-hero"><span className="profile-avatar">{initials(profile.fullName)}</span><span className={'status ' + statusTone(profile.status)}>{statusLabel(profile.status)}</span><h2 id="profile-title">{profile.fullName}</h2><p>{profile.jobTitle || 'No job title specified'}</p></div><div className="profile-details"><div><small>Email address</small><b>{profile.email || '—'}</b></div><div><small>Department</small><b>{profile.department || '—'}</b></div><div><small>Employee ID</small><b>{profile.id ?? '—'}</b></div></div><div className="profile-actions"><button className="btn secondary" onClick={() => setProfile(null)}>Close</button><button className="btn primary" onClick={() => { setProfile(null); edit(profile); }}>Edit employee</button></div></section></div>}
  </div>;
}
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function EmptyState({ loading, title, detail }) {
  return <div className="analytics-empty"><span className="empty-illustration"><BarChart3 size={24} /></span><b>{loading ? 'Loading analytics…' : title}</b><small>{loading ? 'Fetching the latest workforce records.' : detail}</small></div>;
}