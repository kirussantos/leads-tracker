import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

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


class AnalisarCampanhaRequest(BaseModel):
    cliente_nome: str
    periodo: str
    campanha: dict  # dados completos da campanha individual


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


@router.post("/campanha")
def analisar_campanha_individual(data: AnalisarCampanhaRequest):
    """Análise profunda e decisão estratégica para uma campanha específica."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"erro": "ANTHROPIC_API_KEY não configurado no servidor."}

    try:
        import anthropic

        c = data.campanha
        nome = c.get("nome", "—")
        status = c.get("status", "—")
        verba = float(c.get("verba_gasta", 0))
        impressoes = int(c.get("impressoes", 0))
        alcance = int(c.get("alcance", 0))
        cliques_wpp = int(c.get("cliques_whatsapp", 0))
        cliques = int(c.get("cliques", 0))
        ctr = float(c.get("ctr", 0))
        cpl = float(c.get("cpl_estimado", 0))
        frequencia = float(c.get("frequencia", 0))
        cpc = float(c.get("cpc", 0))

        cpm = (verba / impressoes * 1000) if impressoes > 0 else 0
        taxa_conv_wpp = (cliques_wpp / cliques * 100) if cliques > 0 else 0

        prompt = f"""Você é um especialista sênior em tráfego pago no Meta Ads com 10+ anos de experiência em clínicas de saúde no Brasil. Sua tarefa é analisar UMA campanha específica e dar um veredito claro e decisões exatas.

**CLIENTE:** {data.cliente_nome}
**PERÍODO ANALISADO:** {data.periodo}

---

## DADOS DA CAMPANHA: "{nome}"

| Métrica | Valor | Benchmark Meta Ads (Saúde BR) |
|---|---|---|
| Status atual | {status} | — |
| Verba gasta | R${verba:.2f} | — |
| Impressões | {impressoes:,} | — |
| Alcance | {alcance:,} | — |
| Cliques totais | {cliques:,} | — |
| Cliques WhatsApp | {cliques_wpp} | — |
| CTR | {ctr:.2f}% | 1.5% – 3.5% |
| CPC | R${cpc:.2f} | R$0,80 – R$2,50 |
| CPM | R${cpm:.2f} | R$8 – R$25 |
| CPL Estimado | R${cpl:.2f} | R$8 – R$20 |
| Frequência | {frequencia:.1f}x | 1.5x – 2.5x |
| Taxa conv. WPP | {taxa_conv_wpp:.1f}% | 15% – 40% |

---

Analise CADA métrica em relação ao benchmark. Seja um consultor especialista que fala a verdade sem rodeios.

Estruture EXATAMENTE assim:

## 🔍 Diagnóstico da Campanha
(Avalie o estado geral em 2-3 frases diretas. Está performando bem, razoável ou mal? Por quê?)

## 📊 Análise Métrica por Métrica
(Para cada métrica fora do benchmark, explique o impacto e a causa provável. Para as boas, confirme o que está funcionando.)

## ⚖️ Veredito Final
**ESCALAR / OTIMIZAR / PAUSAR**
(Uma palavra, em negrito. Justifique em 2 frases.)

## ✅ O Que Fazer Agora (Ações Exatas)
(Liste de 3 a 6 ações específicas e executáveis. Exemplo: "Aumentar orçamento diário em 20%", "Testar novo criativo com depoimento de paciente", "Estreitar público para 35-55 anos mulheres". Seja CIRÚRGICO.)

## 💰 Projeção com Otimização
(Se as ações forem implementadas, qual CPL e volume de leads esperado em 30 dias? Seja realista com base nos dados.)

Responda em português. Dados concretos. Sem enrolação."""

        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"analise": msg.content[0].text}

    except ImportError:
        return {"erro": "Biblioteca 'anthropic' não instalada no servidor."}
    except Exception as e:
        return {"erro": f"Erro na análise da campanha: {str(e)}"}
