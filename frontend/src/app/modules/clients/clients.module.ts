import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ClientsListComponent } from './clients-list/clients-list.component';
import { ClientsFormComponent } from './clients-form/clients-form.component';

const routes: Routes = [
  { path: '',         component: ClientsListComponent },
  { path: 'new',      component: ClientsFormComponent },
  { path: ':id/edit', component: ClientsFormComponent }
];

@NgModule({
  declarations: [ClientsListComponent, ClientsFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class ClientsModule {}
