import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Calculator, Settings2, Save, FileDown, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable, { type Styles } from "jspdf-autotable";

interface StickerItem {
  id: number;
  height: number;
  width: number;
  unit: "m²" | "mm" | "cm";
  material: string;
  printingType: string;
  rigidMaterial: string;
  verso: boolean;
  aplicacao: boolean;
  quantity: number;
  area: number;
  unitPrice: number;
  totalPrice: number;
  specialCut: boolean;
  specialCutPrice: number;
  versoPrice: number;
  aplicacaoPrice: number;
}

interface MaterialPrice {
  name: string;
  pricePerM2: number;
}

// Preços por m² baseados em tipos comuns de adesivos
const DEFAULT_MATERIAL_PRICES: Record<string, MaterialPrice> = {
  sem_material: { name: "Não", pricePerM2: 0 },
  vinil_branco_fosco: { name: "Adesivo Vinil Fosco", pricePerM2: 115 },
  vinil_branco_brilho: { name: "Adesivo Vinil Brilho", pricePerM2: 115 },
  vinil_transparente_brilho: { name: "Adesivo Vinil Transparente", pricePerM2: 135 },
  papel_adesivo_fosco: { name: "Adesivo Papel Fosco (max: 33x48cm)", pricePerM2: 55 },
  papel_adesivo_brilho: { name: "Adesivo Papel Brilho (max: 33x48cm)", pricePerM2: 55 },
};

// Materiais rígidos disponíveis
const RIGID_MATERIALS: Record<string, MaterialPrice> = {
  sem_rigido: { name: "Não", pricePerM2: 0 },
  ps_1mm: { name: "PS 1mm", pricePerM2: 1000 },
  ps_2mm: { name: "PS 2mm", pricePerM2: 75 },
  ps_3mm: { name: "PS 3mm", pricePerM2: 100 },
  acrilico_2mm: { name: "Acrílico 2mm", pricePerM2: 100 },
  acrilico_3mm: { name: "Acrílico 3mm", pricePerM2: 125 },
  acrilico_6mm: { name: "Acrílico 6mm", pricePerM2: 180 },
};

// Tipos de impressão disponíveis
const PRINTING_TYPES = {
  sem_impressao: { name: "Sem impressão", pricePerM2: 0 },
  eco_solvente: { name: "Eco-solvente", pricePerM2: 80 },
  uv: { name: "Imp. UV", pricePerM2: 95 },
  laser: { name: "Imp. Laser", pricePerM2: 45 },
};



const DEFAULT_SPECIAL_CUT_PRICE = 15; // Preço adicional por m² para recorte especial
const APLICACAO_PRICE = 2; // Preço fixo por item para aplicação

const StickerCalculator = () => {
  const [items, setItems] = useState<StickerItem[]>([]);
  const [height, setHeight] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [unit, setUnit] = useState<"m²" | "mm" | "cm">("cm");
  const [material, setMaterial] = useState<string>("sem_material");
  const [printingType, setPrintingType] = useState<string>("sem_impressao");
  const [rigidMaterial, setRigidMaterial] = useState<string>("sem_rigido");
  const [quantity, setQuantity] = useState<string>("1");
  const [specialCut, setSpecialCut] = useState<boolean>(false);
  const [verso, setVerso] = useState<boolean>(false);
  const [aplicacao, setAplicacao] = useState<boolean>(false);
  
  // Preços editáveis
  const [materialPrices, setMaterialPrices] = useState<Record<string, MaterialPrice>>(DEFAULT_MATERIAL_PRICES);
  const [specialCutPrice, setSpecialCutPrice] = useState<number>(DEFAULT_SPECIAL_CUT_PRICE);
  const [editingPrices, setEditingPrices] = useState<boolean>(false);
  const [tempPrices, setTempPrices] = useState<Record<string, number>>({});
  const [tempSpecialCutPrice, setTempSpecialCutPrice] = useState<string>(String(DEFAULT_SPECIAL_CUT_PRICE));

  const calculateArea = (h: number, w: number, u: "m²" | "mm" | "cm"): number => {
    if (u === "m²") {
      return h * w;
    }
    const multiplier = u === "mm" ? 0.001 : 0.01;
    return h * multiplier * (w * multiplier);
  };

  const addItem = () => {
    const h = parseFloat(height);
    const w = parseFloat(width);
    const qty = parseInt(quantity) || 1;

    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      return;
    }

    const area = calculateArea(h, w, unit);
    const pricePerM2 = materialPrices[material].pricePerM2;
    const printingPrice = PRINTING_TYPES[printingType as keyof typeof PRINTING_TYPES]?.pricePerM2 || 0;
    const rigidPrice = RIGID_MATERIALS[rigidMaterial as keyof typeof RIGID_MATERIALS]?.pricePerM2 || 0;
    const versoCost = verso ? area * (printingPrice * 0.4) : 0;
    const specialCutCost = specialCut ? area * specialCutPrice : 0;
    const aplicacaoCost = aplicacao ? APLICACAO_PRICE : 0;
    const unitPrice = area * (pricePerM2 + printingPrice + rigidPrice) + versoCost + specialCutCost + aplicacaoCost;
    const totalPrice = unitPrice * qty;

    const newItem: StickerItem = {
      id: Date.now(),
      height: h,
      width: w,
      unit,
      material,
      printingType,
      rigidMaterial,
      verso,
      aplicacao,
      quantity: qty,
      area,
      unitPrice,
      totalPrice,
      specialCut,
      specialCutPrice: specialCutCost,
      versoPrice: versoCost,
      aplicacaoPrice: aplicacaoCost,
    };

    setItems([...items, newItem]);
    setHeight("");
    setWidth("");
    setQuantity("1");
    setSpecialCut(false);
    setVerso(false);
    setAplicacao(false);
    setRigidMaterial("sem_rigido");
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totalBudget = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getValidityDate = (date: Date): string => {
    const validityDate = new Date(date);
    validityDate.setDate(validityDate.getDate() + 7);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(validityDate);
  };

  const generatePDF = async (share: boolean = false) => {
    const doc = new jsPDF();
    const currentDate = new Date();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Orçamento de Impressões", 105, 20, { align: "center" });
    
    // Date and time
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${formatDate(currentDate)}`, 14, 35);
    
    // Table data
    const tableData = items.map((item) => [
      `${item.height} x ${item.width} ${item.unit}`,
      materialPrices[item.material]?.name || item.material,
      PRINTING_TYPES[item.printingType as keyof typeof PRINTING_TYPES]?.name || item.printingType,
      RIGID_MATERIALS[item.rigidMaterial as keyof typeof RIGID_MATERIALS]?.name || item.rigidMaterial,
      item.verso ? "Sim" : "Não",
      item.aplicacao ? "Sim" : "Não",
      item.specialCut ? "Sim" : "Não",
      `${(item.area * 10000).toFixed(2)} cm²`,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice),
    ]);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth * 0.95;
    const sideMargin = (pageWidth - tableWidth) / 2;
    const baseColumnWidths = [18, 22, 20, 16, 10, 10, 12, 14, 8, 18, 18];
    const totalBaseWidth = baseColumnWidths.reduce((sum, value) => sum + value, 0);
    const scaledColumnWidths = baseColumnWidths.map(
      (value) => (value * tableWidth) / totalBaseWidth
    );

    const columnStyles: Record<number, Partial<Styles>> = {
      0: { cellWidth: scaledColumnWidths[0] },
      1: { cellWidth: scaledColumnWidths[1] },
      2: { cellWidth: scaledColumnWidths[2] },
      3: { cellWidth: scaledColumnWidths[3] },
      4: { cellWidth: scaledColumnWidths[4], halign: "center" as const },
      5: { cellWidth: scaledColumnWidths[5], halign: "center" as const },
      6: { cellWidth: scaledColumnWidths[6], halign: "center" as const },
      7: { cellWidth: scaledColumnWidths[7], halign: "center" as const },
      8: { cellWidth: scaledColumnWidths[8], halign: "center" as const },
      9: { cellWidth: scaledColumnWidths[9], halign: "right" as const },
      10: { cellWidth: scaledColumnWidths[10], halign: "right" as const },
    };

    // Generate table
    autoTable(doc, {
      startY: 45,
      margin: { left: sideMargin, right: sideMargin },
      tableWidth,
      head: [["Tam.", "Material", "Impressão", "Rígido.", "Verso", "Aplic.", "Corte", "Área", "Qtd", "V. Unit", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles,
    });
    
    // Get final Y position after table
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 100;
    
    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total do Orçamento: ${formatCurrency(totalBudget)}`, 195, finalY + 15, { align: "right" });
    
    // Validity notice
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Este orçamento é válido por 7 dias a contar da data de emissão (até ${getValidityDate(currentDate)}).`,
      105,
      finalY + 30,
      { align: "center" }
    );
    
    // Footer
    doc.setFontSize(8);
    doc.text("Calculadora de Orçamento para Impressões", 105, 285, { align: "center" });
    
    if (share && navigator.share) {
      // Convert to blob for sharing
      const pdfBlob = doc.output("blob");
      const file = new File([pdfBlob], `orcamento-adesivos-${Date.now()}.pdf`, {
        type: "application/pdf",
      });
      
      try {
        await navigator.share({
          title: "Orçamento de Adesivos",
          text: `Orçamento gerado em ${formatDate(currentDate)}. Válido até ${getValidityDate(currentDate)}.`,
          files: [file],
        });
      } catch (error) {
        // Fallback to download if share fails
        doc.save(`orcamento-adesivos-${Date.now()}.pdf`);
      }
    } else {
      doc.save(`orcamento-adesivos-${Date.now()}.pdf`);
    }
  };

  const startEditingPrices = () => {
    const prices: Record<string, number> = {};
    Object.entries(materialPrices).forEach(([key, value]) => {
      prices[key] = value.pricePerM2;
    });
    setTempPrices(prices);
    setTempSpecialCutPrice(String(specialCutPrice));
    setEditingPrices(true);
  };

  const savePrices = () => {
    const newPrices = { ...materialPrices };
    Object.entries(tempPrices).forEach(([key, value]) => {
      if (newPrices[key]) {
        newPrices[key] = { ...newPrices[key], pricePerM2: value };
      }
    });
    setMaterialPrices(newPrices);
    setSpecialCutPrice(parseFloat(tempSpecialCutPrice) || DEFAULT_SPECIAL_CUT_PRICE);
    setEditingPrices(false);
  };

  const updateTempPrice = (key: string, value: string) => {
    setTempPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    
  <div className="space-y-6 "> 
    
    <div className="teste py-6 md:px-28 lg:px-48 sm:px-4" >
                
      {/* Formulário de entrada */}
      <Card className="border-border shadow-sm mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calculator className="h-5 w-5 text-primary" />
            Dimensione o Material para Calcular
          </CardTitle>
        </CardHeader>

        
        <CardContent>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm font-medium text-foreground">
                Altura (cm)
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="Ex: 10 (cm)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width" className="text-sm font-medium text-foreground">
                Largura (cm)
              </Label>
              <Input
                id="width"
                type="number"
                placeholder="Ex: 15 (cm)"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium text-foreground">
                Unidade
              </Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as "m²" | "mm" | "cm")}>
                <SelectTrigger id="unit" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="m²">m²</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="printing" className="text-sm font-medium text-foreground">
                Impressão
              </Label>
              <Select value={printingType} onValueChange={setPrintingType}>
                <SelectTrigger id="printing" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRINTING_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Adesivo" className="text-sm font-medium text-foreground">
                Adesivo
              </Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger id="Adesivo" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(materialPrices).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rigidMaterial" className="text-sm font-medium text-foreground">
                Material Rígido              
                </Label>
              <Select value={rigidMaterial} onValueChange={setRigidMaterial}>
                <SelectTrigger id="rigidMaterial" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RIGID_MATERIALS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-foreground">
                Quantidade
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="col-span-2 md:col-span-1 flex items-end gap-2">
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="specialCut"
                  checked={specialCut}
                  onCheckedChange={(checked) => setSpecialCut(checked as boolean)}
                />
                <Label htmlFor="specialCut" className="text-sm font-medium text-foreground cursor-pointer">
                  Recorte (+{formatCurrency(specialCutPrice)}/m²)
                </Label>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 flex items-end gap-2">
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="+verso"
                  checked={verso}
                  onCheckedChange={(checked) => setVerso(checked as boolean)}
                />
                <Label htmlFor="+verso" className="text-sm font-medium text-foreground cursor-pointer">
                  +Verso (+40% imp.)
                </Label>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 flex items-end gap-2">
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="aplicacao"
                  checked={aplicacao}
                  onCheckedChange={(checked) => setAplicacao(checked as boolean)}
                />
                <Label htmlFor="aplicacao" className="text-sm font-medium text-foreground cursor-pointer">
                  Aplicação (apenas rígido eco-solvente) (+{formatCurrency(APLICACAO_PRICE)})
                </Label>
              </div>
            </div>
            

            <div className="flex items-end">
              <Button
                onClick={addItem}
                className="w-full"
                disabled={!height || !width}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Preview do cálculo */}
          {height && width && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-sm">
              <span className="text-muted-foreground">Prévia: </span>
              <span className="font-medium text-foreground">
                {height} x {width} {unit} = {" "}
                {(calculateArea(parseFloat(height), parseFloat(width), unit) * 10000).toFixed(2)} cm²
                {" "}({materialPrices[material].name} - {formatCurrency(materialPrices[material].pricePerM2)}/m² + {PRINTING_TYPES[printingType as keyof typeof PRINTING_TYPES]?.name}{rigidMaterial !== "sem_rigido" && ` + ${RIGID_MATERIALS[rigidMaterial as keyof typeof RIGID_MATERIALS]?.name}`}{verso && " + Verso"})
                {specialCut && " + Recorte"}
              </span>
            </div>
          )}

          {/* Aviso de compra mínima */}
          {items.length > 0 && totalBudget < 35 && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-300">
              <p className="text-center text-sm font-medium text-yellow-700">
                ⚠️ Atenção: Compra mínima de {formatCurrency(35)}. Valor atual: {formatCurrency(totalBudget)}
              </p>
            </div>
          )}
        </CardContent>


          {/*
        <div className="observacao my-4 mx-4 p-4 bg-red-50 border border-red-200 rounded-lg ">
          <p className="text-center text-md font-sm text-primary">
            * A opção: <strong> Material cliente/Rígido </strong> deve estar de acordo com as 
            especificações técnicas para garantir a qualidade do serviço. Ex: Chapa de metal 20x30cm precisa estar
            devidamente reta e limpa para entrar na maquina UV! Tamanho máximo 60x90cm e altura maxima 15cm.
            Já uma aplicação de adesivo, geralmente tamanhos de 1.00m x (até) 2.00m para manter aplicação exata.
          </p>
        </div>*/}
      </Card>

      {/*  
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Tabela de Preços por Material
          </CardTitle>
          {!editingPrices ? (
            <Button variant="outline" size="sm" onClick={startEditingPrices}>
              <Settings2 className="h-4 w-4 mr-2" />
              Editar Preços
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={savePrices}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          )}
        </CardHeader>
        <CardContent>
           {/* Tabela preços editaveis 
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(materialPrices).map(([key, value]) => (
              <div
                key={key}
                className="p-3 rounded-lg bg-secondary/30 text-center border border-border/50"
              >
                <p className="text-sm font-medium text-foreground">{value.name}</p>
                {editingPrices ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={tempPrices[key] || ""}
                    onChange={(e) => updateTempPrice(key, e.target.value)}
                    className="mt-2 text-center h-8 bg-background"
                  />
                ) : (
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(value.pricePerM2)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">por m²</p>
              </div>
            ))}
            
            <div className="p-3 rounded-lg bg-accent/30 text-center border border-accent/50">
              <p className="text-sm font-medium text-foreground">Recorte Especial</p>
              {editingPrices ? (
                <Input
                  type="number"
                  step="0.01"
                  value={tempSpecialCutPrice}
                  onChange={(e) => setTempSpecialCutPrice(e.target.value)}
                  className="mt-2 text-center h-8 bg-background"
                />
              ) : (
                <p className="text-lg font-bold text-accent-foreground">
                  +{formatCurrency(specialCutPrice)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">adicional por m²</p>
            </div>
          </div> 
        </CardContent>
      </Card>*/}

      {/* Tabela de itens */}
      {items.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Itens do Orçamento
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generatePDF(false)}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => generatePDF(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Tam.</TableHead>
                    <TableHead className="text-foreground">Material</TableHead>
                    <TableHead className="text-foreground">Impressão</TableHead>
                    <TableHead className="text-foreground">Rígido</TableHead>
                    <TableHead className="text-foreground">Verso</TableHead>
                    <TableHead className="text-foreground">Aplicação</TableHead>
                    <TableHead className="text-foreground">Recorte Esp.</TableHead>
                    <TableHead className="text-foreground">Área (cm²)</TableHead>
                    <TableHead className="text-foreground">Qtd</TableHead>
                    <TableHead className="text-foreground text-right">Preço Unit.</TableHead>
                    <TableHead className="text-foreground text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.height} x {item.width} {item.unit}
                      </TableCell>
                      <TableCell>{materialPrices[item.material]?.name || item.material}</TableCell>
                      <TableCell>{PRINTING_TYPES[item.printingType as keyof typeof PRINTING_TYPES]?.name || item.printingType}</TableCell>
                      <TableCell>{RIGID_MATERIALS[item.rigidMaterial as keyof typeof RIGID_MATERIALS]?.name || item.rigidMaterial}</TableCell>
                      <TableCell className="text-center">
                        {item.verso ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.aplicacao ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.specialCut ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-center">
                        {(item.area * 10000).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total */}
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-foreground">
                  Total do Orçamento
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(totalBudget)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div> 
  </div>
  );
};

export default StickerCalculator;
