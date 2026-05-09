'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const C = {
  primary: '#c61c0c', dark: '#371b1b', gold: '#f9ac33', goldLight: '#fdf3e0', goldDark: '#b87a0a',
  bg: '#fff', bgSoft: '#faf6f6', border: 'rgba(55,27,27,0.12)', textMuted: '#7a4a4a', text: '#1a0a0a',
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem', ...style }}>{children}</div>
}

export default function PaginaRifa({ params }) {
  const [rifa, setRifa] = useState(null)
  const [mediuns, setMediuns] = useState([])
  const [step, setStep] = useState('ver')
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', indicador: '', qtd: 1 })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const total = form.qtd * (rifa?.valor_num || 0)

  useEffect(() => {
    async function load() {
      const [r, m] = await Promise.all([
        supabase.from('rifas').select('*').eq('id', params.id).single(),
        supabase.from('mediuns').select('*').order('nome'),
      ])
      if (r.data) setRifa(r.data)
      if (m.data) setMediuns(m.data)
      setLoading(false)
    }
    load()
  }, [params.id])

  async function comprar() {
    if (!form.nome || !form.whatsapp || !form.email || !form.indicador) return alert('Preencha todos os campos.')
    setSalvando(true)
    const numeros = Array.from({ length: form.qtd }, (_, i) => {
      const base = Math.floor(Math.random() * rifa.qtd_numeros)
      return String(base).padStart(4, '0')
    }).join(', ')
    const { error } = await supabase.from('compradores').insert([{
      rifa_id: rifa.id, nome: form.nome, whatsapp: form.whatsapp,
      email: form.email, indicador: form.indicador, qtd: form.qtd,
      valor_total: total, numeros, status: 'pendente',
    }])
    setSalvando(false)
    if (error) return alert('Erro ao registrar. Tente novamente.')
    setStep('pix')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>Carregando...</div>
  if (!rifa) return <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>Rifa não encontrada.</div>
  if (!rifa.ativa) return <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>Esta rifa não está disponível no momento.</div>

  if (step === 'ver') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: C.dark, borderRadius: 12, padding: 2, marginBottom: 16 }}>
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.dark})`, borderRadius: 10, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', marginBottom: 8 }}>{rifa.titulo}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>{rifa.descricao}</div>
          <div style={{ background: C.gold, display: 'inline-block', borderRadius: 20, padding: '8px 28px', fontWeight: 500, fontSize: 18, color: C.dark }}>R$ {Number(rifa.valor_num).toFixed(2)} / número</div>
        </div>
      </div>
      {rifa.regras && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, color: C.dark, marginBottom: 6, fontSize: 14 }}>Regras</div>
          <div style={{ fontSize: 13, color: C.textMuted, whiteSpace: 'pre-line' }}>{rifa.regras}</div>
        </Card>
      )}
      <button onClick={() => setStep('form')} style={{ width: '100%', padding: 14, background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>🎟 Comprar número</button>
    </div>
  )

  if (step === 'form') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <button onClick={() => setStep('ver')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 13, marginBottom: 12 }}>← Voltar</button>
      <Card>
        <div style={{ fontWeight: 500, color: C.dark, marginBottom: 14, fontSize: 15 }}>Seus dados</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <input placeholder="Nome completo *" value={form.nome} onChange={e => f('nome', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14 }} />
          <input placeholder="WhatsApp *" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14 }} />
          <input placeholder="E-mail *" value={form.email} onChange={e => f('email', e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14 }} />
          <div>
            <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Quem te indicou? *</label>
            <select value={form.indicador} onChange={e => f('indicador', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">Selecione o médium</option>
              {mediuns.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Quantidade de números</label>
            <input type="number" min={1} max={100} value={form.qtd} onChange={e => f('qtd', Math.max(1, Number(e.target.value)))} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ background: C.goldLight, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: C.goldDark }}>Total a pagar</span>
            <span style={{ fontSize: 22, fontWeight: 500, color: C.goldDark }}>R$ {total.toFixed(2)}</span>
          </div>
          <button onClick={comprar} disabled={salvando} style={{ padding: 14, background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            {salvando ? 'Registrando...' : 'Pagar agora'}
          </button>
        </div>
      </Card>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 500, color: C.dark, fontSize: 16, marginBottom: 4 }}>Pagamento via Pix</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Valor: <strong>R$ {total.toFixed(2)}</strong></div>
        <div style={{ background: C.bgSoft, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>Chave Pix:</div>
          <div style={{ fontWeight: 500, fontSize: 16, color: C.dark, padding: '10px 16px', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}` }}>{rifa.pix}</div>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted }}>Após o pagamento, aguarde a confirmação. Você receberá uma mensagem no WhatsApp. 🙏</div>
      </Card>
    </div>
  )
}
