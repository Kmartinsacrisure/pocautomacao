async function carregarPerfil() {
  const container = document.getElementById('conteudo-perfil');
  try {
    const { usuario } = await Api.perfil();
    container.innerHTML = `
      <div class="profile-header">
        <div class="avatar-lg">${Auth.iniciais(usuario.nome)}</div>
        <div>
          <h2 style="font-size:18px;">${usuario.nome}</h2>
          <p style="color:var(--text-muted); font-size:13px;">${usuario.email}</p>
        </div>
      </div>
      <div class="info-list">
        <div class="row"><span class="k">ID do usuário</span><span class="v mono">#${String(usuario.id).padStart(3, '0')}</span></div>
        <div class="row"><span class="k">Membro desde</span><span class="v">${formatarData(usuario.criado_em)}</span></div>
      </div>
      <div class="section-title">Sessão</div>
      <button class="btn btn-danger" onclick="Auth.logout()">Sair da conta</button>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:var(--prio-alta)">${err.message}</p>`;
  }
}
