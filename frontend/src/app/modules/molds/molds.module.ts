import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MoldsListComponent } from './molds-list/molds-list.component';
import { MoldsFormComponent } from './molds-form/molds-form.component';

const routes: Routes = [
  { path: '',         component: MoldsListComponent },
  { path: 'new',      component: MoldsFormComponent },
  { path: ':id/edit', component: MoldsFormComponent }
];

@NgModule({
  declarations: [MoldsListComponent, MoldsFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class MoldsModule {}
