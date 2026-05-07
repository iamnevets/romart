interface Specification {
  label: string;
  value: string;
}

interface ProductSpecsProps {
  specifications: Specification[];
}

export function ProductSpecs({ specifications }: ProductSpecsProps) {
  if (specifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Specifications</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {specifications.map((spec, index) => (
              <tr
                key={spec.label}
                className={index % 2 === 0 ? "bg-muted/50" : "bg-background"}
              >
                <td className="px-4 py-3 font-medium text-muted-foreground w-1/3">
                  {spec.label}
                </td>
                <td className="px-4 py-3">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
