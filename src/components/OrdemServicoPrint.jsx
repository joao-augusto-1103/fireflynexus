import React, { useRef } from "react";

// OrdemServicoPrint.jsx
// Componente React único que renderiza uma página A4 com 2 vias (duas ordens)
// Pronto para usar em um projeto React (Tailwind disponível).
// O componente aceita um `data` prop com os campos da ordem; se não houver, usa valores de exemplo.

export default function OrdemServicoPrint({ data }) {
  const printRef = useRef(null);

  const sample = {
    empresa: "teste",
    endereco: "Rua José Pedro dos Santos, 74 | CNPJ: 1234569874111",
    contato: "Fone: 17999999999 | WhatsApp: 17999999999 | E-mail: email@gmail.com | Site: https://www.instagram.com",
    os: "OS0001",
    data: "29/09/2025",
    cliente: "João Augusto Silva Martins",
    telefone: "17992425958",
    enderecoCliente: "Rua José Pedro dos Santos, 74 Bebedouro",
    descricao: "Trocar Tela",
    marcaModelo: "iPhone 14 Pro Max",
    imei: "-",
    valor: "R$ 550,00",
    dataEntrada: "29/09/2025",
    termos: [
      "Prazo para retirada: 30 dias após conclusão",
      "Taxa de armazenamento: R$ 5,00 por dia após prazo",
      "Retirada apenas com documento do cliente",
      "Peças substituídas: não faço devolução de peças",
      "Garantia: 30 dias para peças e serviços"
    ]
  };

  const d = { ...sample, ...(data || {}) };

  function handlePrint() {
    window.print();
  }

  // Renderiza duas vias por folha
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex gap-4 mb-4">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
        >
          Imprimir (Preview do navegador)
        </button>
      </div>

      <div ref={printRef} className="print-container">
        {[0, 1].map((i) => (
          <div key={i} className="order-card">
            <div className="card-inner">
              <header className="flex items-start justify-between">
                <div className="text-center w-full">
                  <h1 className="text-blue-600 text-xl font-bold">{d.empresa}</h1>
                  <div className="text-xs">{d.endereco}</div>
                  <div className="text-xs">{d.contato}</div>
                </div>
                <div className="os-box">
                  <div className="text-xs">Data: <strong>{d.data}</strong></div>
                  <div className="os-badge">OS: <span className="os-num">{d.os}</span></div>
                </div>
              </header>

              <div className="mt-3 grid grid-cols-12 gap-4 text-sm">
                <div className="col-span-7">
                  <div><strong>Cliente:</strong> {d.cliente}</div>
                  <div className="mt-1"><strong>Telefone:</strong> {d.telefone}</div>
                  <div className="mt-1"><strong>Endereço:</strong> {d.enderecoCliente}</div>
                  <div className="mt-1"><strong>Descrição do Defeito:</strong> {d.descricao}</div>
                  <div className="mt-1"><strong>Marca/Modelo:</strong> {d.marcaModelo}</div>
                  <div className="mt-1"><strong>IMEI:</strong> {d.imei}</div>
                </div>

                <div className="col-span-5">
                  <div><strong>Valor:</strong> {d.valor}</div>
                  <div className="mt-1"><strong>Data Entrada:</strong> {d.dataEntrada}</div>

                  <div className="mt-4"><strong>Senha Desenho:</strong></div>
                  <div className="grid grid-cols-3 gap-2 mt-2 senha-draw">
                    {Array.from({ length: 9 }).map((_, idx) => (
                      <div key={idx} className="circle" />
                    ))}
                  </div>

                  <div className="text-[10px] mt-2">Desenhe o padrão conectando os pontos</div>
                </div>
              </div>

              <div className="mt-6 termos-heading">TERMS &amp; CONDIÇÕES</div>

              <div className="termos-list">
                <ul>
                  {d.termos.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="assinaturas">
                <div className="assin-col">
                  <div className="assin-line" />
                  <div className="assin-label">Cliente</div>
                </div>
                <div className="assin-col">
                  <div className="assin-line" />
                  <div className="assin-label">Técnico</div>
                </div>
                <div className="assin-col">
                  <div className="assin-line" />
                  <div className="assin-label">Observações</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estilos específicos para impressão e para manter tudo alinhado A4 */}
      <style>{`
        /* Força tamanho A4 na impressão */
        @page { size: A4; margin: 12mm; }

        .print-container { width: 210mm; margin: 0 auto; }

        /* Cada ordem ocupa metade da altura da página A4 */
        .order-card { box-sizing: border-box; width: 100%; height: 148.5mm; padding: 8px; border: 1px solid #aaa; margin-bottom: 6mm; background: white; }
        .card-inner { height: 100%; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; }

        .os-box { width: 120px; text-align: right; }
        .os-badge { margin-top: 8px; border: 1px solid #cfcfcf; padding: 6px 8px; border-radius: 4px; font-weight: 600; }
        .os-num { color: #1e88e5; }

        .senha-draw .circle { width: 22px; height: 22px; border-radius: 50%; border: 1px solid #333; }

        .termos-heading { text-align: center; font-weight: 700; font-size: 12px; margin-top: 6px; border-top: 1px dashed #666; padding-top: 6px; }
        .termos-list { font-size: 11px; margin-top: 6px; }
        .termos-list ul { padding-left: 16px; margin: 0; }
        .termos-list li { margin-bottom: 2px; }

        .assinaturas { display: flex; gap: 12px; margin-top: 8px; align-items: flex-end; }
        .assin-col { flex: 1; text-align: center; }
        .assin-line { height: 1px; background: #111; margin-bottom: 6px; }
        .assin-label { font-size: 11px; }

        /* Não quebrar dentro do cartão e fazer página com 2 cópias */
        .order-card { page-break-inside: avoid; }

        /* Ajustes para impressão: remover botões e fundo */
        @media print {
          body { background: white; }
          .min-h-screen { background: white; }
          .print-container { margin: 0; }
          button { display: none !important; }
        }

        /* Versão para visualização na tela (opcional) */
        @media screen {
          .order-card { box-shadow: 0 1px 0 rgba(0,0,0,0.1); }
        }
      `}</style>
    </div>
  );
}
