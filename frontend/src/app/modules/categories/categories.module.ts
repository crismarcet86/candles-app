import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CategoriesListComponent } from './categories-list/categories-list.component';
import { CategoriesFormComponent } from './categories-form/categories-form.component';

const routes: Routes = [
  { path: '',          component: CategoriesListComponent },
  { path: 'list',      redirectTo: '', pathMatch: 'full' },
  { path: 'new',       component: CategoriesFormComponent },
  { path: ':id/edit',  component: CategoriesFormComponent }
];

@NgModule({
  declarations: [CategoriesListComponent, CategoriesFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class CategoriesModule {}
