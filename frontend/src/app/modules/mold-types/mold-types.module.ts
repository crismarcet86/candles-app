import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { MoldTypesListComponent } from './mold-types-list/mold-types-list.component';
import { MoldTypeFormComponent }  from './mold-type-form/mold-type-form.component';

const routes: Routes = [
  { path: '',           component: MoldTypesListComponent },
  { path: 'new',        component: MoldTypeFormComponent },
  { path: ':id/edit',   component: MoldTypeFormComponent }
];

@NgModule({
  declarations: [MoldTypesListComponent, MoldTypeFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class MoldTypesModule {}
