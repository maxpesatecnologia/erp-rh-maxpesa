// Indica de onde o dado mockado desta tela viria em produção (SharePoint).
// Facilita trocar por dados reais depois: basta substituir o mock pela
// chamada real ao Microsoft Graph API apontando para o mesmo local.
export default function SourceTag({ path }) {
  return <span className="source-tag">📁 Fonte planejada: {path}</span>;
}
