import { Campo } from "@/components/ui";

type Aluno = Partial<Record<"numero" | "nome" | "genero" | "data_nascimento" | "naturalidade" | "nacionalidade" | "linguas" | "morada" | "bi" | "observacoes", string | null>>;

export function CamposAluno({ a = {}, numeroObrigatorio = false }: { a?: Aluno; numeroObrigatorio?: boolean }) {
  const v = (k: keyof Aluno) => a[k] ?? undefined;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2"><Campo rotulo="Nome completo"><input name="nome" className="campo" required defaultValue={v("nome")} /></Campo></div>
      <Campo rotulo="N.º de processo" ajuda={numeroObrigatorio ? undefined : "Deixe vazio para gerar automaticamente."}>
        <input name="numero" className="campo" required={numeroObrigatorio} defaultValue={v("numero")} />
      </Campo>
      <Campo rotulo="Género">
        <select name="genero" className="campo" defaultValue={v("genero") ?? ""}>
          <option value="">—</option><option value="F">Feminino</option><option value="M">Masculino</option>
        </select>
      </Campo>
      <Campo rotulo="Data de nascimento"><input type="date" name="data_nascimento" className="campo" defaultValue={v("data_nascimento")} /></Campo>
      <Campo rotulo="Naturalidade"><input name="naturalidade" className="campo" placeholder="Ex.: Bissau, Bafatá, Canchungo" defaultValue={v("naturalidade")} /></Campo>
      <Campo rotulo="Nacionalidade"><input name="nacionalidade" className="campo" defaultValue={v("nacionalidade") ?? "Guineense"} /></Campo>
      <Campo rotulo="Línguas faladas em casa" ajuda="Ajuda os professores a planear o ensino em contexto multilíngue.">
        <input name="linguas" className="campo" placeholder="Ex.: Kriol, Balanta, Fula" defaultValue={v("linguas")} />
      </Campo>
      <Campo rotulo="N.º de BI / cédula"><input name="bi" className="campo" defaultValue={v("bi")} /></Campo>
      <div className="sm:col-span-2 lg:col-span-3"><Campo rotulo="Morada / bairro"><input name="morada" className="campo" defaultValue={v("morada")} /></Campo></div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Campo rotulo="Observações (saúde, necessidades educativas, etc.)"><textarea name="observacoes" rows={2} className="campo" defaultValue={v("observacoes")} /></Campo>
      </div>
    </div>
  );
}

export function CamposEncarregado({ prefixo = "" }: { prefixo?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Campo rotulo="Nome do encarregado"><input name={`${prefixo}nome`} className="campo" /></Campo>
      <Campo rotulo="Parentesco"><input name={`${prefixo}parentesco`} className="campo" placeholder="Pai, mãe, tio, tutor…" /></Campo>
      <Campo rotulo="Telefone"><input name={`${prefixo}telefone`} className="campo" inputMode="tel" placeholder="+245 9xx xxx xxx" /></Campo>
      <Campo rotulo="Email" ajuda="Necessário para acesso ao portal."><input type="email" name={`${prefixo}email`} className="campo" /></Campo>
      <Campo rotulo="Profissão"><input name={`${prefixo}profissao`} className="campo" /></Campo>
    </div>
  );
}
