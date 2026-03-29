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
  specialCut: boolean;
  finishing: string;
  quantity: number;
  area: number;
  unitPrice: number;
  totalPrice: number;
  versoPrice: number;
}

interface MaterialPrice {
  name: string;
  pricePerM2: number;
}

// Preços por m² baseados em tipos comuns de adesivos
const DEFAULT_MATERIAL_PRICES: Record<string, MaterialPrice> = {
  sem_material: { name: "Não", pricePerM2: 0 },
  vinil_branco_fosco: { name: "Adesivo Vinil Fosco", pricePerM2: 80 },
  vinil_branco_brilho: { name: "Adesivo Vinil Brilho", pricePerM2: 80 },
  vinil_transparente_brilho: { name: "Adesivo Vinil Transparente", pricePerM2: 135 },
  papel_couche_fosco_150g: { name: "Couche Fosco 150g", pricePerM2: 0.80 },
  banner_brilho: { name: "Banner Brilho", pricePerM2: 15 },
  banner_fosco: { name: "Banner Fosco", pricePerM2: 15 },
};

// Materiais rígidos disponíveis
const RIGID_MATERIALS: Record<string, MaterialPrice> = {
  sem_rigido: { name: "Não", pricePerM2: 0 },
  forn_cliente: { name: "Material Cliente", pricePerM2: 200 },
  ps_1mm: { name: "PS 1mm", pricePerM2: 200 },
  ps_2mm: { name: "PS 2mm", pricePerM2: 250 },
  ps_3mm: { name: "PS 3mm", pricePerM2: 380 },
  acrilico_2mm: { name: "Acrílico 2mm", pricePerM2: 400 },
  acrilico_3mm: { name: "Acrílico 3mm", pricePerM2: 500 },
  acrilico_6mm: { name: "Acrílico 6mm", pricePerM2: 600 },
};

// Tipos de impressão disponíveis
const PRINTING_TYPES = {
  sem_impressao: { name: "Sem impressão", pricePerM2: 0 },
  eco_solvente: { name: "Eco-solvente", pricePerM2: 55 },
  uv: { name: "Imp. UV", pricePerM2: 48 },
  //* laser: { name: "Imp. Laser", pricePerM2: 45,*/}
};

// Acabamentos disponíveis
const FINISHING_TYPES: Record<string, MaterialPrice> = {
  sem_acabamento: { name: "Sem acabamento", pricePerM2: 0 },
 // laminacao_brilho: { name: "Laminação Brilho", pricePerM2: 50 },
 // laminacao_fosco: { name: "Laminação Fosco", pricePerM2: 50 },
  com_ilhos: { name: "Com Ilhós", pricePerM2: 10 },
  com_madeira: { name: "Com Madeira", pricePerM2: 10 },
  aplicacao_cavalete: { name: "Aplicação em cavalete", pricePerM2: 60 },
};

const MINIMUM_PURCHASE = 60;



const StickerCalculator = () => {
  const [items, setItems] = useState<StickerItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [unit, setUnit] = useState<"m²" | "mm" | "cm">("cm");
  const [material, setMaterial] = useState<string>("sem_material");
  const [printingType, setPrintingType] = useState<string>("sem_impressao");
  const [rigidMaterial, setRigidMaterial] = useState<string>("sem_rigido");
  const [quantity, setQuantity] = useState<string>("1");
  const [verso, setVerso] = useState<boolean>(false);
  const [specialCut, setSpecialCut] = useState<boolean>(false);
  const [finishing, setFinishing] = useState<string>("sem_acabamento");
  
  // Preços editáveis
  const [materialPrices, setMaterialPrices] = useState<Record<string, MaterialPrice>>(DEFAULT_MATERIAL_PRICES);
  const [editingPrices, setEditingPrices] = useState<boolean>(false);
  const [tempPrices, setTempPrices] = useState<Record<string, number>>({});

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

    if (qty > 100000) {
      alert("Quantidade máxima permitida: 1000 unidades");
      return;
    }

    if (material === "sem_material" && rigidMaterial === "sem_rigido") {
      alert("É obrigatório escolher Adesivo ou Material Rígido");
      return;
    }

    // Converter para cm para validação
    const convertToCm = (value: number, u: "m²" | "mm" | "cm"): number => {
      if (u === "mm") return value / 10;
      if (u === "cm") return value;
      if (u === "m²") return Math.sqrt(value) * 100; // aproximado
      return value;
    };

    const hCm = convertToCm(h, unit);
    const wCm = convertToCm(w, unit);

    // Validações de impressão
    if (printingType === "uv") {
      if (hCm > 60 || wCm > 90) {
        alert("Impressão UV: máximo 60cm x 90cm");
        return;
      }
    }

    if (printingType === "eco_solvente") {
      if (hCm > 180 || wCm > 5000) { // 1.80m = 180cm, 50m = 5000cm
        alert("Impressão Eco-solvente: máximo 1.80m x 50m");
        return;
      }
    }

    const area = calculateArea(h, w, unit);
    const pricePerM2 = materialPrices[material].pricePerM2;
    const printingPrice = PRINTING_TYPES[printingType as keyof typeof PRINTING_TYPES]?.pricePerM2 || 0;
    const rigidPrice = RIGID_MATERIALS[rigidMaterial as keyof typeof RIGID_MATERIALS]?.pricePerM2 || 0;
    const finishingPrice = FINISHING_TYPES[finishing as keyof typeof FINISHING_TYPES]?.pricePerM2 || 0;
    const specialCutPrice = specialCut ? 70 : 0;
    
    // Aplicar 40% de acréscimo para peças menores que 3x3cm (área < 0.0009 m²)
    const isSmallPiece = area < 0.0009;
    const smallPieceMultiplier = isSmallPiece ? 1.4 : 1;
    
    const versoCost = verso ? area * (printingPrice * 0.4) : 0;
    const unitPrice = area * (pricePerM2 + printingPrice + rigidPrice + finishingPrice + specialCutPrice) * smallPieceMultiplier + versoCost;
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
      specialCut,
      finishing,
      quantity: qty,
      area,
      unitPrice,
      totalPrice,
      versoPrice: versoCost,
    };

    setItems([...items, newItem]);
    setHeight("");
    setWidth("");
    setQuantity("");
    setVerso(false);
    setSpecialCut(false);
    setFinishing("sem_acabamento");
    setRigidMaterial("sem_rigido");
    setPrintingType("sem_impressao");
    setMaterial("sem_material");
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
    const trimmedName = customerName.trim();

    if (!trimmedName) {
      alert("Nome do cliente é obrigatório para gerar o orçamento");
      return;
    }

    const doc = new jsPDF();
    const currentDate = new Date();
    
    // Header with logo
    try {
      const logoImg = new Image();
      logoImg.src = 'logo.png';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        setTimeout(reject, 2000); // timeout após 2s
      });
      
      // Calcular proporção para não distorcer
      const logoWidth = 25;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      doc.addImage(logoImg, 'PNG', 14, 12, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Logo não carregada:', error);
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Orça Fácil | Copiadora Paraná Laser", 105, 20, { align: "center" });
    
    // Date and time
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${formatDate(currentDate)}`, 14, 35);
    doc.text(`Cliente: ${trimmedName}`, 14, 40);
    
    // Validity notice in header (right side)
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(0, 0, 0);
    doc.text(`Orçamento Válido até: ${getValidityDate(currentDate)}`, 195, 35, { align: "right" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    // Table data
    const tableData = items.map((item) => [
      `${item.height} x ${item.width} ${item.unit}`,
      materialPrices[item.material]?.name || item.material,
      PRINTING_TYPES[item.printingType as keyof typeof PRINTING_TYPES]?.name || item.printingType,
      RIGID_MATERIALS[item.rigidMaterial as keyof typeof RIGID_MATERIALS]?.name || item.rigidMaterial,
      FINISHING_TYPES[item.finishing as keyof typeof FINISHING_TYPES]?.name || item.finishing,
      item.verso ? "Sim" : "Não",
      item.specialCut ? "Sim" : "Não",
      `${(item.area * 10000).toFixed(2)} cm²`,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice),
    ]);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth * 0.95;
    const sideMargin = (pageWidth - tableWidth) / 2;
    const baseColumnWidths = [17, 20, 18, 16, 16, 10, 14, 14, 10, 17, 17];
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
      9: { cellWidth: scaledColumnWidths[9], halign: "center" as const },
      10: { cellWidth: scaledColumnWidths[10], halign: "center" as const },
    };

    // Generate table
    autoTable(doc, {
      startY: 45,
      margin: { left: sideMargin, right: sideMargin },
      tableWidth,
      head: [["Tam.", "Adesivo", "Impressão", "Rígido.", "Acabamento", "Verso", "Corte Esp.", "Área", "Qtd", "Valor Unit.", "Total"]],
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
    
    
    
    let observationsY = finalY + 45;
    
    // Observações condicionais
    if (totalBudget < MINIMUM_PURCHASE) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      const valueMin = formatCurrency(MINIMUM_PURCHASE);
      const valueActual = formatCurrency(totalBudget);
      
      const lineHeight = 4;
      const boxPadding = 7;
      const boxTop = observationsY;
      let currentY = observationsY + boxPadding + lineHeight;
      
      // Texto em preto com valores em vermelho - linha 1
      doc.setTextColor(0, 0, 0);
      const text1 = "ATENÇÃO: VALOR MÍNIMO: ";
      const text1Width = doc.getTextWidth(text1);
      const valueMinWidth = doc.getTextWidth(valueMin);
      const text2 = " VALOR ATUAL: ";
      const text2Width = doc.getTextWidth(text2);
      const valueActualWidth = doc.getTextWidth(valueActual);
      
      const totalWidth = text1Width + valueMinWidth + text2Width + valueActualWidth;
      let xPos = 105 - totalWidth / 2;
      
      doc.text(text1, xPos, currentY);
      xPos += text1Width;
      doc.setTextColor(220, 0, 0);
      doc.text(valueMin, xPos, currentY);
      xPos += valueMinWidth;
      doc.setTextColor(0, 0, 0);
      doc.text(text2, xPos, currentY);
      xPos += text2Width;
      doc.setTextColor(220, 0, 0);
      doc.text(valueActual, xPos, currentY);
      
      // Segunda linha
      currentY += lineHeight;
      doc.setTextColor(0, 0, 0);
      doc.text("Adicione quantidade maior ou mais itens até atingir o valor mínimo", 105, currentY, { align: "center" });
      
      // Desenhar retângulo ao redor
      const boxHeight = 2 * lineHeight + boxPadding * 2;
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(0.6);
      doc.rect(15, boxTop, 180, boxHeight);
      
      observationsY += boxHeight + 6;
    }

    if (items.some(item => item.quantity === 100000)) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 50, 50);
      const obs1Lines = doc.splitTextToSize(
        "OBSERVAÇÃO: Para orçamentos com mais de 100000 unidades, entre em contato pelo WhatsApp 4199679-9517 enviando este PDF.",
        180
      );
      doc.text(obs1Lines, 105, observationsY, { align: "center" });
      observationsY += obs1Lines.length * 5;
    }
    
    if (items.some(item => item.rigidMaterial === "forn_cliente")) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 50, 50);
      const obs2Lines = doc.splitTextToSize(
        "* A opção: Rígido (Material fornecido pelo Cliente) deve estar de acordo com as especificações técnicas para garantir a qualidade do serviço. Ex: Chapa de metal 20x30cm precisa estar devidamente reta, não torta e limpa para entrar na maquina de impressão UV! Tamanho máximo 60x90cm e altura maxima 15cm. Já uma aplicação de adesivo, geralmente tamanhos de 1.00m x (até) 2.00m para manter aplicação exata.",
        180
      );
      doc.text(obs2Lines, 105, observationsY, { align: "center" });
      observationsY += obs2Lines.length * 5;
    }
    
    // Footer
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    // Footer with payment and WhatsApp info
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("O pedido será iniciado após a confirmação do pagamento: PIX: 01.906.658/0001-20 (enviar comprovante junto com arquivo) pelo WhatsApp: 4199679-9517 ;", 14, 265, { align: "left", maxWidth: 180 });
    doc.text("Produção em até 2 dias úteis (após aprovação da arte);", 14, 269, { align: "left" });
    doc.text("Arte: Não produzimos arte;", 14, 273, { align: "left" });
    doc.text("*Os adesivos são orçados já com meio corte e entrega em cartelas para facilitar envio!", 14, 277, { align: "left", maxWidth: 150 });
    
    doc.setFontSize(8);
    doc.text("Orça Fácil - Calculadora de Orçamento rápido", 105, 283, { align: "center" });
    
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
            <div className="space-y-2 col-span-2 md:col-span-3">
              <Label htmlFor="customerName" className="text-sm font-medium text-foreground">
                Nome do Cliente
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Ex: Joao Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-background"
              />
            </div>
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
              <Label htmlFor="rigidMaterial" className="text-sm font-medium text-foreground">
                Material Rígido              
                </Label>
              <Select 
                value={rigidMaterial} 
                onValueChange={(value) => {
                  setRigidMaterial(value);
                  if (value !== "sem_rigido") {
                    setMaterial("sem_material");
                  } else {
                    setVerso(false);
                  }
                }}
                disabled={material !== "sem_material"}
              >
                <SelectTrigger id="rigidMaterial" className="bg-background" disabled={material !== "sem_material"}>
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
              <Label htmlFor="Adesivo" className="text-sm font-medium text-foreground">
                Adesivo
              </Label>
              <Select 
                value={material} 
                onValueChange={(value) => {
                  setMaterial(value);
                  if (value !== "sem_material") {
                    setRigidMaterial("sem_rigido");
                    setSpecialCut(false);
                  }
                  if (value !== "banner_brilho" && value !== "banner_fosco") {
                    setFinishing("sem_acabamento");
                  }
                }}
                disabled={rigidMaterial !== "sem_rigido"}
              >
                <SelectTrigger id="Adesivo" className="bg-background" disabled={rigidMaterial !== "sem_rigido"}>
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
              <Label htmlFor="finishing" className="text-sm font-medium text-foreground">
                Acabamento
              </Label>
              <Select 
                value={finishing} 
                onValueChange={setFinishing}
                disabled={material !== "banner_brilho" && material !== "banner_fosco"}
              >
                <SelectTrigger 
                  id="finishing" 
                  className="bg-background" 
                  disabled={material !== "banner_brilho" && material !== "banner_fosco"}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FINISHING_TYPES).map(([key, value]) => (
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
                placeholder="Ex: 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-background"
              />
            </div>

            

             <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="+verso"
                  checked={verso}
                  onCheckedChange={(checked) => setVerso(checked as boolean)}
                  disabled={rigidMaterial === "sem_rigido"}
                />
                <Label 
                  htmlFor="+verso" 
                  className={`text-sm cursor-pointer ${
                    rigidMaterial === "sem_rigido" 
                      ? "text-muted-foreground opacity-50" 
                      : "text-foreground"
                  }`}
                >
                  +Verso (Se dois lados impressos)
                </Label>
              </div>
            </div>

             <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="specialCut"
                  checked={specialCut}
                  onCheckedChange={(checked) => setSpecialCut(checked as boolean)}
                  disabled={material !== "sem_material"}
                />
                <Label 
                  htmlFor="specialCut" 
                  className={`text-sm cursor-pointer ${
                    material !== "sem_material" 
                      ? "text-muted-foreground opacity-50" 
                      : "text-foreground"
                  }`}
                >
                  *Corte Especial (Corte laser)
                </Label>
              </div>
            </div>

            <div className="col-span-2 md:col-span-3 flex items-end">
              <Button
                onClick={addItem}
                className="w-full md:w-auto md:px-8"
                disabled={!height || !width || (material === "sem_material" && rigidMaterial === "sem_rigido")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Aviso de compra mínima */}
          {items.length > 0 && totalBudget < 60 && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-300">
              <p className="text-center text-sm font-medium text-yellow-700">
                ⚠️ Atenção: Compra mínima de {formatCurrency(60)}. Valor atual: {formatCurrency(totalBudget)}
              </p>
            </div>
          )}
        </CardContent> 
        {items.some(item => item.quantity === 100000) && (
          <div className="observacao my-4 mx-4 p-4 bg-red-50 border border-red-300 rounded-lg ">
            <p className="text-center text-sm font-sm text-primary">
              Esse app esta em constante evolução para um melhor atendimento, caso necessite de orçamento com mais de 100 unidades,
              entre em contato pelo WhatsApp <strong>4199679-9517</strong> enviando o PDF gerado automaticamente pelo sistema!
            </p> 
          </div>
        )}
        {items.some(item => item.rigidMaterial === "forn_cliente") && (
          <div className="observacao mt-3 my-4 mx-4 p-4 bg-red-50 border border-red-200 rounded-lg ">
            <p className="text-center text-sm font-sm text-primary">
              * A opção: <strong> Rígido (Material fornecido pelo Cliente) </strong> deve estar de acordo com as 
              especificações técnicas para garantir a qualidade do serviço. Ex: Chapa de metal 20x30cm precisa estar
              devidamente reta, não torta e limpa para entrar na maquina de impressão UV! Tamanho máximo 60x90cm e altura maxima 15cm.
              Já uma aplicação de adesivo, geralmente tamanhos de 1.00m x (até) 2.00m para manter aplicação exata.
            </p>
          </div>
        )}

             
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
          <CardHeader className="pb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-center">
            <CardTitle className="text-lg font-semibold text-foreground">
              Itens do Orçamento
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row md:justify-self-end">
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
                    <TableHead className="text-foreground">Tamamho</TableHead>
                    <TableHead className="text-foreground">Adesivo</TableHead>
                    <TableHead className="text-foreground">Impressão</TableHead>
                    <TableHead className="text-foreground">Rígido</TableHead>
                    <TableHead className="text-foreground">Acabamento</TableHead>
                    <TableHead className="text-foreground">Verso</TableHead>
                    <TableHead className="text-foreground">Área (cm²)</TableHead>
                    <TableHead className="text-foreground text-left">Qtd</TableHead>
                    <TableHead className="text-foreground text-right">Valor Unit.</TableHead>
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
                      <TableCell>{FINISHING_TYPES[item.finishing as keyof typeof FINISHING_TYPES]?.name || item.finishing}</TableCell>
                      <TableCell className="text-center">
                        {item.verso ? "Sim" : "Não"}
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
