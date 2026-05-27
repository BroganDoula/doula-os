type NdaRow = {
  id: string;
  counterparty: string;
  signedDate: string | null;
  expirationDate: string | null;
  bidirectional: boolean;
  fileName: string | null;
};

export function ProjectNdasSection({ ndas }: { ndas: NdaRow[] }) {
  if (ndas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No NDAs linked to this project.</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Counterparty</th>
          <th className="pb-2 font-medium">Signed</th>
          <th className="pb-2 font-medium">Expires</th>
          <th className="pb-2 font-medium">Mutual</th>
          <th className="pb-2 font-medium">File</th>
        </tr>
      </thead>
      <tbody>
        {ndas.map((n) => (
          <tr key={n.id} className="border-b">
            <td className="py-2">{n.counterparty}</td>
            <td className="py-2 text-muted-foreground">{n.signedDate ?? "—"}</td>
            <td className="py-2 text-muted-foreground">{n.expirationDate ?? "—"}</td>
            <td className="py-2 text-muted-foreground">{n.bidirectional ? "Yes" : "No"}</td>
            <td className="py-2 text-muted-foreground">{n.fileName ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
