function renderSidebar(paginaAtiva) {
  const usuario = Auth.getUsuario();
  if (!usuario) return '';

  const links = [
    { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>' },
    { id: 'tickets', href: 'tickets.html', label: 'Chamados', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v4l-2 2 2 2v4l-2 2 2 2v4H4v-4l2-2-2-2v-4l2-2-2-2z"/></svg>' },
    { id: 'novo', href: 'ticket-form.html', label: 'Novo Chamado', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' },
    { id: 'perfil', href: 'profile.html', label: 'Meu Perfil', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>' }
  ];

  return `
    <aside class="sidebar">
      <div class="brand"><span class="dot"></span> Help Desk</div>
      <div class="nav-group-label">Navegação</div>
      ${links.map(l => `
        <a class="nav-link ${paginaAtiva === l.id ? 'active' : ''}" href="${l.href}">
          ${l.icon} ${l.label}
        </a>
      `).join('')}
      <div class="sidebar-footer">
        <div class="user-chip" onclick="window.location.href='profile.html'">
          <div class="avatar">${Auth.iniciais(usuario.nome)}</div>
          <div>
            <div class="name">${usuario.nome}</div>
            <div class="role">${usuario.email}</div>
          </div>
        </div>
        <a class="logout-link" href="#" onclick="Auth.logout(); return false;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
          Sair da conta
        </a>
      </div>
    </aside>
  `;
}

function montarLayout(paginaAtiva) {
  Auth.exigirLogin();
  const sidebarEl = document.getElementById('sidebar-slot');
  if (sidebarEl) sidebarEl.outerHTML = renderSidebar(paginaAtiva);
}
