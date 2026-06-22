import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { UsersListComponent } from './users-list/users-list.component';
import { UsersFormComponent } from './users-form/users-form.component';

const routes: Routes = [
  { path: '',          component: UsersListComponent },
  { path: 'list',      redirectTo: '', pathMatch: 'full' },
  { path: 'new',       component: UsersFormComponent },
  { path: ':id/edit',  component: UsersFormComponent }
];

@NgModule({
  declarations: [UsersListComponent, UsersFormComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class UsersModule {}
