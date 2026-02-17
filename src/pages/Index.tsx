import StickerCalculator from "@/components/StickerCalculator";
import { Calculator } from "lucide-react";
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Orça Fácil
              </h1>
              <p className="text-sm text-muted-foreground">
                Orçamento rápido e prático!
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-1 md:px-50 py-10 bg-blue-200">
        {/* Hero Section */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Monte seu orçamento de forma prática e automática!
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Insira as dimensões (altura e largura), escolha a unidade de medida e o tipo de material. 
            O sistema calcula automaticamente o valor baseado na área.
          </p>
        </div>

        {/* Calculator */}
        <StickerCalculator />

      {/* 
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">1</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Insira as Medidas</h3>
            <p className="text-sm text-muted-foreground">
              Digite a altura e largura do adesivo em milímetros ou centímetros.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">2</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Escolha o Material</h3>
            <p className="text-sm text-muted-foreground">
              Selecione entre vinil branco, transparente, jateado, perfurado e mais.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">3</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Veja o Orçamento</h3>
            <p className="text-sm text-muted-foreground">
              O valor é calculado automaticamente com base na área e no preço por m².
            </p>
          </div>
        </div> */}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 bg-card">
        <div className="container mx-auto p-4 text-center text-sm text-muted-foreground bg-slate-100">
          <p>Calculadora de Orçamento e/ou Placas de sinalização © Copiadora Paraná Laser {new Date().getFullYear()} </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
