import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportsComponent } from './reports.component';

const routes: Routes = [{ path: '', component: ReportsComponent }];

@NgModule({
  declarations: [ReportsComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class ReportsModule {}
