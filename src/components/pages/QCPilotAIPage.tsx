'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { AIMessage } from '@/types';

export default function QCPilotAIPage() {
  const {
    currentPoleId, currentAtelierId, currentUser, db,
    getPole, getAtelier, getUser, getUserRole,
    getLotsForPole, getNCsForPole, getLotResults,
    hasPermission, aiMessages, setAiMessages,
  } = useStore();
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiMessages]);

  if (!hasPermission('ai.use')) {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div><h3>Accès refusé</h3><p>Permissions insuffisantes.</p>
      </div>
    );
  }

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const at = currentAtelierId ? getAtelier(currentAtelierId) : undefined;
  const role = currentUser ? getUserRole(currentUser) : undefined;

  const buildContext = () => {
    const pL = getLotsForPole(currentPoleId || '');
    const pN = getNCsForPole(currentPoleId || '');
    const lib = pL.filter((l) => l.status === 'libere').length;
    const blk = pL.filter((l) => l.status === 'bloque').length;
    const res = pL.filter((l) => l.status === 'reserve').length;
    const soum = pL.filter((l) => l.status === 'soumis').length;
    const valC = pL.filter((l) => l.status === 'valide_chef').length;
    const tot = pL.length;
    const fpy = tot > 0 ? Math.round(lib / tot * 100) : 0;

    let ctx = `[CONTEXTE]\nUtilisateur: ${currentUser?.fullName}\nRôle: ${role?.name || '-'}\nPôle: ${pole?.name || '-'}\n`;
    if (at) ctx += `Atelier: ${at.name}\n`;
    ctx += `\n[KPI]\nLots: ${tot} | Lib: ${lib} | Rés: ${res} | Bloq: ${blk} | Soum: ${soum} | AttQC: ${valC}\nFPY: ${fpy}%\n`;
    ctx += `NC ouv: ${pN.filter((n) => n.status === 'ouverte').length} | En cours: ${pN.filter((n) => n.status === 'en_cours').length}\n`;

    const actNCs = pN.filter((n) => n.status !== 'cloturee');
    if (actNCs.length > 0) {
      ctx += '\n[NC ACTIVES]\n';
      actNCs.forEach((nc) => {
        const ncAt = getAtelier(nc.atelierId);
        ctx += `${nc.numero} | ${ncAt?.name || ''} | ${nc.gravite} | ${nc.description.substring(0, 80)}\n`;
      });
    }

    const bkL = pL.filter((l) => l.status === 'bloque').slice(0, 3);
    if (bkL.length > 0) {
      ctx += '\n[LOTS BLOQUÉS]\n';
      bkL.forEach((l) => {
        ctx += `${l.numLot} | ${l.of} | ${(l.observations || '').substring(0, 60)}\n`;
        getLotResults(l.id).filter((r) => r.verdict === 'NOK').forEach((r) => {
          const ct = db.controlLibrary.find((x) => x.id === r.controlId);
          ctx += `  NOK: ${ct?.name || ''} moy=${r.avg != null ? r.avg.toFixed(2) : 'N/A'}\n`;
        });
      });
    }
    return ctx;
  };

  const buildSystemPrompt = () => {
    let sp = 'Tu es QC Pilot, assistant IA qualité industriel de MULTIPRINT. Règles: ne jamais inventer de données, ne jamais contourner le workflow, distinguer faits/hypothèses/recommandations, répondre en français. Structurer en Constat/Analyse/Risque/Recommandation quand pertinent.\n\n';
    if (role) {
      const rMap: Record<string, string> = {
        role_op: 'Mode Opérateur: simple, concret.',
        role_chef: 'Mode Chef: copilote analytique.',
        role_qc: 'Mode QC: méthodique, factuel.',
        role_rq: 'Mode Qualité: analyste performance.',
        role_admin: 'Mode Admin: vue complète.',
        role_dg: 'Mode Direction: synthétique.',
      };
      sp += (rMap[role.id] || '') + ' ';
    }
    if (pole) {
      const pMap: Record<string, string> = {
        pole_oe: 'Pôle Offset Étiquette (densité CMJN, ΔE, repérage, BAT).',
        pole_oc: 'Pôle Offset Carton (densité, rainage, pliage).',
        pole_cap: 'Pôle Capsule (impression tôle, laquage, emboutissage).',
        pole_hf: 'Pôle Hélio Flexible (complexage, extrusion, scellabilité).',
      };
      sp += (pMap[pole.id] || '');
    }
    return sp;
  };

  const fallbackResponse = (msg: string) => {
    const low = msg.toLowerCase();
    const pL = getLotsForPole(currentPoleId || '');
    const pN = getNCsForPole(currentPoleId || '');
    const lib = pL.filter((l) => l.status === 'libere').length;
    const blk = pL.filter((l) => l.status === 'bloque').length;
    const tot = pL.length;
    const fpy = tot > 0 ? Math.round(lib / tot * 100) : 0;

    if (low.includes('synthèse') || low.includes('résumé') || low.includes('état')) {
      return `<strong>Synthèse qualité ${pole?.name || ''}</strong><br>` +
        `• ${tot} lots dont ${lib} libérés, ${blk} bloqués<br>` +
        `• FPY: ${fpy}%<br>` +
        `• ${pN.filter((n) => n.status === 'ouverte').length} NC ouvertes<br>` +
        `<br><em>Recommandation: ${blk > 0 ? 'Traiter les lots bloqués en priorité.' : 'Situation stable.'}</em>`;
    }
    if (low.includes('nc') || low.includes('non-conformité')) {
      const actNCs = pN.filter((n) => n.status !== 'cloturee');
      if (!actNCs.length) return 'Aucune NC active sur ce pôle. Bonne nouvelle !';
      let r = `<strong>${actNCs.length} NC actives</strong><br>`;
      actNCs.slice(0, 5).forEach((nc) => {
        r += `• ${nc.numero} — ${nc.gravite} — ${nc.description.substring(0, 50)}<br>`;
      });
      return r;
    }
    if (low.includes('lot') || low.includes('production')) {
      return `<strong>Production ${pole?.name || ''}</strong><br>` +
        `• ${tot} lots total<br>• Libérés: ${lib}<br>• Bloqués: ${blk}<br>• FPY: ${fpy}%`;
    }
    if (low.includes('recommandation') || low.includes('conseil')) {
      const tips: string[] = [];
      if (blk > 0) tips.push('Analyser les causes racines des ' + blk + ' lots bloqués');
      if (fpy < 80) tips.push('FPY bas (' + fpy + '%) — revoir les paramètres process');
      const ncOuv = pN.filter((n) => n.status === 'ouverte').length;
      if (ncOuv > 2) tips.push(ncOuv + ' NC ouvertes — prioriser par gravité');
      if (!tips.length) tips.push('Situation maîtrisée, continuer le suivi régulier');
      return '<strong>Recommandations</strong><br>' + tips.map((t) => '• ' + t).join('<br>');
    }
    return `Je suis QC Pilot, votre assistant qualité. Posez-moi des questions sur :<br>` +
      `• Synthèse qualité du pôle<br>• État des NC<br>• Lots bloqués<br>• Recommandations`;
  };

  const sendMessage = async (preset?: string) => {
    const msg = preset || input.trim();
    if (!msg) return;
    setInput('');

    const newMsgs: AIMessage[] = [...aiMessages, { role: 'user', content: msg }];
    setAiMessages(newMsgs);
    setSending(true);

    try {
      const ctx = buildContext();
      const sp = buildSystemPrompt();
      const apiMsgs = newMsgs.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.role === 'user' ? m.content : m.content.replace(/<[^>]+>/g, ''),
      }));
      const last = apiMsgs[apiMsgs.length - 1];
      if (last && last.role === 'user') last.content = ctx + '\n\n' + last.content;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: sp,
          messages: apiMsgs,
        }),
      });
      const data = await resp.json();
      let txt = '';
      if (data.content && data.content.length > 0) {
        data.content.forEach((b: { type: string; text: string }) => { if (b.type === 'text') txt += b.text; });
      }
      if (!txt) txt = 'Pas de réponse.';
      txt = txt.replace(/\n/g, '<br>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      setAiMessages([...newMsgs, { role: 'assistant', content: txt }]);
    } catch {
      const fb = fallbackResponse(msg) + '<br><br><em style="color:var(--text-muted);font-size:11px;">Mode local — API indisponible</em>';
      setAiMessages([...newMsgs, { role: 'assistant', content: fb }]);
    }
    setSending(false);
  };

  const clearChat = () => { setAiMessages([]); };

  const quickActions = ['Synthèse qualité', 'Analyse NC ouvertes', 'État lots production', 'Recommandations', 'Rédiger NC lot bloqué'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🤖 QC Pilot — Assistant IA</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Pôle: {pole?.name || '-'} • Rôle: {role?.name || '-'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={clearChat}>🗑 Effacer</button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨️ Imprimer</button>
        </div>
      </div>

      <div className="card" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        {/* Chat area */}
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius)', marginBottom: 12, border: '1px solid var(--border)' }}>
          {aiMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <h3 style={{ color: 'var(--accent)', marginBottom: 8 }}>QC Pilot</h3>
              <p>Assistant IA qualité industriel MULTIPRINT</p>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {quickActions.map((s) => (
                  <button key={s} className="btn btn-sm btn-secondary" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {aiMessages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="ai-msg-user"><div>{m.content}</div></div>
            ) : (
              <div key={i} className="ai-msg-bot">
                <div className="ai-avatar">🤖</div>
                <div className="ai-bubble" dangerouslySetInnerHTML={{ __html: m.content }} />
              </div>
            )
          ))}
          {sending && (
            <div className="ai-msg-bot">
              <div className="ai-avatar">🤖</div>
              <div className="ai-bubble"><div className="ai-typing"><span></span><span></span><span></span></div></div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Posez votre question qualité..."
            style={{ flex: 1 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            disabled={sending}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={sending}>
            {sending ? '...' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
