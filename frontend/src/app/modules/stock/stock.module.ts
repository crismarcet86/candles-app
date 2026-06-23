import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { StockComponent } from './stock.component';

const routes: Routes = [
  { path: '', component: StockComponent }
];

@NgModule({
  declarations: [StockComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class StockModule {}
