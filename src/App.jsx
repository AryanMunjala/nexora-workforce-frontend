import { useCallback, useEffect, useMemo, useState } from 'react';
import { employeeApi, apiError } from './api.js';

const empty = { fullName: '', email: '', department: 'Engineering', jobTitle: '', status: 'ACTIVE' };
const statusLabel = (status) => ({ ACTIVE: 'Active', INACTIVE: 'Inactive', ON_LEAVE: 'On leave' }[status] || status || 'Unknown');

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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setEmployees(await employeeApi.list());
      setError('');
    } catch (e) {
      setError(apiError(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [employees]
  );
  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === 'ACTIVE').length,
    inactive: employees.filter((e) => e.status === 'INACTIVE').length,
    onLeave: employees.filter((e) => e.status === 'ON_LEAVE').length,
    departmentCount: departments.length
  }), [employees, departments]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = employees.filter((e) => {
      const matchesSearch = !term || [e.fullName, e.email, e.department, e.jobTitle].some((v) => String(v || '').toLowerCase().includes(term));
      return matchesSearch && (departmentFilter === 'ALL' || e.department === departmentFilter) &&
        (statusFilter === 'ALL' || e.status === statusFilter);
    });
    const getValue = (e) => sortBy === 'name' ? e.fullName : sortBy === 'department' ? e.department : sortBy === 'status' ? e.status : e.jobTitle;
    return rows.sort((a, b) => String(getValue(a) || '').localeCompare(String(getValue(b) || '')) * (sortDirection === 'asc' ? 1 : -1));
  }, [employees, search, departmentFilter, statusFilter, sortBy, sortDirection]);

  const departmentStats = useMemo(() => {
    const counts = departments.map((department) => ({
      department,
      count: employees.filter((e) => e.department === department).length
    }));
    return counts.sort((a, b) => b.count - a.count || a.department.localeCompare(b.department));
  }, [employees, departments]);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function reset() { setForm(empty); setEditing(null); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (editing) await employeeApi.update(editing, form);
      else await employeeApi.create(form);
      setNotice(editing ? 'Employee updated successfully.' : 'Employee added successfully.');
      reset(); await load();
    } catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  }
  async function remove(employee) {
    if (!confirm('Delete ' + employee.fullName + '? This cannot be undone.')) return;
    setError(''); setNotice('');
    try { await employeeApi.remove(employee.id); setNotice('Employee deleted.'); await load(); }
    catch (err) { setError(apiError(err)); }
  }
  function edit(employee) {
    setEditing(employee.id);
    setForm({ fullName: employee.fullName, email: employee.email, department: employee.department, jobTitle: employee.jobTitle, status: employee.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function exportCsv() {
    const columns = ['id', 'fullName', 'email', 'department', 'jobTitle', 'status'];
    const quote = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [columns.join(','), ...filteredEmployees.map((e) => columns.map((key) => quote(e[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexora-employees-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">N</span><span>NEXORA<small>WORKFORCE</small></span></div>
      <div className="nav-label">WORKSPACE</div>
      <div className="nav-item selected">▦ &nbsp; Employee directory</div>
      <div className="nav-item">◷ &nbsp; Workforce insights</div>
      <div className="sidebar-foot"><span className="dot"></span> Workspace overview<small>People operations · v1.1</small></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><span className="eyebrow">PEOPLE OPERATIONS / OVERVIEW</span><h1>Workforce dashboard</h1><p>Manage your team and understand your workforce at a glance.</p></div>
        <div className="topbar-actions"><span className="live-pill"><span className="dot"></span> Live database</span><div className="avatar">NW</div></div>
      </header>

      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert success" role="status">{notice}</div>}

      <section className="stats">
        <div className="stat stat-total"><span>Total employees</span><strong>{stats.total}</strong><small>People in your directory</small><span className="stat-icon">♙</span></div>
        <div className="stat stat-active"><span>Active employees</span><strong>{stats.active}</strong><small>{stats.total ? Math.round(stats.active / stats.total * 100) : 0}% of workforce</small><span className="stat-icon">✓</span></div>
        <div className="stat stat-departments"><span>Departments</span><strong>{stats.departmentCount}</strong><small>Across the organization</small><span className="stat-icon">▦</span></div>
        <div className="stat stat-leave"><span>On leave</span><strong>{stats.onLeave}</strong><small>Currently marked on leave</small><span className="stat-icon">◷</span></div>
      </section>

      <section className="insights-grid">
        <div className="panel analytics-panel">
          <div className="panel-head"><div><h2>Department distribution</h2><p>Employee headcount by department</p></div><span className="subtle-tag">LIVE DATA</span></div>
          {departmentStats.length ? <div className="bar-chart">{departmentStats.slice(0, 7).map((item) => <div className="bar-row" key={item.department}><div className="bar-label"><span>{item.department}</span><b>{item.count}</b></div><div className="bar-track"><div className="bar-fill" style={{ width: (item.count / Math.max(...departmentStats.map((d) => d.count), 1) * 100) + '%' }} /></div></div>)}</div> : <p className="chart-empty">Add employees to see department analytics.</p>}
          {departmentStats.length > 7 && <p className="chart-note">Showing the 7 largest departments.</p>}
        </div>
        <div className="panel status-panel">
          <div className="panel-head"><div><h2>Employment status</h2><p>Current workforce breakdown</p></div></div>
          <div className="status-total"><strong>{stats.total}</strong><span>Total records</span></div>
          <div className="status-line"><span><i className="legend active-legend" />Active</span><b>{stats.active}</b></div>
          <div className="status-line"><span><i className="legend inactive-legend" />Inactive</span><b>{stats.inactive}</b></div>
          <div className="status-line"><span><i className="legend leave-legend" />On leave</span><b>{stats.onLeave}</b></div>
          <div className="status-stack"><span className="stack-active" style={{ width: (stats.total ? stats.active / stats.total * 100 : 0) + '%' }} /><span className="stack-inactive" style={{ width: (stats.total ? stats.inactive / stats.total * 100 : 0) + '%' }} /><span className="stack-leave" style={{ width: (stats.total ? stats.onLeave / stats.total * 100 : 0) + '%' }} /></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><div><h2>{editing ? 'Update employee' : 'Add an employee'}</h2><p>{editing ? 'Edit the employee details below.' : 'Create a workforce record using the form below.'}</p></div>{editing && <button className="btn secondary" onClick={reset}>Cancel edit</button>}</div>
        <form onSubmit={submit} className="employee-form">
          <label>Full name<input name="fullName" value={form.fullName} onChange={change} placeholder="e.g. Priya Sharma" required maxLength="100" /></label>
          <label>Email address<input name="email" type="email" value={form.email} onChange={change} placeholder="priya@company.com" required /></label>
          <label>Department<input name="department" value={form.department} onChange={change} placeholder="e.g. Engineering" required /></label>
          <label>Job title<input name="jobTitle" value={form.jobTitle} onChange={change} placeholder="e.g. Software Engineer" required /></label>
          <label>Status<select name="status" value={form.status} onChange={change}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ON_LEAVE">On leave</option></select></label>
          <div className="form-actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : '+ Add employee'}</button></div>
        </form>
      </section>

      <section className="panel directory">
        <div className="panel-head directory-head"><div><h2>Team directory</h2><p>Search, filter, sort and export employee records.</p></div><button className="btn export-btn" onClick={exportCsv} disabled={!filteredEmployees.length}>↓ &nbsp; Export CSV ({filteredEmployees.length})</button></div>
        <div className="directory-tools">
          <label className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, department…" aria-label="Search employees" /></label>
          <label className="filter-control"><span>Department</span><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}><option value="ALL">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          <label className="filter-control"><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ON_LEAVE">On leave</option></select></label>
        </div>
        <div className="results-line">Showing <b>{filteredEmployees.length}</b> of <b>{employees.length}</b> employees</div>
        <div className="table-wrap"><table><thead><tr>
          <th><button className="sort-button" onClick={() => { setSortBy('name'); setSortDirection(sortBy === 'name' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>EMPLOYEE ↕</button></th>
          <th><button className="sort-button" onClick={() => { setSortBy('department'); setSortDirection(sortBy === 'department' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>DEPARTMENT ↕</button></th>
          <th><button className="sort-button" onClick={() => { setSortBy('title'); setSortDirection(sortBy === 'title' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>JOB TITLE ↕</button></th>
          <th><button className="sort-button" onClick={() => { setSortBy('status'); setSortDirection(sortBy === 'status' && sortDirection === 'asc' ? 'desc' : 'asc'); }}>STATUS ↕</button></th><th>ACTIONS</th>
        </tr></thead><tbody>
          {filteredEmployees.map((e) => <tr key={e.id}><td><div className="person"><span className="person-avatar">{(e.fullName || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}</span><span><b>{e.fullName}</b><small>{e.email}</small></span></div></td><td>{e.department}</td><td>{e.jobTitle}</td><td><span className={'status ' + String(e.status || '').toLowerCase()}>{statusLabel(e.status)}</span></td><td><div className="actions"><button onClick={() => edit(e)} aria-label={'Edit ' + e.fullName}>Edit</button><button className="delete" onClick={() => remove(e)} aria-label={'Delete ' + e.fullName}>Delete</button></div></td></tr>)}
          {!filteredEmployees.length && <tr><td colSpan="5" className="empty"><span>▤</span><b>No matching employees</b><small>Change your filters or add a new employee.</small></td></tr>}
        </tbody></table></div>
        <div className="table-foot">Nexora Workforce <span>Employee data is stored in your connected database.</span></div>
      </section>
      <footer>© 2026 Nexora Workforce <span>React · Spring Boot · MySQL</span></footer>
    </main>
  </div>;
}
