// Templates jurídicos para o editor de minutas
export interface DocumentTemplate {
  id: string;
  nome: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  categoria: string;
  descricao: string;
  conteudo: string;
  variaveis: string[];
  tags: string[];
}

export const documentTemplates: DocumentTemplate[] = [
  // PETIÇÕES
  {
    id: "peticao-inicial-civel",
    nome: "Petição Inicial - Ação Cível",
    tipo: "peticao",
    categoria: "Cível",
    descricao: "Modelo de petição inicial para ações cíveis em geral",
    variaveis: [
      "juizo",
      "vara",
      "comarca",
      "estado",
      "autor.nome",
      "autor.nacionalidade",
      "autor.estadoCivil",
      "autor.profissao",
      "autor.cpf",
      "autor.rg",
      "autor.endereco",
      "autor.email",
      "reu.nome",
      "reu.endereco",
      "reu.cpf",
      "valor.causa",
      "advogado.nome",
      "advogado.oab",
    ],
    tags: ["petição inicial", "cível", "ação"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{juizo}} VARA {{vara}} DA COMARCA DE {{comarca}}/{{estado}}</h1>

<p><br></p>

<p style="text-align: justify;"><strong>{{autor.nome}}</strong>, {{autor.nacionalidade}}, {{autor.estadoCivil}}, {{autor.profissao}}, portador(a) do RG nº {{autor.rg}} e inscrito(a) no CPF sob o nº {{autor.cpf}}, residente e domiciliado(a) na {{autor.endereco}}, endereço eletrônico {{autor.email}}, por seu advogado que esta subscreve (procuração anexa), com escritório profissional no endereço constante do timbre, onde recebe intimações, vem, respeitosamente, à presença de Vossa Excelência, propor a presente</p>

<h2 style="text-align: center;">AÇÃO DE [TIPO DA AÇÃO]</h2>

<p style="text-align: justify;">em face de <strong>{{reu.nome}}</strong>, [qualificação do réu], residente e domiciliado(a) na {{reu.endereco}}, inscrito(a) no CPF sob o nº {{reu.cpf}}, pelos fatos e fundamentos a seguir expostos.</p>

<h3>I - DOS FATOS</h3>

<p style="text-align: justify;">[Narrar os fatos de forma clara e cronológica]</p>

<h3>II - DO DIREITO</h3>

<p style="text-align: justify;">[Fundamentação jurídica - artigos de lei, jurisprudência, doutrina]</p>

<h3>III - DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer:</p>

<ol>
  <li>A citação do(a) réu(ré) para, querendo, contestar a presente ação, sob pena de revelia;</li>
  <li>[Pedidos específicos];</li>
  <li>A procedência total dos pedidos, condenando o(a) réu(ré) a [condenação pretendida];</li>
  <li>A condenação do(a) réu(ré) ao pagamento das custas processuais e honorários advocatícios;</li>
  <li>A produção de todas as provas admitidas em direito, especialmente a prova documental, testemunhal e pericial.</li>
</ol>

<p style="text-align: justify;">Dá-se à causa o valor de <strong>R$ {{valor.causa}}</strong> para fins fiscais.</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><br></p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  {
    id: "contestacao-civel",
    nome: "Contestação - Ação Cível",
    tipo: "peticao",
    categoria: "Cível",
    descricao: "Modelo de contestação para ações cíveis",
    variaveis: [
      "processo.numero",
      "autor.nome",
      "reu.nome",
      "advogado.nome",
      "advogado.oab",
      "comarca",
      "estado",
    ],
    tags: ["contestação", "cível", "defesa"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong></p>

<p><br></p>

<p style="text-align: justify;"><strong>{{reu.nome}}</strong>, já qualificado(a) nos autos da ação em epígrafe, por seu advogado que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, apresentar</p>

<h2 style="text-align: center;">CONTESTAÇÃO</h2>

<p style="text-align: justify;">à ação proposta por <strong>{{autor.nome}}</strong>, pelos fatos e fundamentos a seguir expostos.</p>

<h3>I - SÍNTESE DOS FATOS</h3>

<p style="text-align: justify;">[Resumo da ação proposta pela parte autora]</p>

<h3>II - PRELIMINARES</h3>

<p style="text-align: justify;">[Se houver preliminares a arguir: inépcia da inicial, ilegitimidade de parte, incompetência, etc.]</p>

<h3>III - DO MÉRITO</h3>

<p style="text-align: justify;">[Argumentação de mérito refutando os pedidos do autor]</p>

<h3>IV - DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer:</p>

<ol>
  <li>O acolhimento das preliminares arguidas, com a extinção do processo sem resolução do mérito;</li>
  <li>Caso assim não entenda Vossa Excelência, seja julgada TOTALMENTE IMPROCEDENTE a presente ação;</li>
  <li>A condenação da parte autora ao pagamento das custas processuais e honorários advocatícios;</li>
  <li>A produção de todas as provas admitidas em direito.</li>
</ol>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  {
    id: "manifestacao-simples",
    nome: "Manifestação Simples",
    tipo: "peticao",
    categoria: "Geral",
    descricao: "Manifestação processual simples",
    variaveis: [
      "processo.numero",
      "parte.nome",
      "advogado.nome",
      "advogado.oab",
      "comarca",
      "estado",
    ],
    tags: ["manifestação", "petição intercorrente"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong></p>

<p><br></p>

<p style="text-align: justify;"><strong>{{parte.nome}}</strong>, já qualificado(a) nos autos, por seu advogado que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, manifestar-se nos seguintes termos:</p>

<p style="text-align: justify;">[Conteúdo da manifestação]</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  // CONTRATOS
  {
    id: "contrato-honorarios",
    nome: "Contrato de Honorários Advocatícios",
    tipo: "contrato",
    categoria: "Honorários",
    descricao: "Contrato de prestação de serviços advocatícios",
    variaveis: [
      "cliente.nome",
      "cliente.cpf",
      "cliente.endereco",
      "advogado.nome",
      "advogado.oab",
      "advogado.cpf",
      "advogado.endereco",
      "servico.descricao",
      "honorarios.valor",
      "honorarios.forma",
      "data.assinatura",
      "cidade",
      "estado",
    ],
    tags: ["contrato", "honorários", "advocatício"],
    conteudo: `<h1 style="text-align: center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS</h1>

<p><br></p>

<p style="text-align: justify;">Pelo presente instrumento particular, de um lado:</p>

<p style="text-align: justify;"><strong>CONTRATANTE:</strong> {{cliente.nome}}, inscrito(a) no CPF sob o nº {{cliente.cpf}}, residente e domiciliado(a) na {{cliente.endereco}};</p>

<p style="text-align: justify;"><strong>CONTRATADO:</strong> {{advogado.nome}}, advogado(a), inscrito(a) na OAB/{{estado}} sob o nº {{advogado.oab}}, CPF nº {{advogado.cpf}}, com escritório profissional na {{advogado.endereco}};</p>

<p style="text-align: justify;">Têm entre si justo e contratado o seguinte:</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>

<p style="text-align: justify;">O presente contrato tem por objeto a prestação de serviços advocatícios consistentes em: {{servico.descricao}}.</p>

<h3>CLÁUSULA SEGUNDA - DOS HONORÁRIOS</h3>

<p style="text-align: justify;">Pelos serviços prestados, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) honorários advocatícios no valor de <strong>R$ {{honorarios.valor}}</strong>, a ser pago da seguinte forma: {{honorarios.forma}}.</p>

<h3>CLÁUSULA TERCEIRA - DAS DESPESAS</h3>

<p style="text-align: justify;">As despesas processuais, custas, emolumentos, diligências, cópias e demais gastos necessários à execução dos serviços correrão por conta exclusiva do(a) CONTRATANTE.</p>

<h3>CLÁUSULA QUARTA - DA VIGÊNCIA</h3>

<p style="text-align: justify;">O presente contrato vigorará até o trânsito em julgado da ação ou até a conclusão dos serviços contratados.</p>

<h3>CLÁUSULA QUINTA - DO FORO</h3>

<p style="text-align: justify;">Fica eleito o foro da Comarca de {{cidade}}/{{estado}} para dirimir quaisquer questões oriundas deste contrato.</p>

<p style="text-align: justify;">E, por estarem assim justos e contratados, firmam o presente em duas vias de igual teor.</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data.assinatura}}.</p>

<p><br></p>

<table style="width: 100%;">
  <tr>
    <td style="width: 50%; text-align: center;">
      _________________________________<br>
      <strong>CONTRATANTE</strong><br>
      {{cliente.nome}}
    </td>
    <td style="width: 50%; text-align: center;">
      _________________________________<br>
      <strong>CONTRATADO</strong><br>
      {{advogado.nome}}<br>
      OAB/{{estado}} nº {{advogado.oab}}
    </td>
  </tr>
</table>

<p><br></p>

<p style="text-align: center;"><strong>TESTEMUNHAS:</strong></p>

<table style="width: 100%;">
  <tr>
    <td style="width: 50%; text-align: center;">
      1. _________________________________<br>
      Nome:<br>
      CPF:
    </td>
    <td style="width: 50%; text-align: center;">
      2. _________________________________<br>
      Nome:<br>
      CPF:
    </td>
  </tr>
</table>`,
  },

  // PROCURAÇÕES
  {
    id: "procuracao-ad-judicia",
    nome: "Procuração Ad Judicia",
    tipo: "procuracao",
    categoria: "Procuração",
    descricao: "Procuração para representação judicial",
    variaveis: [
      "outorgante.nome",
      "outorgante.nacionalidade",
      "outorgante.estadoCivil",
      "outorgante.profissao",
      "outorgante.cpf",
      "outorgante.rg",
      "outorgante.endereco",
      "advogado.nome",
      "advogado.oab",
      "advogado.endereco",
      "cidade",
      "estado",
      "data",
    ],
    tags: ["procuração", "ad judicia", "mandato"],
    conteudo: `<h1 style="text-align: center;">PROCURAÇÃO AD JUDICIA</h1>

<p><br></p>

<p style="text-align: justify;"><strong>OUTORGANTE:</strong> {{outorgante.nome}}, {{outorgante.nacionalidade}}, {{outorgante.estadoCivil}}, {{outorgante.profissao}}, portador(a) do RG nº {{outorgante.rg}} e inscrito(a) no CPF sob o nº {{outorgante.cpf}}, residente e domiciliado(a) na {{outorgante.endereco}}.</p>

<p style="text-align: justify;"><strong>OUTORGADO:</strong> {{advogado.nome}}, advogado(a), inscrito(a) na OAB/{{estado}} sob o nº {{advogado.oab}}, com escritório profissional na {{advogado.endereco}}.</p>

<p style="text-align: justify;"><strong>PODERES:</strong> Pelo presente instrumento particular de procuração, o(a) OUTORGANTE nomeia e constitui seu(sua) bastante procurador(a) o(a) OUTORGADO(A) acima qualificado(a), a quem confere amplos poderes para o foro em geral, com a cláusula "ad judicia", podendo propor contra quem de direito as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe, ainda, poderes especiais para confessar, desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente, podendo ainda substabelecer esta a outrem, com ou sem reservas de iguais poderes, dando tudo por bom, firme e valioso, especialmente para [ESPECIFICAR O OBJETO].</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data}}.</p>

<p><br></p>

<p style="text-align: center;">_________________________________<br>
<strong>{{outorgante.nome}}</strong><br>
CPF: {{outorgante.cpf}}</p>`,
  },

  {
    id: "procuracao-poderes-especiais",
    nome: "Procuração com Poderes Especiais",
    tipo: "procuracao",
    categoria: "Procuração",
    descricao: "Procuração com poderes especiais (art. 105 CPC)",
    variaveis: [
      "outorgante.nome",
      "outorgante.nacionalidade",
      "outorgante.estadoCivil",
      "outorgante.profissao",
      "outorgante.cpf",
      "outorgante.rg",
      "outorgante.endereco",
      "advogado.nome",
      "advogado.oab",
      "advogado.endereco",
      "cidade",
      "estado",
      "data",
    ],
    tags: ["procuração", "poderes especiais", "mandato"],
    conteudo: `<h1 style="text-align: center;">PROCURAÇÃO AD JUDICIA ET EXTRA<br>COM PODERES ESPECIAIS</h1>

<p><br></p>

<p style="text-align: justify;"><strong>OUTORGANTE:</strong> {{outorgante.nome}}, {{outorgante.nacionalidade}}, {{outorgante.estadoCivil}}, {{outorgante.profissao}}, portador(a) do RG nº {{outorgante.rg}} e inscrito(a) no CPF sob o nº {{outorgante.cpf}}, residente e domiciliado(a) na {{outorgante.endereco}}.</p>

<p style="text-align: justify;"><strong>OUTORGADO:</strong> {{advogado.nome}}, advogado(a), inscrito(a) na OAB/{{estado}} sob o nº {{advogado.oab}}, com escritório profissional na {{advogado.endereco}}.</p>

<p style="text-align: justify;"><strong>PODERES:</strong> Pelo presente instrumento particular de procuração, o(a) OUTORGANTE nomeia e constitui seu(sua) bastante procurador(a) o(a) OUTORGADO(A) acima qualificado(a), a quem confere amplos poderes para o foro em geral, com a cláusula "ad judicia et extra", podendo propor contra quem de direito as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe, ainda, <strong>PODERES ESPECIAIS</strong> para:</p>

<ul>
  <li>Receber citação inicial (art. 105, CPC);</li>
  <li>Confessar (art. 105, CPC);</li>
  <li>Reconhecer a procedência do pedido (art. 105, CPC);</li>
  <li>Transigir (art. 105, CPC);</li>
  <li>Desistir (art. 105, CPC);</li>
  <li>Renunciar ao direito sobre o qual se funda a ação (art. 105, CPC);</li>
  <li>Receber e dar quitação (art. 105, CPC);</li>
  <li>Firmar compromisso (art. 105, CPC);</li>
  <li>Assinar declaração de hipossuficiência.</li>
</ul>

<p style="text-align: justify;">Podendo ainda substabelecer esta a outrem, com ou sem reservas de iguais poderes, dando tudo por bom, firme e valioso.</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data}}.</p>

<p><br></p>

<p style="text-align: center;">_________________________________<br>
<strong>{{outorgante.nome}}</strong><br>
CPF: {{outorgante.cpf}}</p>`,
  },

  // RECURSOS
  {
    id: "recurso-apelacao",
    nome: "Recurso de Apelação",
    tipo: "recurso",
    categoria: "Recursos",
    descricao: "Modelo de recurso de apelação cível",
    variaveis: [
      "processo.numero",
      "apelante.nome",
      "apelado.nome",
      "advogado.nome",
      "advogado.oab",
      "comarca",
      "estado",
    ],
    tags: ["recurso", "apelação", "segunda instância"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong></p>

<p><br></p>

<p style="text-align: justify;"><strong>{{apelante.nome}}</strong>, já qualificado(a) nos autos, por seu advogado que esta subscreve, inconformado(a) com a r. sentença de fls., vem, respeitosamente, à presença de Vossa Excelência, interpor o presente</p>

<h2 style="text-align: center;">RECURSO DE APELAÇÃO</h2>

<p style="text-align: justify;">em face de <strong>{{apelado.nome}}</strong>, com fundamento no art. 1.009 e seguintes do Código de Processo Civil, requerendo seja o presente recurso recebido e processado, com a remessa dos autos ao Egrégio Tribunal de Justiça do Estado de {{estado}}, onde espera seja dado provimento ao recurso, nos termos das razões anexas.</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>

<hr>

<h1 style="text-align: center;">RAZÕES DE APELAÇÃO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong><br>
Apelante: {{apelante.nome}}<br>
Apelado(a): {{apelado.nome}}</p>

<h2 style="text-align: center;">EGRÉGIO TRIBUNAL DE JUSTIÇA DO ESTADO DE {{estado}}<br>COLENDA CÂMARA</h2>

<h3>I - DA TEMPESTIVIDADE</h3>

<p style="text-align: justify;">O presente recurso é tempestivo, tendo sido interposto dentro do prazo legal de 15 (quinze) dias úteis, nos termos do art. 1.003, §5º, do CPC.</p>

<h3>II - DO CABIMENTO</h3>

<p style="text-align: justify;">O recurso de apelação é cabível contra sentença, nos termos do art. 1.009 do CPC.</p>

<h3>III - DA SÍNTESE DOS FATOS E DA SENTENÇA</h3>

<p style="text-align: justify;">[Resumo dos fatos e do teor da sentença recorrida]</p>

<h3>IV - DAS RAZÕES PARA REFORMA</h3>

<p style="text-align: justify;">[Argumentação jurídica demonstrando os erros da sentença]</p>

<h3>V - DO PEDIDO</h3>

<p style="text-align: justify;">Ante o exposto, requer seja conhecido e provido o presente recurso, reformando-se a r. sentença recorrida para [especificar o pedido de reforma].</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  // PARECER
  {
    id: "parecer-juridico",
    nome: "Parecer Jurídico",
    tipo: "parecer",
    categoria: "Parecer",
    descricao: "Modelo de parecer jurídico",
    variaveis: [
      "cliente.nome",
      "assunto",
      "advogado.nome",
      "advogado.oab",
      "cidade",
      "estado",
      "data",
    ],
    tags: ["parecer", "consultoria", "opinião legal"],
    conteudo: `<h1 style="text-align: center;">PARECER JURÍDICO</h1>

<p><br></p>

<p><strong>CONSULENTE:</strong> {{cliente.nome}}</p>
<p><strong>ASSUNTO:</strong> {{assunto}}</p>
<p><strong>REFERÊNCIA:</strong> [Número de referência interno]</p>

<hr>

<h3>I - RELATÓRIO</h3>

<p style="text-align: justify;">Trata-se de consulta formulada por {{cliente.nome}}, acerca de {{assunto}}.</p>

<p style="text-align: justify;">[Narrar os fatos apresentados pelo consulente]</p>

<h3>II - DA QUESTÃO JURÍDICA</h3>

<p style="text-align: justify;">A questão jurídica a ser analisada consiste em:</p>

<p style="text-align: justify;">[Definir a(s) questão(ões) jurídica(s) a ser(em) respondida(s)]</p>

<h3>III - FUNDAMENTAÇÃO</h3>

<p style="text-align: justify;">[Análise jurídica completa com citação de legislação, doutrina e jurisprudência]</p>

<h3>IV - CONCLUSÃO</h3>

<p style="text-align: justify;">Ante o exposto, conclui-se que:</p>

<p style="text-align: justify;">[Resposta objetiva às questões formuladas]</p>

<p style="text-align: justify;">É o parecer, salvo melhor juízo.</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data}}.</p>

<p style="text-align: center;"><br></p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },
];

// Função para buscar template por ID
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return documentTemplates.find((t) => t.id === id);
}

// Função para buscar templates por tipo
export function getTemplatesByTipo(
  tipo: DocumentTemplate["tipo"]
): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.tipo === tipo);
}

// Função para buscar templates por categoria
export function getTemplatesByCategoria(categoria: string): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.categoria === categoria);
}

// Função para buscar templates por tag / texto livre
export function searchTemplates(query: string): DocumentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return documentTemplates.filter(
    (t) =>
      t.nome.toLowerCase().includes(lowerQuery) ||
      t.descricao.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      t.categoria.toLowerCase().includes(lowerQuery)
  );
}

// Função para substituir variáveis no template
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    // Corrigido: escapar TODOS os pontos da chave (autor.nome, processo.numero etc.)
    const escapedKey = key.replaceAll(/\./g, "\\.");
    const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, "g");
    result = result.replaceAll(regex, value || `[${key}]`);
  });

  return result;
}

// Extrair variáveis não preenchidas de um conteúdo
export function extractUnfilledVariables(content: string): string[] {
  const regex = /\{\{\s*([^}]+)\s*\}\}/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!matches.includes(variable)) {
      matches.push(variable);
    }
  }

  return matches;
}
