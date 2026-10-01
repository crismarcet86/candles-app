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
  is_fragrance: number;  // 1 si su categoría es fragancia
}

interface Mold {
  id: number;
  name: string;
  wax_grams: number;
  mold_type_name?: string | null;
  mold_type_fragrance_pct?: number | null;
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
  fragrance_pct?: number | null; // % de fragancia aplicado sobre wax_grams del molde
  // UI state para dropdown buscable
  searchText?: string;
  dropdownOpen?: boolean;
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
  includesColor: boolean = false;
  colorCost: number = 0.10;
  extras: { name: string; cost: number }[] = [];
  laborCost: number = 0;
  laborHours: number = 1;

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
          category_name: p.category_name,
          is_fragrance: p.is_fragrance ?? 0
        }));
      this.loadingIngredients = false;
    });
  }

  // ── Dropdown buscable de moldes ─────────────────────────────────────────
  moldSearchText = '';
  moldDropdownOpen = false;

  get filteredMolds(): Mold[] {
    const q = this.moldSearchText.trim().toLowerCase();
    if (!q) return this.molds;
    return this.molds.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.id.toString().includes(q) ||
      (m.mold_type_name || '').toLowerCase().includes(q)
    );
  }

  openMoldDropdown(): void {
    this.moldSearchText = '';
    this.moldDropdownOpen = true;
  }

  onMoldBlur(): void {
    setTimeout(() => { this.moldDropdownOpen = false; }, 160);
  }

  selectMold(m: Mold): void {
    this.selectedMoldId = m.id;
    this.moldDropdownOpen = false;
    this.moldSearchText = '';
    this.onMoldChange();
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
      isWaxLine: false,
      fragrance_pct: null,
      searchText: '',
      dropdownOpen: false
    };
  }

  addLine(): void {
    this.lines.push(this.emptyLine());
  }

  removeLine(i: number): void {
    this.lines.splice(i, 1);
    this.recalcWaxLine();
  }

  onIngredientChange(line: CalcLine): void {
    const hadFragrance = (line.fragrance_pct || 0) > 0;

    const ing = this.ingredients.find(i => i.id === +line.ingredient_id!);
    if (!ing) return;

    line.ingredient_name = ing.name;
    line.unit_abbr       = ing.unit_abbr;

    // Si el nuevo ingrediente no es fragancia, limpiar el % y los gramos calculados
    if (!ing.is_fragrance) {
      line.fragrance_pct = null;
      if (hadFragrance) {
        line.grams = 0;
      }
    }

    // Determinar si es por gramo/ml o por unidad
    const unitLower = ing.unit_abbr.toLowerCase();
    if (unitLower === 'kg') {
      line.is_unit   = false;
      line.unit_cost = ing.price / 1000; // costo por gramo
    } else if (unitLower === 'g' || unitLower === 'ml') {
      line.is_unit   = false;
      line.unit_cost = ing.price; // costo por g o por ml
    } else {
      // pabilo u otras unidades
      line.is_unit   = true;
      line.unit_cost = ing.price;
    }

    // Línea de cera: auto-llenar con los gramos del molde menos fragrancias ya definidas
    if (line.isWaxLine && this.selectedMold) {
      const fragranceGrams = this.lines
        .filter(l => !l.isWaxLine && (l.fragrance_pct || 0) > 0)
        .reduce((sum, l) => sum + (l.grams || 0), 0);
      line.grams = Math.round((this.selectedMold.wax_grams - fragranceGrams) * 100) / 100;
    }

    this.recalcLine(line);
    // Recalcular cera si había fragancia y fue removida
    if (hadFragrance && !ing.is_fragrance) {
      this.recalcWaxLine();
    }

    // Fragancia: precargar el % del tipo de molde (editable, máx 10%)
    const typePct = Number(this.selectedMold?.mold_type_fragrance_pct) || 0;
    if (ing.is_fragrance && !line.isWaxLine && !(line.fragrance_pct || 0) && typePct > 0) {
      line.fragrance_pct = typePct;
      this.onFragrancePctChange(line);
    }
  }

  readonly MAX_FRAGRANCE_PCT = 10;

  onFragrancePctChange(line: CalcLine): void {
    if (!this.selectedMold) return;
    let pct = Number(line.fragrance_pct) || 0;
    if (pct > this.MAX_FRAGRANCE_PCT) pct = this.MAX_FRAGRANCE_PCT;
    if (pct < 0) pct = 0;
    if (line.fragrance_pct != null && Number(line.fragrance_pct) !== pct) line.fragrance_pct = pct;
    line.grams = Math.round(this.selectedMold.wax_grams * (pct / 100) * 100) / 100;
    this.recalcLine(line);
    this.recalcWaxLine();
  }

  recalcWaxLine(): void {
    if (!this.selectedMold) return;
    const waxLine = this.lines.find(l => l.isWaxLine);
    if (!waxLine) return;
    const fragranceGrams = this.lines
      .filter(l => !l.isWaxLine && (l.fragrance_pct || 0) > 0)
      .reduce((sum, l) => sum + (l.grams || 0), 0);
    waxLine.grams = Math.round((this.selectedMold.wax_grams - fragranceGrams) * 100) / 100;
    this.recalcLine(waxLine);
  }

  recalcLine(line: CalcLine): void {
    if (line.is_unit) {
      line.subtotal = line.unit_cost * (line.grams || 1); // grams = cantidad de unidades
    } else {
      line.subtotal = line.unit_cost * (line.grams || 0);
    }
  }

  get laborTotal(): number {
    return (this.laborCost || 0) * (this.laborHours || 1);
  }

  get extrasTotal(): number {
    return this.extras.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  }

  get totalCostPerCandle(): number {
    const linesCost = this.lines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
    return linesCost + (this.includesColor ? (Number(this.colorCost) || 0) : 0) + this.extrasTotal + this.laborTotal;
  }

  addExtra(): void {
    this.extras.push({ name: '', cost: 0 });
  }

  removeExtra(i: number): void {
    this.extras.splice(i, 1);
  }

  blockInvalidKey(e: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
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
      moldName:      this.selectedMold?.name,
      waxGrams:      this.selectedMold?.wax_grams,
      quantity:      this.quantity,
      sellPrice:     this.sellPrice,
      includesColor: this.includesColor,
      colorCost:     this.colorCost,
      laborCost:     this.laborCost,
      laborHours:    this.laborHours,
      extras:        this.extras.filter(e => e.name.trim() && e.cost > 0),
      lines:         this.lines.map(l => ({ ...l, isFragrance: this.isFragranceLine(l) }))
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
      name:           this.saveName.trim(),
      mold_name:      this.selectedMold?.name || null,
      wax_grams:      this.selectedMold?.wax_grams || null,
      quantity:       this.quantity,
      sell_price:     this.sellPrice,
      cost_per_unit:  this.totalCostPerCandle,
      includes_color: this.includesColor,
      color_cost:     this.colorCost,
      labor_cost:     this.laborCost,
      labor_hours:    this.laborHours,
      extras:         this.extras.filter(e => e.name.trim()).map(e => ({ name: e.name.trim(), cost: Number(e.cost) || 0 })),
      items:          this.lines
        .filter(l => l.ingredient_id && l.subtotal > 0)
        .map(l => ({
          ingredient_id:   l.ingredient_id,
          ingredient_name: l.ingredient_name,
          grams:           l.grams,
          is_unit:         l.is_unit,
          unit_abbr:       l.unit_abbr,
          unit_cost:       l.unit_cost,
          subtotal:        l.subtotal,
          fragrance_pct:   l.fragrance_pct ?? null,
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

        this.quantity      = p.quantity || 1;
        this.sellPrice     = Number(p.sell_price) || 0;
        this.marginTarget  = 0;
        this.includesColor = !!p.includes_color;
        this.colorCost     = p.color_cost != null ? Number(p.color_cost) : 0.10;
        this.extras        = (p.extras || []).map((e: any) => ({ name: e.name, cost: Number(e.cost) || 0 }));
        this.laborCost     = Number(p.labor_cost) || 0;
        this.laborHours    = Number(p.labor_hours) || 1;

        // Rebuild lines from preset items
        this.lines = (p.items || []).map((item: any, idx: number) => {
          return {
            ingredient_id:   item.product_id || null,
            ingredient_name: item.ingredient_name || '',
            grams:           Number(item.grams) || 0,
            unit_cost:       Number(item.unit_cost) || 0,
            unit_abbr:       item.unit_abbr || 'g',
            is_unit:         !!item.is_unit,
            subtotal:        Number(item.subtotal) || 0,
            isWaxLine:       idx === 0 && !!matchingMold,
            fragrance_pct:   item.fragrance_pct != null ? Number(item.fragrance_pct) : null,
            searchText:      '',
            dropdownOpen:    false,
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
    this.includesColor = false;
    this.colorCost = 0.10;
    this.extras = [];
    this.laborCost = 0;
    this.laborHours = 1;
  }

  // ── Dropdown buscable de productos ──────────────────────────────────────

  openLineDropdown(line: CalcLine): void {
    this.lines.forEach(l => { if (l !== line) l.dropdownOpen = false; });
    line.searchText = '';
    line.dropdownOpen = true;
  }

  onLineSearchInput(line: CalcLine, value: string): void {
    line.searchText = value;
  }

  onLineBlur(line: CalcLine): void {
    setTimeout(() => { line.dropdownOpen = false; }, 160);
  }

  selectIngredient(line: CalcLine, ing: Ingredient): void {
    line.ingredient_id = ing.id;
    line.dropdownOpen = false;
    line.searchText = '';
    this.onIngredientChange(line);
  }

  getFilteredIngredients(line: CalcLine): Ingredient[] {
    const q = (line.searchText || '').trim().toLowerCase();
    if (!q) return this.ingredients;
    return this.ingredients.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.toString().includes(q) ||
      i.category_name.toLowerCase().includes(q) ||
      i.unit_abbr.toLowerCase().includes(q)
    );
  }

  getFilteredCategories(line: CalcLine): string[] {
    const filtered = this.getFilteredIngredients(line);
    return [...new Set(filtered.map(i => i.category_name))].sort();
  }

  getFilteredByCategory(line: CalcLine, cat: string): Ingredient[] {
    return this.getFilteredIngredients(line).filter(i => i.category_name === cat);
  }

  // ────────────────────────────────────────────────────────────────────────

  isFragranceLine(line: CalcLine): boolean {
    if (!line.ingredient_id || line.isWaxLine) return false;
    const ing = this.ingredients.find(i => i.id === +line.ingredient_id!);
    return !!ing && ing.is_fragrance === 1;
  }

  getCategories(): string[] {
    const cats = [...new Set(this.ingredients.map(i => i.category_name))];
    return cats.sort();
  }

  getByCategory(cat: string): Ingredient[] {
    return this.ingredients.filter(i => i.category_name === cat);
  }
}
