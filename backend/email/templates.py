"""
Templates HTML para os emails de alerta.
"""


def template_alerta_campanhas(
    cliente_nome: str,
    campanhas_ruins: list[dict],
    periodo: str = "últimos 7 dias",
) -> str:
    """
    Gera o HTML do email de alerta de campanhas com baixo desempenho.

    Cada item de campanhas_ruins deve ter:
      nome, verba, cpl, ctr, frequencia, cliques_wpp, motivo
    """

    def badge(cor: str, texto: str) -> str:
        cores = {
            "red":   ("fff0f0", "ef4444"),
            "amber": ("fffbeb", "f59e0b"),
            "blue":  ("eff6ff", "3b82f6"),
        }
        bg, fg = cores.get(cor, ("f4f4f4", "666"))
        return (
            f'<span style="background:#{bg};color:#{fg};'
            f'padding:2px 8px;border-radius:4px;font-size:11px;'
            f'font-weight:600;font-family:monospace">{texto}</span>'
        )

    linhas_campanhas = ""
    for c in campanhas_ruins:
        motivos_html = " ".join(
            badge("red", m) for m in c.get("motivos", [])
        )
        linhas_campanhas += f"""
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0">
            <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:4px">
              {c.get('nome','—')}
            </div>
            <div style="margin-top:4px">{motivos_html}</div>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;
                     text-align:right;font-family:monospace;font-size:13px;color:#ef4444;font-weight:700">
            R${c.get('verba', 0):.0f}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;
                     text-align:right;font-family:monospace;font-size:13px;color:#f59e0b;font-weight:700">
            {c.get('cpl_estimado', 0):.2f} / lead
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;
                     text-align:right;font-family:monospace;font-size:13px;color:#6b7280">
            CTR {c.get('ctr', 0):.2f}%
          </td>
        </tr>
        """

    qtd = len(campanhas_ruins)
    plural = "s" if qtd != 1 else ""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:'Inter',Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#09090f 0%,#13131e 100%);padding:28px 32px">
      <div style="font-family:monospace;font-size:11px;color:#22c55e;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px">
        ⚡ leads.tracker
      </div>
      <div style="font-size:22px;font-weight:700;color:#fff">
        {qtd} campanha{plural} com baixo desempenho
      </div>
      <div style="font-size:13px;color:#64748b;margin-top:4px">
        {cliente_nome} · {periodo}
      </div>
    </td>
  </tr>

  <!-- Alert banner -->
  <tr>
    <td style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 32px">
      <span style="font-size:13px;color:#b91c1c;font-weight:500">
        ⚠️ Atenção necessária — estas campanhas estão gastando verba sem retorno adequado.
        Recomendamos pausar ou otimizar imediatamente.
      </span>
    </td>
  </tr>

  <!-- Campaigns table -->
  <tr>
    <td style="padding:24px 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background:#f8f9fa">
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-family:monospace;
                       color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600">
              Campanha
            </th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-family:monospace;
                       color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600">
              Verba
            </th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-family:monospace;
                       color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600">
              CPL
            </th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-family:monospace;
                       color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600">
              CTR
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas_campanhas}
        </tbody>
      </table>
    </td>
  </tr>

  <!-- Thresholds -->
  <tr>
    <td style="padding:0 32px 24px">
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;font-size:12px;color:#6b7280;font-family:monospace">
        <strong style="color:#374151;display:block;margin-bottom:8px">Critérios de alerta</strong>
        CPL &gt; R$30 · CTR &lt; 0,8% · Frequência &gt; 3,5x · Gasto &gt; R$50 sem leads
      </div>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:0 32px 32px;text-align:center">
      <a href="https://frontend-rose-gamma-78.vercel.app"
         style="display:inline-block;background:#22c55e;color:#000;font-weight:700;
                font-family:monospace;font-size:13px;padding:12px 28px;
                border-radius:8px;text-decoration:none">
        Acessar Dashboard →
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f8f9fa;padding:16px 32px;text-align:center;
               font-size:11px;color:#9ca3af;font-family:monospace">
      leads.tracker · Relatório automático · Para cancelar alertas, acesse as configurações
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""
