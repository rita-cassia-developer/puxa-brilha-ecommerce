import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";

const pages = {
  privacy: { title: "Política de privacidade", eyebrow: "Privacidade", sections: [["Uso das informações", "Usamos os dados informados no checkout para processar o pedido, calcular o frete, realizar a entrega e prestar atendimento."], ["Dados coletados", "Podem ser solicitados nome, CEP, endereço, telefone e e-mail, sempre de acordo com a finalidade da compra e do atendimento."], ["Segurança", "Adotamos medidas para proteger as informações pessoais e não solicitamos dados além do necessário para o pedido."]] },
  terms: { title: "Termos de uso", eyebrow: "Transparência", sections: [["Compras", "Ao realizar um pedido, confira os produtos, quantidades, valores, prazo e endereço antes de confirmar."], ["Produtos e preços", "A disponibilidade, os preços e as condições de pagamento são apresentados na vitrine e no checkout."], ["Atendimento", "Em caso de dúvida sobre o pedido, entre em contato com a equipe Puxa & Brilha pelos canais informados no site."]] },
  shipping: { title: "Entrega e retirada", eyebrow: "Recebimento", sections: [["Prazo", "O prazo de envio informado no checkout é de até 7 dias úteis após a confirmação do pedido."], ["Frete", "O frete é calculado a partir do CEP informado e aparece antes da confirmação da compra."], ["Retirada", "A opção de retirada pode ser escolhida no checkout. O local e o horário são informados pelo atendimento após a confirmação do pedido."]] },
  returns: { title: "Trocas e devoluções", eyebrow: "Atendimento", sections: [["Condições", "Trocas, devoluções e cancelamentos seguem as condições informadas no atendimento e na confirmação do pedido."], ["Solicitações", "Para solicitar uma troca, devolução ou cancelamento, entre em contato com o atendimento da loja."], ["Orientação", "Nossa equipe orientará você sobre prazos, condições e próximos passos."]] },
} as const;

const business = { tradeName: "Puxa & Brilha", cnpj: "69.758.868/0001-51", instagram: "https://www.instagram.com/cerapuxa_brilha/" };

type PageKey = keyof typeof pages;
export default function Legal() {
  const [, params] = useRoute("/legal/:page");
  const page = pages[(params?.page as PageKey) || "privacy"] ?? pages.privacy;
  return <main className="legal-page"><header className="legal-header"><Link href="/" className="legal-back"><ArrowLeft size={16} /> Voltar à loja</Link><Link href="/" className="market-logo"><img className="brand-logo brand-logo-legal" src="/brand/puxa-brilha-logo.png" alt="Puxa & Brilha" /></Link><span className="legal-lock"><ShieldCheck size={15} /> Ambiente protegido</span></header><article className="legal-content"><span className="eyebrow-small">Puxa & Brilha · {page.eyebrow}</span><h1>{page.title}</h1><p className="legal-lead">Informações importantes para uma experiência clara, segura e transparente.</p><div className="legal-sections">{page.sections.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}</div><div className="legal-note"><strong>{business.tradeName}</strong><span>CNPJ: {business.cnpj}</span><span>Instagram: <a href={business.instagram} target="_blank" rel="noreferrer">@cerapuxa_brilha</a></span><span>O endereço físico não é divulgado publicamente. Consulte o atendimento para informações de retirada.</span></div></article></main>;
}
