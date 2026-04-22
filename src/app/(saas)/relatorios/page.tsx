import { Card, Title } from "@/design-system";

export default function RelatoriosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Em breve: exportação PDF, cohorts e comparativos regionais.
        </p>
      </div>
      <Card className="border border-dashed border-gray-200 bg-white/70">
        <Title>Placeholder</Title>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          Esta área receberá relatórios avançados para time comercial e
          planejamento. Por enquanto, use o painel e a tabela de vendas para
          acompanhar operação diária.
        </p>
      </Card>
    </div>
  );
}
