import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ProductsListComponent } from './products-list/products-list.component';
import { ProductsFormComponent } from './products-form/products-form.component';

const routes: Routes = [
  { path: '',         component: ProductsListComponent },
  { path: 'new',      component: ProductsFormComponent },
  { path: ':id/edit', component: ProductsFormComponent }
];

@NgModule({
  declarations: [ProductsListComponent, ProductsFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class ProductsModule {}
