// Indica de onde o dado mockado desta tela viria em produção (SharePoint).
// Facilita trocar por dados reais depois: basta substituir o mock pela
// chamada real ao Microsoft Graph API apontando para o mesmo local.
import { Folder } from "lucide-react";

export default function SourceTag({ path }) {
  return (
    <span className="source-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Folder size={13} /> Fonte planejada: {path}
    </span>
  );
}
