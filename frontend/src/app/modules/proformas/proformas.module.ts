import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ProformasListComponent } from './proformas-list/proformas-list.component';
import { ProformasFormComponent } from './proformas-form/proformas-form.component';
import { ProformasDetailComponent } from './proformas-detail/proformas-detail.component';

const routes: Routes = [
  { path: '',         component: ProformasListComponent },
  { path: 'new',      component: ProformasFormComponent },
  { path: ':id',      component: ProformasDetailComponent },
  { path: ':id/edit', component: ProformasFormComponent }
];

@NgModule({
  declarations: [ProformasListComponent, ProformasFormComponent, ProformasDetailComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class ProformasModule {}
