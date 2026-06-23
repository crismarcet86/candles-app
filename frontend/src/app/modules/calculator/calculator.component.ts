import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CalculationPresetsService } from './calculation-presets.service';

interface Ingredient {
  id: number;
  name: string;
  price: number;         // costo por unidad (precio de compra)
  unit_abbr: string;
  unit_name: string;
  category_name: string;
}

interface Mold {
  id: number;
  name: string;
  wax_grams: number;
}

interface CalcLine {
  ingredient_id: number | null;
  ingredient_name: string;
  grams: number;
  unit_cost: number;     // costo por gramo o por unidad
  unit_abbr: string;
  is_unit: boolean;      // true si se cobra por unidad (pabilo), false si por gramo
  subtotal: number;
  isWaxLine?: boolean;   // true = línea de cera, recibe gramos del molde automáticamente
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent implements OnInit {
  molds: Mold[] = [];
  ingredients: Ingredient[] = [];

  selectedMoldId: number | null = null;
  selectedMold: Mold | null = null;

  // Líneas de cálculo: cera fija + esencia + opcionales
  lines: CalcLine[] = [];

  sellPrice: number = 0;
  quantity: number  = 1;  // cuántas velas se calcula
  marginTarget: number = 0; // % de margen deseado

  loadingMolds = true;
  loadingIngredients = true;
  pdfLoading = false;

  // Guardar cálculo
  saveModal = false;
  saveName = '';
  saving = false;
  saveSuccess = '';
  saveError = '';
  editingPresetId: number | null = null;

  // Ver/cargar presets
  presetsModal = false;
  allPresets: any[] = [];
  loadingPresets = false;
  loadPresetError = '';

  constructor(private http: HttpClient, private presets: CalculationPresetsService) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/molds`).subscribe(r => {
      this.molds = r.data.filter((m: any) => m.is_active === 1);
      this.loadingMolds = false;
    });
    this.http.get<any>(`${environment.apiUrl}/products`).subscribe(r => {
      this.ingredients = r.data
        .filter((p: any) => p.is_active === 1)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          unit_abbr: p.unit_abbr,
          unit_name: p.unit_name,
          category_name: p.category_name
        }));
      this.loadingIngredients = false;
    });
  }

  onMoldChange(): void {
    this.selectedMold = this.molds.find(m => m.id === +this.selectedMoldId!) || null;
    this.lines = [];
    if (this.selectedMold) {
      // Primera línea marcada como wax: se auto-llena con wax_grams al elegir ingrediente
      this.lines.push({ ...this.emptyLine(), isWaxLine: true });
    }
  }

  private emptyLine(): CalcLine {
    return {
      ingredient_id: null,
      ingredient_name: '',
      grams: 0,
      unit_cost: 0,
      unit_abbr: 'g',
      is_unit: false,
      subtotal: 0,
      isWaxLine: false
    };
  }

  addLine(): void {
    this.lines.push(this.emptyLine());
  }

  removeLine(i: number): void {
    this.lines.splice(i, 1);
  }

  onIngredientChange(line: CalcLine): void {
    const ing = this.ingredients.find(i => i.id === +line.ingredient_id!);
    if (!ing) return;

    line.ingredient_name = ing.name;
    line.unit_abbr       = ing.unit_abbr;

    // Determinar si es por gramo (kg/g) o por unidad
    const unitLower = ing.unit_abbr.toLowerCase();
    if (unitLower === 'kg') {
      line.is_unit   = false;
      line.unit_cost = ing.price / 1000; // costo por gramo
    } else if (unitLower === 'g') {
      line.is_unit   = false;
      line.unit_cost = ing.price;
    } else {
      // pabilo u otras unidades
      line.is_unit   = true;
      line.unit_cost = ing.price;
    }

    // Línea de cera: auto-llenar con los gramos del molde
    if (line.isWaxLine && this.selectedMold) {
      line.grams = this.selectedMold.wax_grams;
    }

    this.recalcLine(line);
  }

  recalcLine(line: CalcLine): void {
    if (line.is_unit) {
      line.subtotal = line.unit_cost * (line.grams || 1); // grams = cantidad de unidades
    } else {
      line.subtotal = line.unit_cost * (line.grams || 0);
    }
  }

  get totalCostPerCandle(): number {
    return this.lines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
  }

  get totalCost(): number {
    return this.totalCostPerCandle * (this.quantity || 1);
  }

  get profit(): number {
    return (this.sellPrice || 0) - this.totalCostPerCandle;
  }

  get margin(): number {
    if (!this.totalCostPerCandle) return 0;
    return ((this.profit) / this.totalCostPerCandle) * 100;
  }

  get totalRevenue(): number {
    return (this.sellPrice || 0) * (this.quantity || 1);
  }

  get totalProfit(): number {
    return this.totalRevenue - this.totalCost;
  }

  get loading(): boolean {
    return this.loadingMolds || this.loadingIngredients;
  }

  get suggestedPrice(): number {
    if (!this.totalCostPerCandle) return 0;
    return this.totalCostPerCandle * (1 + this.marginTarget / 100);
  }

  applyMargin(): void {
    // solo actualiza el precio de venta si el margen es > 0
    if (this.marginTarget > 0) {
      this.sellPrice = Math.round(this.suggestedPrice * 100) / 100;
    }
  }

  useSuggestedPrice(): void {
    this.sellPrice = Math.round(this.suggestedPrice * 100) / 100;
  }

  downloadPdf(): void {
    this.pdfLoading = true;
    const body = {
      moldName:   this.selectedMold?.name,
      waxGrams:   this.selectedMold?.wax_grams,
      quantity:   this.quantity,
      sellPrice:  this.sellPrice,
      lines:      this.lines
    };
    this.http.post(`${environment.apiUrl}/calculator/pdf`, body, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calculo-vela.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.pdfLoading = false;
      },
      error: () => { this.pdfLoading = false; }
    });
  }

  openSaveModal(): void {
    this.saveName = this.editingPresetId
      ? (this.allPresets.find(p => p.id === this.editingPresetId)?.name || '')
      : (this.selectedMold ? this.selectedMold.name : '');
    this.saveSuccess = '';
    this.saveError = '';
    this.saveModal = true;
  }

  closeSaveModal(): void {
    this.saveModal = false;
    this.saveName = '';
    // editingPresetId is intentionally kept — preset stays in edit mode until save, reset, or explicit cancel
  }

  savePreset(): void {
    if (!this.saveName.trim()) return;
    this.saving = true;
    this.saveError = '';
    const payload = {
      name:          this.saveName.trim(),
      mold_name:     this.selectedMold?.name || null,
      wax_grams:     this.selectedMold?.wax_grams || null,
      quantity:      this.quantity,
      sell_price:    this.sellPrice,
      cost_per_unit: this.totalCostPerCandle,
      items:         this.lines
        .filter(l => l.ingredient_id && l.subtotal > 0)
        .map(l => ({
          ingredient_id:   l.ingredient_id,
          ingredient_name: l.ingredient_name,
          grams:           l.grams,
          is_unit:         l.is_unit,
          unit_abbr:       l.unit_abbr,
          unit_cost:       l.unit_cost,
          subtotal:        l.subtotal,
        }))
    };
    const request$ = this.editingPresetId
      ? this.presets.update(this.editingPresetId, payload)
      : this.presets.create(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        const verb = this.editingPresetId ? 'actualizado' : 'guardado';
        this.saveSuccess = `Cálculo "${this.saveName.trim()}" ${verb} correctamente`;
        this.saveModal = false;
        this.saveName = '';
        this.editingPresetId = null;
      },
      error: err => {
        this.saving = false;
        this.saveError = err?.error?.message || 'Error al guardar';
      }
    });
  }

  openPresetsModal(): void {
    this.presetsModal = true;
    this.loadingPresets = true;
    this.loadPresetError = '';
    this.presets.getAllIncludingInactive().subscribe({
      next: r => {
        this.allPresets = r.data;
        this.loadingPresets = false;
      },
      error: () => {
        this.loadPresetError = 'Error al cargar los cálculos guardados';
        this.loadingPresets = false;
      }
    });
  }

  closePresetsModal(): void {
    this.presetsModal = false;
  }

  loadPreset(preset: any): void {
    // Load the preset with items from backend
    this.presets.getById(preset.id).subscribe({
      next: r => {
        const p = r.data;
        // Set mold by matching name if possible
        const matchingMold = this.molds.find(m => m.name === p.mold_name);
        if (matchingMold) {
          this.selectedMoldId = matchingMold.id;
          this.selectedMold = matchingMold;
        } else {
          this.selectedMoldId = null;
          this.selectedMold = null;
        }

        this.quantity  = p.quantity || 1;
        this.sellPrice = Number(p.sell_price) || 0;
        this.marginTarget = 0;

        // Rebuild lines from preset items
        this.lines = (p.items || []).map((item: any, idx: number) => {
          const ing = this.ingredients.find(i => i.id === item.product_id);
          return {
            ingredient_id:   item.product_id || null,
            ingredient_name: item.ingredient_name || '',
            grams:           Number(item.grams) || 0,
            unit_cost:       Number(item.unit_cost) || 0,
            unit_abbr:       item.unit_abbr || 'g',
            is_unit:         !!item.is_unit,
            subtotal:        Number(item.subtotal) || 0,
            isWaxLine:       idx === 0 && !!matchingMold,
          } as CalcLine;
        });

        this.editingPresetId = preset.id;
        this.presetsModal = false;
        this.saveSuccess = '';
      },
      error: () => {
        this.loadPresetError = 'Error al cargar el cálculo';
      }
    });
  }

  reset(): void {
    this.selectedMoldId = null;
    this.selectedMold = null;
    this.lines = [];
    this.sellPrice = 0;
    this.quantity = 1;
    this.marginTarget = 0;
    this.editingPresetId = null;
    this.saveSuccess = '';
  }

  getCategories(): string[] {
    const cats = [...new Set(this.ingredients.map(i => i.category_name))];
    return cats.sort();
  }

  getByCategory(cat: string): Ingredient[] {
    return this.ingredients.filter(i => i.category_name === cat);
  }
}
