import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;
  logoUrl: string | null = null;
  businessName = 'Bienvenido';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private settings: SettingsService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.settings.load().subscribe(() => {
      this.logoUrl = this.settings.logoUrl;
      this.businessName = this.settings.businessName;
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const { username, password } = this.form.value;
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }

  field(name: string) { return this.form.get(name); }
}
