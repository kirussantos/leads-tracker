import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/ai", tags=["ai"])


class CampanhaResumo(BaseModel):
    nome: str
    status: str
    verba: float
    impressoes: int
    cliques_wpp: int
    ctr: float
    cpl_estimado: float
    frequencia: float


class AnalisarRequest(BaseModel):
    cliente_nome: str
    periodo: str
    metricas: dict
    campanhas: List[CampanhaResumo]


@router.post("/analisar")
def analisar_campanhas(data: AnalisarRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"erro": "ANTHROPIC_API_KEY não configurado no servidor."}

    try:
        import anthropic

        camp_lines = "\n".join([
            f"• {c.nome[:60]} | Verba: R${c.verba:.2f} | "
            f"WPP: {c.cliques_wpp} | CTR: {c.ctr:.2f}% | "
            f"CPL: R${c.cpl_estimado:.2f} | Freq: {c.frequencia:.1f}"
            for c in data.campanhas[:20]
        ])

        m = data.metricas
        prompt = f"""Você é um especialista sênior em tráfego pago no Meta Ads, focado em clínicas de saúde no Brasil. Analise os dados abaixo e dê recomendações diretas e práticas em português.

**CLIENTE:** {data.cliente_nome}
**PERÍODO:** {data.periodo}

**MÉTRICAS GERAIS:**
- Verba: R${m.get('verba', 0):.2f}
- Impressões: {int(m.get('impressoes', 0)):,}
- Alcance: {int(m.get('alcance', 0)):,}
- Cliques WhatsApp: {m.get('cliques_wpp', 0)}
- CTR: {m.get('ctr_medio', 0):.2f}%
- CPM: R${m.get('cpm', 0):.2f}
- CPL Estimado: R${m.get('cpl_estimado', 0):.2f}
- Frequência Média: {m.get('frequencia_media', 0):.1f}
- Campanhas ativas: {m.get('n_campanhas', 0)}

**CAMPANHAS:**
{camp_lines}

Estruture sua resposta em 5 seções:

## 🎯 Diagnóstico Geral
(2-3 frases diretas sobre o estado das campanhas)

## 🚀 Campanhas para Escalar
(top 2-3 com melhor CPL, diga por que e quanto aumentar verba)

## ⚠️ Campanhas para Ajustar ou Pausar
(identifique as de CPL alto ou frequência > 3)

## ⚡ Ações Imediatas (esta semana)
(lista de 4-5 ações concretas e executáveis)

## 📊 Meta de CPL Recomendada
(com base nos dados, qual CPL alvo e por quê)

Seja direto. Sem enrolação. Use dados concretos."""

        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=1800,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"analise": msg.content[0].text}

    except ImportError:
        return {"erro": "Biblioteca 'anthropic' não instalada no servidor."}
    except Exception as e:
        return {"erro": f"Erro na análise: {str(e)}"}
