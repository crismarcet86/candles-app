import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CalculatorComponent } from './calculator.component';

const routes: Routes = [
  { path: '', component: CalculatorComponent }
];

@NgModule({
  declarations: [CalculatorComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class CalculatorModule {}
