import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { UnitsListComponent } from './units-list/units-list.component';
import { UnitsFormComponent } from './units-form/units-form.component';

const routes: Routes = [
  { path: '',          component: UnitsListComponent },
  { path: 'list',      redirectTo: '', pathMatch: 'full' },
  { path: 'new',       component: UnitsFormComponent },
  { path: ':id/edit',  component: UnitsFormComponent }
];

@NgModule({
  declarations: [UnitsListComponent, UnitsFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class UnitsModule {}
