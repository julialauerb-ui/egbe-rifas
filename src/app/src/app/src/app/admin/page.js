'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const C = {
  primary: '#c61c0c', dark: '#371b1b', gold: '#f9ac33', goldLight: '#fdf3e0', goldDark: '#b87a0a',
  red50: '#fdf1f0', red100: '#f9ccc9', text: '#1a0a0a', textMuted: '#7a4a4a',
  bg: '#fff', bgSoft: '#faf6f6', border: 'rgba(55,27,27,0.12)',
  success: '#2d7a3a', successBg: '#eaf5ec', pending: '#b87a0a', pendingBg: '#fdf3e0',
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem', ...style }}>{children}</div>
}

function Btn({ children, onClick, variant = 'primary', small, style = {} }) {
  const s = {
    primary: { background: C.primary, color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: C.primary, border: `1px solid ${C.primary}` },
    ghost: { background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}` },
  }[variant]
  return <button onClick={onClick} style={{ ...s, padding: small ? '6px 14px' : '9px 20px', borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 500, cursor: 'pointer', ...style }}>{children}</button>
}

function Badge({ status }) {
  const ok = status === 'confirmado'
  return <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: ok ? C.successBg : C.pendingBg, color: ok ? C.success : C.pending }}>{ok ? 'Confirmado' : 'Pendente'}</span>
}

const NAV = ['Rifas', 'Compradores', 'Inteligência', 'Configurações']

export default function Admin() {
  const [page, setPage] = useState('rifas')
  const [rifas, setRifas] = useState([])
  const [compradores, setCompradores] = useState([])
  const [mediuns, setMediuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [r, c, m] = await Promise.all([
      supabase.from('rifas').select('*').order('created_at', { ascending: false }),
      supabase.from('compradores').select('*').order('created_at', { ascending: false }),
      supabase.from('mediuns').select('*').order('nome'),
    ])
    if (r.data) setRifas(r.data)
    if (c.data) setCompradores(c.data)
    if (m.data) setMediuns(m.data)
    setLoading(false)
  }

  async function confirmarPagamento(id) {
    await supabase.from('compradores').update({ status: 'confirmado', data_pagamento: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  async function toggleRifa(id, ativa) {
    await supabase.from('rifas').update({ ativa: !ativa }).eq('id', id)
    loadData()
  }

  const navKey = (n) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ background: C.dark, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 500, fontSize: 15, color: '#fff' }}>Egbe em Movimento</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Gestão de Rifas</div>
      </div>
      <div style={{ background: C.primary, padding: '0 20px', display: 'flex', gap: 2 }}>
        {NAV.map(n => {
          const key = navKey(n)
          const active = page === key || (page === 'nova-rifa' && key === 'rifas')
          return <button key={n} onClick={() => setPage(key)} style={{ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.65)', padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400, borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent' }}>{n}</button>
        })}
      </div>

      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Carregando...</div>}

        {!loading && page === 'rifas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: C.dark }}>Rifas</h2>
              <Btn onClick={() => setPage('nova-rifa')}>+ Nova Rifa</Btn>
            </div>
            {rifas.length === 0 && <Card><div style={{ textAlign: 'center', padding: 30, color: C.textMuted }}>Nenhuma rifa criada ainda.</div></Card>}
            {rifas.map(r => {
              const vendidos = compradores.filter(c => c.rifa_id === r.id && c.status === 'confirmado').reduce((a, c) => a + (c.qtd || 0), 0)
              const pct = Math.round(vendidos / r.qtd_numeros * 100) || 0
              return (
                <Card key={r.id} style={{ borderLeft: `4px solid ${C.primary}`, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 15, color: C.dark }}>{r.titulo}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: r.ativa ? C.gold : C.border, color: r.ativa ? C.dark : C.textMuted, fontWeight: 500 }}>{r.ativa ? 'Ativa' : 'Inativa'}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.textMuted }}>{r.qtd_numeros?.toLocaleString()} números · R$ {Number(r.valor_num).toFixed(2)}/nº · {r.qtd_mediuns} médiuns</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn small variant="ghost" onClick={() => toggleRifa(r.id, r.ativa)}>{r.ativa ? 'Desativar' : 'Ativar'}</Btn>
                      <Btn small variant="ghost" onClick={() => window.open(`/rifa/${r.id}`, '_blank')}>Ver página</Btn>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
                      <span>{vendidos} confirmados</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: C.red50, borderRadius: 4 }}>
                      <div style={{ height: 8, background: C.primary, borderRadius: 4, width: `${pct}%` }} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && page === 'nova-rifa' && (
          <NovaRifa mediuns={mediuns} onSave={() => { loadData(); setPage('rifas') }} onCancel={() => setPage('rifas')} />
        )}

        {!loading && page === 'compradores' && (
          <Compradores compradores={compradores} rifas={rifas} onConfirmar={confirmarPagamento} />
        )}

        {!loading && page === 'inteligencia' && (
          <Inteligencia compradores={compradores} rifas={rifas} mediuns={mediuns} />
        )}

        {!loading && page === 'configuracoes' && (
          <Configuracoes mediuns={mediuns} onUpdate={loadData} />
        )}
      </div>
    </div>
  )
}

function NovaRifa({ mediuns, onSave, onCancel }) {
  const C = { primary: '#c61c0c', dark: '#371b1b', gold: '#f9ac33', goldLight: '#fdf3e0', goldDark: '#b87a0a', bg: '#fff', bgSoft: '#faf6f6', border: 'rgba(55,27,27,0.12)', textMuted: '#7a4a4a', text: '#1a0a0a' }
  const [form, setForm] = useState({ titulo: '', descricao: '', qtd_numeros: '', valor_num: '', qtd_mediuns: '', pix: '', inicio: '', fim: '', regras: '', ativa: true })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const meta = form.qtd_numeros && form.qtd_mediuns ? Math.round(Number(form.qtd_numeros) / Number(form.qtd_mediuns)) : 0

  async function salvar() {
    if (!form.titulo || !form.qtd_numeros || !form.valor_num) return alert('Preencha título, quantidade e valor.')
    const { error } = await supabase.from('rifas').insert([{ ...form, qtd_numeros: Number(form.qtd_numeros), valor_num: Number(form.valor_num), qtd_mediuns: Number(form.qtd_mediuns) }])
    if (error) return alert('Erro ao salvar: ' + error.message)
    onSave()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 13 }}>← Voltar</button>
        <h2 style={{ margin: 0, fontSize: 18, color: C.dark }}>Nova Rifa</h2>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 500, marginBottom: 12, color: C.dark, fontSize: 14 }}>Informações gerais</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <input placeholder="Título da Rifa *" value={form.titulo} onChange={e => f('titulo', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14 }} />
            <textarea placeholder="Descrição" rows={3} value={form.descricao} onChange={e => f('descricao', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
            <textarea placeholder="Regras da rifa" rows={3} value={form.regras} onChange={e => f('regras', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 500, marginBottom: 12, color: C.dark, fontSize: 14 }}>Números e valor</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Qtd. de números *</label>
              <input type="number" placeholder="3000" value={form.qtd_numeros} onChange={e => f('qtd_numeros', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Valor por número (R$) *</label>
              <input type="number" placeholder="5.00" value={form.valor_num} onChange={e => f('valor_num', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Qtd. de médiuns</label>
              <input type="number" placeholder="60" value={form.qtd_mediuns} onChange={e => f('qtd_mediuns', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} /></div>
            <div style={{ background: C.goldLight, borderRadius: 8, padding: '9px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, color: C.goldDark }}>Meta por médium</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: C.goldDark }}>{meta} nºs</div>
            </div>
          </div>
        </div>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 500, marginBottom: 12, color: C.dark, fontSize: 14 }}>Pagamento & período</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <input placeholder="Chave Pix" value={form.pix} onChange={e => f('pix', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Data início</label>
                <input type="date" value={form.inicio} onChange={e => f('inicio', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Data fim</label>
                <input type="date" value={form.fim} onChange={e => f('fim', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, padding: '9px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} style={{ background: C.primary, color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Salvar Rifa</button>
        </div>
      </div>
    </div>
  )
}

function Compradores({ compradores, rifas, onConfirmar }) {
  const C = { primary: '#c61c0c', dark: '#371b1b', gold: '#f9ac33', bg: '#fff', bgSoft: '#faf6f6', border: 'rgba(55,27,27,0.12)', textMuted: '#7a4a4a', success: '#2d7a3a', successBg: '#eaf5ec', pending: '#b87a0a', pendingBg: '#fdf3e0' }
  const [filtro, setFiltro] = useState('todos')
  const [rifaFiltro, setRifaFiltro] = useState('todas')
  const filtered = compradores.filter(c => (filtro === 'todos' || c.status === filtro) && (rifaFiltro === 'todas' || c.rifa_id === rifaFiltro))
  const total = filtered.reduce((a, c) => a + (c.qtd || 0), 0)
  const confirmados = filtered.filter(c => c.status === 'confirmado').reduce((a, c) => a + (c.qtd || 0), 0)

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 18, color: C.dark }}>Compradores</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['Total números', total], ['Confirmados', confirmados], ['Pendentes', total - confirmados]].map(([l, v]) => (
          <div key={l} style={{ background: C.bgSoft, borderRadius: 8, padding: '1rem', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={rifaFiltro} onChange={e => setRifaFiltro(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.bg }}>
          <option value="todas">Todas as rifas</option>
          {rifas.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
        </select>
        {['todos', 'confirmado', 'pendente'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${filtro === f ? C.primary : C.border}`, background: filtro === f ? C.primary : 'transparent', color: filtro === f ? '#fff' : C.textMuted }}>
            {f === 'todos' ? 'Todos' : f === 'confirmado' ? 'Confirmados' : 'Pendentes'}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.length === 0 && <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '2rem', textAlign: 'center', color: C.textMuted }}>Nenhum comprador ainda.</div>}
        {filtered.map(c => (
          <div key={c.id} style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, fontSize: 15, color: C.dark }}>{c.nome}</span>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: c.status === 'confirmado' ? C.successBg : C.pendingBg, color: c.status === 'confirmado' ? C.success : C.pending }}>{c.status === 'confirmado' ? 'Confirmado' : 'Pendente'}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>📱 {c.whatsapp} · ✉ {c.email} · 👤 {c.indicador}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}><span style={{ fontWeight: 500 }}>{c.qtd} números</span> · R$ {Number(c.valor_total).toFixed(2)}</div>
                {c.numeros && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Números: {c.numeros}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {c.status === 'pendente' && <button onClick={() => onConfirmar(c.id)} style={{ background: C.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Confirmar pagamento</button>}
                <a href={`https://wa.me/55${c.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>WhatsApp</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Inteligencia({ compradores, rifas, mediuns }) {
  const C = { primary: '#c61c0c', dark: '#371b1b', gold: '#f9ac33', goldLight: '#fdf3e0', goldDark: '#b87a0a', red50: '#fdf1f0', red100: '#f9ccc9', bg: '#fff', bgSoft: '#faf6f6', border: 'rgba(55,27,27,0.12)', textMuted: '#7a4a4a' }
  const [rankTab, setRankTab] = useState('numeros')
  const [rifaSel, setRifaSel] = useState('todas')

  const filtrados = rifaSel === 'todas' ? compradores : compradores.filter(c => c.rifa_id === rifaSel)
  const confirmados = filtrados.filter(c => c.status === 'confirmado')
  const totalVendidos = confirmados.reduce((a, c) => a + (c.qtd || 0), 0)
  const totalPendente = filtrados.filter(c => c.status === 'pendente').reduce((a, c) => a + (c.qtd || 0), 0)

  const rankNumeros = mediuns.map(m => ({
    nome: m.nome,
    numeros: confirmados.filter(c => c.indicador === m.nome).reduce((a, c) => a + (c.qtd || 0), 0),
    pessoas: new Set(confirmados.filter(c => c.indicador === m.nome).map(c => c.email)).size,
  })).sort((a, b) => b.numeros - a.numeros).filter(m => m.numeros > 0)

  const rankPessoas = mediuns.map(m => ({
    nome: m.nome,
    pessoas: new Set(filtrados.filter(c => c.indicador === m.nome).map(c => c.email)).size,
    numeros: filtrados.filter(c => c.indicador === m.nome).reduce((a, c) => a + (c.qtd || 0), 0),
  })).sort((a, b) => b.pessoas - a.pessoas).filter(m => m.pessoas > 0)

  const currentRank = rankTab === 'numeros' ? rankNumeros : rankPessoas

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 18, color: C.dark }}>Inteligência de Dados</h2>
      <select value={rifaSel} onChange={e => setRifaSel(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.bg, marginBottom: 16, width: '100%' }}>
        <option value="todas">Todas as rifas</option>
        {rifas.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['Confirmados', totalVendidos, C.primary], ['Pendentes', totalPendente, C.goldDark], ['Receita (R$)', `R$ ${(totalVendidos * (rifas.find(r => r.id === rifaSel)?.valor_num || 0)).toLocaleString('pt-BR')}`, C.dark]].map(([l, v, color]) => (
          <div key={l} style={{ background: C.bgSoft, borderRadius: 8, padding: '1rem', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
        <div style={{ fontWeight: 500, marginBottom: 12, color: C.dark, fontSize: 14 }}>Ranking dos médiuns</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['numeros', 'Mais números vendidos'], ['pessoas', 'Mais compradores únicos']].map(([id, label]) => (
            <button key={id} onClick={() => setRankTab(id)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${rankTab === id ? C.primary : C.border}`, background: rankTab === id ? C.primary : 'transparent', color: rankTab === id ? '#fff' : C.textMuted }}>
              {label}
            </button>
          ))}
        </div>
        {currentRank.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: C.textMuted }}>Sem dados ainda.</div>}
        {currentRank.map((m, i) => (
          <div key={m.nome} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < currentRank.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: i === 0 ? C.gold : C.bgSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13, color: i === 0 ? C.dark : C.textMuted }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: C.dark }}>{m.nome}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{rankTab === 'numeros' ? `${m.pessoas} comprador(es) único(s)` : `${m.numeros} números vendidos`}</div>
            </div>
            <div style={{ fontWeight: 500, fontSize: 16, color: C.primary }}>{rankTab === 'numeros' ? `${m.numeros} nºs` : `${m.pessoas} pessoa(s)`}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Configuracoes({ mediuns, onUpdate }) {
  const C = { primary: '#c61c0c', dark: '#371b1b', gold: '#f9ac33', goldLight: '#fdf3e0', goldDark: '#b87a0a', bg: '#fff', bgSoft: '#faf6f6', border: 'rgba(55,27,27,0.12)', textMuted: '#7a4a4a', text: '#1a0a0a' }
  const [novoMedium, setNovoMedium] = useState('')
  const [msg, setMsg] = useState('Olá {nome}! Pagamento confirmado para {rifa}. Seus números: {numeros}. Boa sorte! 🙏')

  async function adicionarMedium() {
    if (!novoMedium.trim()) return
    await supabase.from('mediuns').insert([{ nome: novoMedium.trim() }])
    setNovoMedium('')
    onUpdate()
  }

  async function removerMedium(id) {
    await supabase.from('mediuns').delete().eq('id', id)
    onUpdate()
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 18, color: C.dark }}>Configurações</h2>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 500, marginBottom: 12, color: C.dark, fontSize: 14 }}>Mensagem automática WhatsApp</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, background: C.goldLight, borderRadius: 8, padding: '8px 12px' }}>
            Variáveis: {'{nome}'} · {'{rifa}'} · {'{numeros}'} · {'{valor}'}
          </div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ marginTop: 8, background: C.bgSoft, borderRadius: 8, padding: 12, fontSize: 13, borderLeft: `3px solid ${C.primary}` }}>
            {msg.replace('{nome}', 'Maria').replace('{rifa}', 'Rifa Maio').replace('{numeros}', '0012, 0045').replace('{valor}', 'R$ 25,00')}
          </div>
        </div>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 500, marginBottom: 12, color: C.dark, fontSize: 14 }}>Médiuns ({mediuns.length})</div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            {mediuns.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.bgSoft, borderRadius: 8, fontSize: 13 }}>
                <span>{m.nome}</span>
                <button onClick={() => removerMedium(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 18 }}>×</button>
              </div>
            ))}
            {mediuns.length === 0 && <div style={{ color: C.textMuted, fontSize: 13, padding: 8 }}>Nenhum médium cadastrado.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Nome completo" value={novoMedium} onChange={e => setNovoMedium(e.target.value)} onKeyDown={e => e.key === 'Enter' && adicionarMedium()} style={{ flex: 1, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }} />
            <button onClick={adicionarMedium} style={{ background: C.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
